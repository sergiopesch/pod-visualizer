import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import sharp from "sharp";

const baseUrl = process.env.EXPORT_QA_URL ?? "http://localhost:3002";
const outputDir = process.env.EXPORT_QA_DIR ?? "tmp/export-qa";

const platformAssets = {
  YouTube: [
    ["Episode Master", [1920, 1080]],
    ["Shorts Frame", [1080, 1920]],
    ["Thumbnail", [3840, 2160]],
    ["Podcast Playlist Art", [3000, 3000]],
  ],
  Spotify: [
    ["Video Podcast", [1920, 1080]],
    ["Show Cover", [3000, 3000]],
    ["Episode Cover", [3000, 3000]],
    ["Audio Card", [1080, 1080]],
  ],
  X: [
    ["Vertical Video", [1080, 1920]],
    ["Timeline Square", [1200, 1200]],
    ["Launch Card", [1200, 628]],
    ["Quote Card", [1440, 1800]],
  ],
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assert(condition, message, details) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

async function pixelRange(filePath) {
  const raw = await sharp(filePath).resize(64, 64, { fit: "fill" }).raw().toBuffer();
  let min = 255;
  let max = 0;

  for (const value of raw) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  return max - min;
}

async function exportAssets() {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true, env: {} });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });

  const failures = [];
  page.on("pageerror", (error) => failures.push({ type: "pageerror", message: error.message }));
  page.on("requestfailed", (request) =>
    failures.push({
      type: "requestfailed",
      url: request.url(),
      failure: request.failure()?.errorText,
    })
  );

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const bodyText = await page.locator("body").innerText();
  assert(!/tiktok/i.test(bodyText), "Rendered UI still contains TikTok");
  assert(!/four platform|4 platforms/i.test(bodyText), "Rendered UI still contains four-platform language");

  const report = [];

  for (const [platform, assets] of Object.entries(platformAssets)) {
    await page
      .getByRole("button", { name: new RegExp(`^${escapeRegex(platform)}\\b`) })
      .first()
      .click();
    await page.waitForTimeout(150);

    for (const [asset, dimensions] of assets) {
      await page.getByRole("button", { name: new RegExp(escapeRegex(asset)) }).last().click();
      await page.waitForTimeout(100);

      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: /Export PNG/i }).click();
      const download = await downloadPromise;
      const filePath = path.join(outputDir, download.suggestedFilename());
      await download.saveAs(filePath);

      const metadata = await sharp(filePath).metadata();
      const stats = fs.statSync(filePath);
      const range = await pixelRange(filePath);
      const dimensionsOk = metadata.width === dimensions[0] && metadata.height === dimensions[1];
      const sizeOk = stats.size > 50_000;
      const nonBlank = range >= 20;

      report.push({
        platform,
        asset,
        file: path.basename(filePath),
        width: metadata.width,
        height: metadata.height,
        expected: dimensions,
        dimensionsOk,
        sizeMB: Number((stats.size / 1024 / 1024).toFixed(2)),
        pixelRange: range,
        nonBlank,
        passed: dimensionsOk && sizeOk && nonBlank,
      });
    }

    const contactSheetPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export Contact Sheet/i }).click();
    const contactSheetDownload = await contactSheetPromise;
    const contactSheetPath = path.join(outputDir, contactSheetDownload.suggestedFilename());
    await contactSheetDownload.saveAs(contactSheetPath);

    const contactMetadata = await sharp(contactSheetPath).metadata();
    const contactStats = fs.statSync(contactSheetPath);
    const contactRange = await pixelRange(contactSheetPath);
    const contactDimensionsOk = contactMetadata.width === 2400 && contactMetadata.height === 1600;
    const contactSizeOk = contactStats.size > 100_000;
    const contactNonBlank = contactRange >= 20;

    report.push({
      platform,
      asset: "Contact Sheet",
      file: path.basename(contactSheetPath),
      width: contactMetadata.width,
      height: contactMetadata.height,
      expected: [2400, 1600],
      dimensionsOk: contactDimensionsOk,
      sizeMB: Number((contactStats.size / 1024 / 1024).toFixed(2)),
      pixelRange: contactRange,
      nonBlank: contactNonBlank,
      passed: contactDimensionsOk && contactSizeOk && contactNonBlank,
    });
  }

  await browser.close();

  assert(failures.length === 0, "Browser failures occurred during export QA", failures);
  assert(report.every((item) => item.passed), "Export QA failures", report.filter((item) => !item.passed));

  fs.writeFileSync(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.table(
    report.map(({ platform, asset, width, height, sizeMB, pixelRange, passed }) => ({
      platform,
      asset,
      dimensions: `${width}x${height}`,
      sizeMB,
      pixelRange,
      passed,
    }))
  );
}

exportAssets().catch((error) => {
  console.error(error.message);
  if (error.details) console.error(JSON.stringify(error.details, null, 2));
  process.exit(1);
});
