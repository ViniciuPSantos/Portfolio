import { z } from 'astro/zod';

export const contactSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  email: z.string().trim().max(254).pipe(z.email()),
  mensagem: z.string().trim().min(10).max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Campo honeypot: escondido de pessoas; se vier preenchido, é bot. */
export const HONEYPOT_FIELD = 'site';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Remove quebras de linha e caracteres de controle (evita header injection no assunto). */
function singleLine(value: string): string {
  return value.replace(/[\r\n\t\u0000-\u001f\u007f]+/g, ' ').trim();
}

export function buildEmail(input: ContactInput): { subject: string; html: string; text: string } {
  const name = singleLine(input.nome);
  const subject = `Nova mensagem pelo portfólio — ${name}`.slice(0, 200);
  const text = [`Nome: ${name}`, `E-mail: ${input.email}`, '', input.mensagem].join('\n');
  const html = `<!doctype html>
<html lang="pt-BR"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p><strong>Nome:</strong> ${escapeHtml(name)}<br>
<strong>E-mail:</strong> ${escapeHtml(input.email)}</p>
<p style="white-space:pre-wrap">${escapeHtml(input.mensagem)}</p>
</body></html>`;
  return { subject, html, text };
}

/**
 * Rate limit simples por IP (janela deslizante).
 *
 * ATENÇÃO: fica em memória da instância. Em serverless cada instância tem o
 * próprio Map e ele some quando a instância é reciclada, então o limite não é
 * distribuído nem garantido. Serve para frear abuso casual; para algo rígido,
 * use um armazenamento compartilhado (ex.: Upstash Redis / Vercel KV).
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private readonly max: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(max: number, windowMs: number, now: () => number = Date.now) {
    this.max = max;
    this.windowMs = windowMs;
    this.now = now;
  }

  /** Registra uma tentativa. Retorna os segundos de espera se bloqueado, ou 0. */
  hit(key: string): number {
    const now = this.now();
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return Math.ceil((recent[0]! + this.windowMs - now) / 1000);
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 5000) this.prune(now);
    return 0;
  }

  private prune(now: number) {
    for (const [key, times] of this.hits) {
      if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(key);
    }
  }
}
