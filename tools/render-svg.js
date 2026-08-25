const fs = require('fs');
const path = require('path');
(async () => {
  try {
    const puppeteer = require('puppeteer');
    const svgPath = path.join(__dirname, '..', 'social-preview.svg');
    const outPath = path.join(__dirname, '..', 'social-preview.png');
    const svg = fs.readFileSync(svgPath, 'utf8');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(svg, { waitUntil: 'networkidle0' });
    const dims = await page.evaluate(() => {
      const el = document.documentElement;
      const wAttr = el.getAttribute('width');
      const hAttr = el.getAttribute('height');
      let w = 1200, h = 630;
      if (wAttr && hAttr) { w = parseInt(wAttr); h = parseInt(hAttr); }
      else if (el.viewBox && el.viewBox.baseVal) { w = el.viewBox.baseVal.width; h = el.viewBox.baseVal.height; }
      return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
    });
    await page.setViewport({ width: dims.w, height: dims.h });
    await page.screenshot({ path: outPath, omitBackground: false });
    await browser.close();
    console.log('OK', outPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
