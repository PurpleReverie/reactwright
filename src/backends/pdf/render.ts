import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { renderResolvedToHTML } from "../html/render.js";
import type { ResolvedPageNode } from "../../resolver/ir.js";

type BrowserLike = {
  newPage(): Promise<PageLike>;
  close(): Promise<void>;
};

type ElementLike = {
  screenshot(options?: { path?: string; type?: "png" | "jpeg"; omitBackground?: boolean }): Promise<Uint8Array>;
};

type PageLike = {
  setContent(html: string, options?: { waitUntil?: string }): Promise<void>;
  goto(url: string, options?: { waitUntil?: string }): Promise<unknown>;
  evaluate<T>(fn: (() => T) | string): Promise<T>;
  pdf(options: { path?: string; format?: string; printBackground?: boolean }): Promise<Uint8Array>;
  $$(selector: string): Promise<ElementLike[]>;
  close(): Promise<void>;
};

type PuppeteerLike = {
  launch(options?: {
    headless?: boolean | "new";
    executablePath?: string;
    args?: string[];
  }): Promise<BrowserLike>;
};

export type BuildPdfOptions = {
  outputPath: string;
  format?: "a4" | "letter" | string;
  /**
   * Optional path to a Chrome/Chromium executable. Required when using
   * `puppeteer-core` without a bundled browser. Defaults to PUPPETEER_EXECUTABLE_PATH
   * env var.
   */
  executablePath?: string;
};

async function loadPuppeteer(): Promise<PuppeteerLike> {
  try {
    // Prefer full puppeteer if installed (bundles Chromium).
    // @ts-expect-error optional runtime dependency, may not be installed
    const mod = (await import("puppeteer")) as { default?: PuppeteerLike } & PuppeteerLike;
    return (mod.default ?? mod) as PuppeteerLike;
  } catch {
    /* fall through */
  }
  try {
    const mod = (await import("puppeteer-core")) as { default?: PuppeteerLike } & PuppeteerLike;
    return (mod.default ?? mod) as PuppeteerLike;
  } catch {
    throw new Error(
      "PDF output requires `puppeteer` or `puppeteer-core` to be installed. " +
        "Run `npm install puppeteer` for a bundled Chromium, or `npm install puppeteer-core` " +
        "if you want to point at a system Chrome via the `executablePath` option."
    );
  }
}

export async function buildPdfFromResolved(
  page: ResolvedPageNode,
  options: BuildPdfOptions
): Promise<{ pdfPath: string }> {
  const html = renderResolvedToHTML(page);
  return buildPdfFromHtml(html, options);
}

// Launch a headless Chromium with the platform-appropriate executable
// path (bundled or from PUPPETEER_EXECUTABLE_PATH).
async function launchBrowser(executablePathOpt?: string): Promise<BrowserLike> {
  const puppeteer = await loadPuppeteer();
  const executablePath = executablePathOpt ?? process.env.PUPPETEER_EXECUTABLE_PATH;
  return puppeteer.launch({
    headless: true,
    ...(executablePath != null ? { executablePath } : {}),
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
}

// Write `html` to a temp file in the same directory as the eventual
// output, run `fn` with its file:// URL, then delete the temp file
// regardless of outcome. We use a real file (rather than setContent)
// because setContent leaves the document URL at about:blank, where
// cross-scheme image loads (e.g. file:// images) are blocked.
async function withTempHtmlFile<T>(
  html: string,
  dir: string,
  fn: (url: string) => Promise<T>
): Promise<T> {
  await mkdir(dir, { recursive: true });
  const tmpHtmlPath = join(dir, `.${Date.now()}-pdf-source.html`);
  await writeFile(tmpHtmlPath, html, "utf8");
  try {
    return await fn(pathToFileURL(tmpHtmlPath).href);
  } finally {
    await rm(tmpHtmlPath, { force: true });
  }
}

// Block until Paged.js has finished pagination (a .pagedjs_pages or
// .pagedjs_page element appears in the DOM). Passed as a source
// string so tsx/esbuild helpers (e.g. __name) don't leak into the
// page context where they would be undefined.
const WAIT_FOR_PAGED_JS_SOURCE = `new Promise(function (resolve) {
  var start = Date.now();
  var timeout = 15000;
  function check() {
    var ready = document.querySelector('.pagedjs_pages, .pagedjs_page') != null;
    if (ready || Date.now() - start > timeout) {
      resolve();
    } else {
      setTimeout(check, 100);
    }
  }
  check();
})`;

export async function buildPdfFromHtml(
  html: string,
  options: BuildPdfOptions
): Promise<{ pdfPath: string }> {
  const browser = await launchBrowser(options.executablePath);
  try {
    return await withTempHtmlFile(html, dirname(options.outputPath), async (url) => {
      const browserPage = await browser.newPage();
      await browserPage.goto(url, { waitUntil: "networkidle0" });
      await browserPage.evaluate(WAIT_FOR_PAGED_JS_SOURCE);
      await browserPage.pdf({
        path: options.outputPath,
        format: options.format ?? "a4",
        printBackground: true
      });
      await browserPage.close();
      return { pdfPath: options.outputPath };
    });
  } finally {
    await browser.close();
  }
}

export type BuildPngsOptions = {
  outputDir: string;
  baseName: string;
  executablePath?: string;
};

// Render Paged.js'd HTML to one PNG per page, written to
// `<outputDir>/<baseName>-page-NN.png`. Useful as a programmatic
// inspection surface: drop a tsx mockup into runExternalFile with
// --format png and the resulting PNGs are readable artifacts you can
// diff visually or load into a vision-aware LLM. At Paged.js's
// default 96dpi a letter page is ~816x1056px and weighs ~50-150KB.
export async function buildPngsFromHtml(
  html: string,
  options: BuildPngsOptions
): Promise<{ pngPaths: string[] }> {
  const browser = await launchBrowser(options.executablePath);
  try {
    return await withTempHtmlFile(html, options.outputDir, async (url) => {
      const browserPage = await browser.newPage();
      await browserPage.goto(url, { waitUntil: "networkidle0" });
      await browserPage.evaluate(WAIT_FOR_PAGED_JS_SOURCE);
      const pageEls = await browserPage.$$(".pagedjs_page");
      const pngPaths: string[] = [];
      for (let i = 0; i < pageEls.length; i += 1) {
        const num = String(i + 1).padStart(2, "0");
        const pngPath = join(options.outputDir, `${options.baseName}-page-${num}.png`);
        await pageEls[i].screenshot({ path: pngPath, type: "png" });
        pngPaths.push(pngPath);
      }
      await browserPage.close();
      return { pngPaths };
    });
  } finally {
    await browser.close();
  }
}

// Small helper: write a raw HTML file alongside the PDF for debugging.
export async function dumpHtmlBesidePdf(html: string, htmlPath: string): Promise<void> {
  await mkdir(dirname(htmlPath), { recursive: true });
  await writeFile(htmlPath, html, "utf8");
}

// Keep the import-time URL helper available so callers can convert file paths to URLs.
export { pathToFileURL };
