// Gera as OG images (1200×630) em public/og/og-pt.png e og-en.png.
// Uso: npm run og
// satori converte o layout (com as fontes reais, texto vira curvas) em SVG;
// o sharp rasteriza para PNG. Fontes: @fontsource (woff, que o satori aceita).
import fs from 'node:fs';
import satori from 'satori';
import sharp from 'sharp';

const font = (pkg, file) => fs.readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`);
const fonts = [
  { name: 'JetBrains Mono', data: font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'JetBrains Mono', data: font('jetbrains-mono', 'jetbrains-mono-latin-700-normal.woff'), weight: 700, style: 'normal' },
  { name: 'Inter', data: font('inter', 'inter-latin-400-normal.woff'), weight: 400, style: 'normal' },
];

// Foto em 2x (720px) com corte quadrado; o layout a exibe em 360×360.
// Corta a faixa escura de ~12px na borda esquerda da foto original antes de redimensionar.
const meta = await sharp('src/assets/foto.jpg').metadata();
const photo = await sharp('src/assets/foto.jpg')
  .extract({ left: 14, top: 0, width: meta.width - 14, height: meta.height })
  .resize(720, 720, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 90 })
  .toBuffer();
const photoSrc = `data:image/jpeg;base64,${photo.toString('base64')}`;

const C = {
  bg: '#0A0A0A',
  surface: '#111111',
  border: '#262626',
  borderSoft: '#1F1F1F',
  borderStrong: '#333333',
  text: '#EDEDED',
  muted: '#A1A1A1',
  dim: '#8A8A8A',
  accent: '#8804E5',
  accentText: '#B07CFF',
};

const copy = {
  pt: { role: 'Desenvolvedor backend' },
  en: { role: 'Backend developer' },
};

// Pequeno helper para escrever a árvore no formato que o satori espera.
const h = (type, style, ...children) => ({ type, props: { style, children: children.length === 1 ? children[0] : children } });

function layout(lang) {
  const mono = { fontFamily: 'JetBrains Mono' };

  const left = h(
    'div',
    { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', flex: 1 },
    h('div', { ...mono, fontSize: 26, color: C.text, display: 'flex' }, '~/viniciusps'),
    h(
      'div',
      { display: 'flex', flexDirection: 'column' },
      h('div', { ...mono, fontSize: 28, color: C.dim, display: 'flex', marginBottom: 18 }, h('span', { color: C.accentText, marginRight: 14 }, '$'), 'whoami'),
      h('div', { ...mono, fontSize: 80, fontWeight: 700, color: C.text, lineHeight: 1.05, letterSpacing: -1.5, display: 'flex' }, 'Vinicius'),
      h('div', { ...mono, fontSize: 80, fontWeight: 700, color: C.text, lineHeight: 1.05, letterSpacing: -1.5, display: 'flex', marginBottom: 26 }, 'Santos'),
      h('div', { fontFamily: 'Inter', fontSize: 30, color: C.muted, lineHeight: 1.4, display: 'flex' }, copy[lang].role),
      h('div', { fontFamily: 'Inter', fontSize: 30, color: C.muted, lineHeight: 1.4, display: 'flex' }, 'Java · Spring Boot · C# / .NET'),
    ),
    h(
      'div',
      { ...mono, fontSize: 26, color: C.text, display: 'flex', alignItems: 'center' },
      'viniciusps.tech',
      h('div', { width: 14, height: 30, background: C.accent, marginLeft: 10, display: 'flex' }),
    ),
  );

  const dot = () => h('div', { width: 12, height: 12, borderRadius: 6, background: C.borderStrong, marginRight: 8, display: 'flex' });
  const right = h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      border: `2px solid ${C.border}`,
      borderRadius: 14,
      background: C.surface,
      overflow: 'hidden',
      marginLeft: 48,
    },
    h(
      'div',
      { display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: `2px solid ${C.borderSoft}` },
      dot(),
      dot(),
      dot(),
      h('div', { ...mono, fontSize: 18, color: C.dim, marginLeft: 8, display: 'flex' }, 'foto.jpg'),
    ),
    h(
      'div',
      { display: 'flex', padding: 20 },
      { type: 'img', props: { src: photoSrc, width: 360, height: 360, style: { borderRadius: 8, objectFit: 'cover' } } },
    ),
  );

  return h(
    'div',
    { width: 1200, height: 630, display: 'flex', flexDirection: 'column', background: C.bg },
    h('div', { display: 'flex', flex: 1, alignItems: 'center', padding: '56px 72px 48px' }, left, right),
    h('div', { height: 8, background: C.accent, display: 'flex' }),
  );
}

fs.mkdirSync('public/og', { recursive: true });
for (const lang of ['pt', 'en']) {
  const svg = await satori(layout(lang), { width: 1200, height: 630, fonts });
  const out = `public/og/og-${lang}.png`;
  const info = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
  console.log('ok', out, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)}KB`);
}
