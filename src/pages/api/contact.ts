import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY } from 'astro:env/server';
import { Resend } from 'resend';
import { HONEYPOT_FIELD, RateLimiter, buildEmail, contactSchema, escapeHtml } from '../../lib/contact';
import { isLang, routes, t, type Lang } from '../../i18n/utils';

export const prerender = false;

const MAX_BODY_BYTES = 20_000;
const limiter = new RateLimiter(5, 60 * 60 * 1000); // 5 mensagens por hora por IP

type ErrorCode = 'invalid' | 'rate_limited' | 'unsupported' | 'server';

function clientIp(request: Request, fallback: string): string {
  // Na Vercel, x-forwarded-for é definido pela borda; o primeiro IP é o do cliente.
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || fallback || 'unknown';
}

async function readBody(request: Request): Promise<{ data: Record<string, unknown>; json: boolean } | null> {
  const type = request.headers.get('content-type') ?? '';
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return null;
  if (type.includes('application/json')) {
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? { data: parsed as Record<string, unknown>, json: true } : null;
    } catch {
      return null;
    }
  }
  if (type.includes('application/x-www-form-urlencoded')) {
    return { data: Object.fromEntries(new URLSearchParams(raw)), json: false };
  }
  return null;
}

/** Resposta para quem enviou sem JS (form nativo): uma página simples. */
function htmlPage(lang: Lang, ok: boolean, code: ErrorCode | null, status: number, headers: HeadersInit = {}): Response {
  const d = t(lang).contact;
  const message = ok
    ? d.form.success
    : code === 'invalid'
      ? d.form.errorInvalid
      : code === 'rate_limited'
        ? d.form.errorRate
        : d.form.errorGeneric;
  const back = `${routes.section(lang, 'contact')}`;
  const body = `<!doctype html>
<html lang="${t(lang).meta.htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(d.page.title)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0A0A0A;color:#EDEDED;font-family:ui-monospace,monospace;padding:24px}
main{max-width:560px;display:flex;flex-direction:column;gap:16px}h1{margin:0;font-size:24px}p{margin:0;color:#A1A1A1;line-height:1.6;font-family:system-ui,sans-serif}
a{color:#B07CFF;min-height:44px;display:inline-flex;align-items:center}.err{color:#FCA5A5}</style></head>
<body><main><h1>${escapeHtml(ok ? d.page.okTitle : d.page.errTitle)}</h1>
<p class="${ok ? '' : 'err'}" role="${ok ? 'status' : 'alert'}">${escapeHtml(message)}</p>
<a href="${back}">${escapeHtml(d.page.back)}</a></main></body></html>`;
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}

function jsonResponse(body: object, status: number, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: Awaited<ReturnType<typeof readBody>>;
  try {
    body = await readBody(request);
  } catch {
    body = null;
  }

  const wantsJson =
    body?.json ??
    [request.headers.get('accept'), request.headers.get('content-type')].some((h) => h?.includes('application/json'));
  const lang: Lang = body && isLang(body.data.lang) ? body.data.lang : 'pt';

  const reply = (ok: boolean, code: ErrorCode | null, status: number, headers: HeadersInit = {}) =>
    wantsJson ? jsonResponse(ok ? { ok } : { ok, error: code }, status, headers) : htmlPage(lang, ok, code, status, headers);

  if (!body) return reply(false, 'unsupported', 400);

  const ip = clientIp(request, clientAddress);
  const retryAfter = limiter.hit(ip);
  if (retryAfter > 0) return reply(false, 'rate_limited', 429, { 'Retry-After': String(retryAfter) });

  // Honeypot preenchido: finge sucesso para não dar pista ao bot.
  const honeypot = body.data[HONEYPOT_FIELD];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return reply(true, null, 200);

  const parsed = contactSchema.safeParse(body.data);
  if (!parsed.success) return reply(false, 'invalid', 400);

  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    console.error('[contact] variáveis do Resend ausentes');
    return reply(false, 'server', 503);
  }

  try {
    const email = buildEmail(parsed.data);
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: CONTACT_FROM_EMAIL,
      to: CONTACT_TO_EMAIL,
      replyTo: parsed.data.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    if (error) {
      console.error('[contact] Resend recusou o envio:', error.name);
      return reply(false, 'server', 502);
    }
    return reply(true, null, 200);
  } catch {
    console.error('[contact] falha inesperada ao enviar');
    return reply(false, 'server', 500);
  }
};
