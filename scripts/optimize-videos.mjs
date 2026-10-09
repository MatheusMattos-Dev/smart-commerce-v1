// Gera as versões leves dos vídeos de img/ em assets/video/.
// Rode com `npm run videos` sempre que trocar um vídeo em img/.
// Precisa do ffmpeg instalado e no PATH (https://ffmpeg.org).
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';

const OUT = 'assets/video';
mkdirSync(OUT, { recursive: true });

// vídeo original -> nome curto usado na seção "O curso em números" e o
// segundo de onde sai a capa (um momento com o personagem em cena)
const videos = {
  'ssstik.io_1791509653737.mp4': ['reel-1', 5],
  'ssstik.io_1791509433301.mp4': ['reel-2', 0.5],
  'ssstik.io_1791509779096.mp4': ['reel-3', 0.5],
};

for (const [file, [slug, posterAt]] of Object.entries(videos)) {
  const src = `img/${file}`;
  // 540x960 em H.264 (toca em qualquer navegador), áudio leve para o
  // "toque para ouvir" e faststart para começar a tocar antes de baixar tudo
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', src,
    '-vf', 'scale=540:960:force_original_aspect_ratio=increase,crop=540:960',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
    '-movflags', '+faststart',
    `${OUT}/${slug}.mp4`,
  ]);
  // capa, mostrada enquanto o vídeo carrega
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-ss', String(posterAt), '-i', src, '-frames:v', '1',
    '-vf', 'scale=540:960:force_original_aspect_ratio=increase,crop=540:960',
    '-c:v', 'libwebp', '-quality', '75',
    `${OUT}/${slug}.webp`,
  ]);
  for (const out of [`${slug}.mp4`, `${slug}.webp`]) {
    console.log(`${out.padEnd(14)} ${(statSync(`${OUT}/${out}`).size / 1024).toFixed(1)} KB`);
  }
}
