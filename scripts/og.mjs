// Gera as OG images estáticas (1200×630) no visual terminal.
// Uso: node scripts/og.mjs  → public/og/og-pt.png e public/og/og-en.png
// Usa o sharp (instalado com o Astro). A fonte monoespaçada vem do sistema.
import sharp from 'sharp';

const W = 1200;
const H = 630;
const MONO = "'JetBrains Mono', 'Cascadia Mono', Consolas, 'DejaVu Sans Mono', monospace";

const copy = {
  pt: {
    tagline: ['Desenvolvedor backend. APIs em Java/Spring Boot', 'e C#/.NET, do código ao deploy em produção.'],
    lines: [
      ['cat agora.txt', 'backend @ xp inc. · ads @ são judas'],
      ['ls projetos/', 'fluxen/  ritmo/  telegram-bot/'],
    ],
  },
  en: {
    tagline: ['Backend developer. APIs in Java/Spring Boot', 'and C#/.NET, from code to production.'],
    lines: [
      ['cat now.txt', 'backend @ xp inc. · são paulo, brazil'],
      ['ls projects/', 'fluxen/  ritmo/  telegram-bot/'],
    ],
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svg(lang) {
  const c = copy[lang];
  let y = 380;
  const lines = c.lines
    .map(([cmd, out]) => {
      const block = `
      <text x="112" y="${y}" font-size="24" fill="#EDEDED"><tspan fill="#B07CFF">$</tspan> ${esc(cmd)}</text>
      <text x="112" y="${y + 36}" font-size="24" fill="#A1A1A1">${esc(out)}</text>`;
      y += 88;
      return block;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0A0A0A"/>
  <rect x="48" y="40" width="${W - 96}" height="${H - 80}" rx="16" fill="#111111" stroke="#262626" stroke-width="2"/>
  <line x1="48" y1="100" x2="${W - 48}" y2="100" stroke="#1F1F1F" stroke-width="2"/>
  <circle cx="84" cy="70" r="8" fill="#333333"/>
  <circle cx="112" cy="70" r="8" fill="#333333"/>
  <circle cx="140" cy="70" r="8" fill="#333333"/>
  <g font-family="${MONO}">
    <text x="170" y="78" font-size="20" fill="#8A8A8A">zsh — viniciusps.tech</text>
    <text x="112" y="168" font-size="24" fill="#8A8A8A"><tspan fill="#B07CFF">$</tspan> whoami</text>
    <text x="112" y="236" font-size="60" font-weight="700" fill="#EDEDED">Vinicius Santos</text>
  </g>
  <g font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="26" fill="#A1A1A1">
    <text x="112" y="284">${esc(c.tagline[0])}</text>
    <text x="112" y="318">${esc(c.tagline[1])}</text>
  </g>
  <g font-family="${MONO}">${lines}
    <text x="112" y="${y}" font-size="24" fill="#B07CFF">$</text>
    <rect x="134" y="${y - 22}" width="14" height="28" fill="#8804E5"/>
  </g>
</svg>`;
}

for (const lang of ['pt', 'en']) {
  const out = `public/og/og-${lang}.png`;
  await sharp(Buffer.from(svg(lang))).png({ compressionLevel: 9 }).toFile(out);
  console.log('ok', out);
}
