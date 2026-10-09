// Gera as versões leves (WebP) das imagens de img/ em assets/img/.
// Rode com `npm run images` sempre que trocar uma imagem em img/.
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const OUT = 'assets/img';
mkdirSync(OUT, { recursive: true });

const jobs = [];

// Hero: três telas de vídeo com os personagens saindo delas (fundo transparente).
// Tira a margem vazia e gera 1x/2x para a largura exibida no hero.
const heroCards = await sharp('img/header-ok.png').trim().toBuffer();
for (const width of [512, 1024]) {
  jobs.push(
    sharp(heroCards)
      .resize({ width })
      // a versão 2x aguenta qualidade menor sem diferença visível
      .webp({ quality: width > 512 ? 72 : 82, alphaQuality: 85, effort: 6 })
      .toFile(`${OUT}/hero-cards-${width}.webp`)
      .then((info) => [`hero-cards-${width}.webp`, info]),
  );
}

// Logo isolado: tira a margem vazia e gera 1x/2x para header, oferta e rodapé
const LOGO = 'img/Logotipo IA no Balção isolado.png';
const logo = await sharp(LOGO).trim().toBuffer();
for (const width of [240, 480]) {
  jobs.push(
    sharp(logo)
      .resize({ width })
      .webp({ quality: 88, alphaQuality: 95, effort: 6 })
      .toFile(`${OUT}/logo-${width}.webp`)
      .then((info) => [`logo-${width}.webp`, info]),
  );
}

// Favicon: só o "IA" do logo (terço esquerdo), centralizado num quadrado transparente
const logoMeta = await sharp(logo).metadata();
const iaWidth = Math.round(logoMeta.width * 0.27);
const ia = await sharp(logo).extract({ left: 0, top: 0, width: iaWidth, height: logoMeta.height }).toBuffer();
const side = Math.max(iaWidth, logoMeta.height);
jobs.push(
  sharp(ia)
    .resize({ width: side, height: side, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 64, height: 64 })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/favicon-64.png`)
    .then((info) => ['favicon-64.png', info]),
);

// Retratos: recorte 4:5 a partir do topo (cabelo e rosto), 2x da largura exibida
for (const name of ['CS001', 'CS002', 'CS003', 'CS005', 'CS006', 'CS009']) {
  jobs.push(
    sharp(`img/${name}.webp`)
      .resize({ width: 256, height: 320, fit: 'cover', position: 'top' })
      .webp({ quality: 80, effort: 6 })
      .toFile(`${OUT}/${name.toLowerCase()}-256.webp`)
      .then((info) => [`${name.toLowerCase()}-256.webp`, info]),
  );
}

// Retratos novos (mesmo estilo, fundo amarelo): 4:5 para cards
const novos = {
  'Cavalheiro de bigode e penteado escultural-1.png': 'cavalheiro',
  'Elegância retrô com cabelo escultural-2.png': 'elegancia',
  'Retrato vintage com pompadour excêntrico-3.png': 'pompadour',
  'Dama vintage do coque prateado-4.png': 'dama',
};
for (const [file, slug] of Object.entries(novos)) {
  jobs.push(
    sharp(`img/${file}`)
      .resize({ width: 256, height: 320, fit: 'cover', position: 'top' })
      .webp({ quality: 80, effort: 6 })
      .toFile(`${OUT}/${slug}-256.webp`)
      .then((info) => [`${slug}-256.webp`, info]),
  );
  // avatar quadrado (rosto e cabelo) para os cards de depoimento
  jobs.push(
    sharp(`img/${file}`)
      .extract({ left: 120, top: 60, width: 880, height: 880 })
      .resize({ width: 160, height: 160 })
      .webp({ quality: 82, effort: 6 })
      .toFile(`${OUT}/${slug}-avatar.webp`)
      .then((info) => [`${slug}-avatar.webp`, info]),
  );
}

// Retratos em 9:16 para os "vídeos" da seção /na prática (corte centralizado)
for (const name of ['CS001', 'CS002', 'CS003', 'CS005', 'CS006', 'CS009']) {
  jobs.push(
    sharp(`img/${name}.webp`)
      .resize({ width: 360, height: 640, fit: 'cover', position: 'centre' })
      .webp({ quality: 80, effort: 6 })
      .toFile(`${OUT}/${name.toLowerCase()}-reel.webp`)
      .then((info) => [`${name.toLowerCase()}-reel.webp`, info]),
  );
}

// Retratos maiores, em 4:5, para os cards de /o que você vai criar
for (const name of ['CS002', 'CS003', 'CS005', 'CS009']) {
  jobs.push(
    sharp(`img/${name}.webp`)
      .resize({ width: 640, height: 800, fit: 'cover', position: 'top' })
      .webp({ quality: 80, effort: 6 })
      .toFile(`${OUT}/${name.toLowerCase()}-640.webp`)
      .then((info) => [`${name.toLowerCase()}-640.webp`, info]),
  );
}

// Prévia de compartilhamento (WhatsApp, redes): 1200x630 com o logo corrigido
// à esquerda e as telas do hero à direita, sobre o céu esverdeado da página.
const ogBg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#a9cbd4"/><stop offset="0.55" stop-color="#cfe2e6"/><stop offset="1" stop-color="#f3f1e9"/>' +
  '</linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>',
);
const ogLogo = await sharp(logo).resize({ width: 500 }).toBuffer();
const ogLogoMeta = await sharp(ogLogo).metadata();
const ogCards = await sharp(heroCards).resize({ height: 540 }).toBuffer();
const ogCardsMeta = await sharp(ogCards).metadata();
jobs.push(
  sharp(ogBg)
    .composite([
      { input: ogLogo, left: 50, top: Math.round((630 - ogLogoMeta.height) / 2) },
      { input: ogCards, left: 1200 - ogCardsMeta.width - 24, top: Math.round((630 - ogCardsMeta.height) / 2) },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(`${OUT}/og-1200x630.jpg`)
    .then((info) => ['og-1200x630.jpg', info]),
);

// Céus em pixel art (fundo de hero, oferta e CTA final): nuvens embaixo e
// céu liso em cima. A cor do topo de cada imagem é a mesma do fundo da seção
// no CSS (.sky-1/2/3), então não aparece emenda. O movimento é feito em CSS.
const skies = {
  'Nuvens suaves em pixel art-1.png': 'sky-1',
  'Céu pastel com nuvens pixeladas-2.png': 'sky-2',
  'Panorama de nuvens pixeladas suaves-3.png': 'sky-3',
};
for (const [file, slug] of Object.entries(skies)) {
  for (const width of [1086, 2172]) {
    jobs.push(
      sharp(`img/${file}`)
        .resize({ width })
        .webp({ quality: 88, effort: 6 })
        .toFile(`${OUT}/${slug}-${width}.webp`)
        .then((info) => [`${slug}-${width}.webp`, info]),
    );
  }
}

for (const [file, info] of await Promise.all(jobs)) {
  console.log(`${file.padEnd(22)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
}
