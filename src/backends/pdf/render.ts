import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import { renderResolvedToHTML } from "../html/render.js";
import type { ResolvedPageNode } from "../../resolver/ir.js";

type BrowserLike = {
  newPage(): Promise<PageLike>;
  close(): Promise<void>;
};

type PageLike = {
  setContent(html: string, options?: { waitUntil?: string }): Promise<void>;
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

  try {
    const browserPage = await browser.newPage();
    // Prepend <base href="file:///"> so that absolute filesystem paths in
    // <img src="/abs/path"> etc. resolve as file:// URLs. Without this,
    // setContent uses about:blank as the document URL and absolute paths
    // fail to load.
    const htmlWithBase = html.includes("<base ")
      ? html
      : html.replace(/<head>/i, '<head><base href="file:///" />');
    await browserPage.setContent(htmlWithBase, { waitUntil: "networkidle0" });

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

    await mkdir(dirname(options.outputPath), { recursive: true });
    await browserPage.pdf({
      path: options.outputPath,
      format: options.format ?? "a4",
      printBackground: true
    });
    await browserPage.close();
    return { pdfPath: options.outputPath };
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
