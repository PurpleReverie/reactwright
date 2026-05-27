import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { renderResolvedToHTML } from "../html/render.js";
import type { ResolvedPageNode } from "../../resolver/ir.js";

type BrowserLike = {
  newPage(): Promise<PageLike>;
  close(): Promise<void>;
};

type PageLike = {
  setContent(html: string, options?: { waitUntil?: string }): Promise<void>;
  goto(url: string, options?: { waitUntil?: string }): Promise<unknown>;
  evaluate<T>(fn: (() => T) | string): Promise<T>;
  pdf(options: { path?: string; format?: string; printBackground?: boolean }): Promise<Uint8Array>;
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

export async function buildPdfFromHtml(
  html: string,
  options: BuildPdfOptions
): Promise<{ pdfPath: string }> {
  const puppeteer = await loadPuppeteer();
  const executablePath = options.executablePath ?? process.env.PUPPETEER_EXECUTABLE_PATH;

  const browser = await puppeteer.launch({
    headless: true,
    ...(executablePath != null ? { executablePath } : {}),
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  // Write the HTML to a real file on disk and navigate to it via page.goto.
  // This sets the document URL to file://, which is required for file://
  // image src attributes to load as same-origin. setContent leaves the URL
  // at about:blank, where cross-scheme image loads are blocked.
  await mkdir(dirname(options.outputPath), { recursive: true });
  const tmpHtmlPath = join(dirname(options.outputPath), `.${Date.now()}-pdf-source.html`);
  await writeFile(tmpHtmlPath, html, "utf8");

  try {
    const browserPage = await browser.newPage();
    const url = pathToFileURL(tmpHtmlPath).href;
    await browserPage.goto(url, { waitUntil: "networkidle0" });

    // Wait for Paged.js to finish paginating. Passed as a source string to
    // avoid tsx/esbuild helper injection (e.g. __name) leaking into the page
    // context where they would be undefined.
    await browserPage.evaluate(
      `new Promise(function (resolve) {
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
      })`
    );

    await browserPage.pdf({
      path: options.outputPath,
      format: options.format ?? "a4",
      printBackground: true
    });
    await browserPage.close();
    return { pdfPath: options.outputPath };
  } finally {
    await browser.close();
    await rm(tmpHtmlPath, { force: true });
  }
}

// Small helper: write a raw HTML file alongside the PDF for debugging.
export async function dumpHtmlBesidePdf(html: string, htmlPath: string): Promise<void> {
  await mkdir(dirname(htmlPath), { recursive: true });
  await writeFile(htmlPath, html, "utf8");
}

// Keep the import-time URL helper available so callers can convert file paths to URLs.
export { pathToFileURL };
