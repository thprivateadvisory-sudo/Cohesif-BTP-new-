// Rend video.html en MP4 1080x1920 30 i/s pour TikTok.
// Usage : node render.js [sortie.mp4] [--stills]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const FPS = 30, DURATION = 26;
const out = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'cohesif-btp-tiktok.mp4';
const stills = process.argv.includes('--stills');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'video.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');

  if (stills) {
    for (const t of [2, 8, 11, 18, 22, 25.5]) {
      await page.evaluate(t => render(t), t);
      await page.screenshot({ path: `still-${t}.png` });
    }
    await browser.close();
    return;
  }

  const ff = spawn('ffmpeg', ['-y', '-v', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

  const total = FPS * DURATION;
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => render(t), f / FPS);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('OK ->', out);
})();
