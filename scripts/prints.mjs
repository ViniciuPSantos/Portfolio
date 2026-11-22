// Prepara os prints de docs/prints/ para o site (cortes e destino em src/assets/projects/).
// Uso: node scripts/prints.mjs
// Os originais ficam fora do git; as versões cortadas são as que o Astro otimiza no build.
import sharp from 'sharp';
import fs from 'node:fs';

const jobs = [
  // Fluxen: remove a faixa de baixo, onde aparecia a URL de hover do navegador.
  { from: 'fluxen/home.png', to: 'fluxen/dashboard.png', crop: { left: 0, top: 0, width: 1903, height: 912 } },
  { from: 'bot/botconversa.png', to: 'telegram-bot/conversa.png' },
  // Ritmo "Hoje": só a parte de cima (check-in, peso, sono, água e gráfico de tendência).
  // A barra lateral do app termina em y=900: estende a cor dela até o fim do corte.
  {
    from: 'ritmo/desktop-hoje-sono-agua.png',
    to: 'ritmo/hoje.png',
    crop: { left: 0, top: 0, width: 1440, height: 980 },
    patches: [
      { left: 0, top: 900, width: 247, height: 80, sampleAt: [120, 880] },
      { left: 247, top: 900, width: 1, height: 80, sampleAt: [247, 880] }, // borda direita da barra
    ],
  },
  { from: 'ritmo/desktop-treino.png', to: 'ritmo/treino.png' },
  { from: 'ritmo/desktop-checkin-3-proposta-simulado.png', to: 'ritmo/checkin.png', crop: { left: 0, top: 0, width: 1440, height: 800 } },
];

for (const job of jobs) {
  const out = `src/assets/projects/${job.to}`;
  fs.mkdirSync(out.slice(0, out.lastIndexOf('/')), { recursive: true });
  let img = sharp(`docs/prints/${job.from}`);
  if (job.crop) img = img.extract(job.crop);
  if (job.patches) {
    const { data, info: meta } = await sharp(`docs/prints/${job.from}`).raw().toBuffer({ resolveWithObject: true });
    const layers = [];
    for (const p of job.patches) {
      const [x, y] = p.sampleAt;
      const i = (y * meta.width + x) * meta.channels;
      const color = { r: data[i], g: data[i + 1], b: data[i + 2] };
      const fill = await sharp({ create: { width: p.width, height: p.height, channels: 3, background: color } }).png().toBuffer();
      layers.push({ input: fill, left: p.left, top: p.top });
    }
    img = sharp(await img.png().toBuffer()).composite(layers);
  }
  const info = await img.png({ compressionLevel: 9 }).toFile(out);
  console.log('ok', out, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)}KB`);
}
