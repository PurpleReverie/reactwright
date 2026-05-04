import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { renderResolvedToLatex } from "./render.js";
import type { ResolvedPageNode } from "../../resolver/ir.js";

export type PdfBuildResult = {
  texPath: string;
  pdfPath: string;
  logPath: string;
  auxPath: string;
  latex: string;
};

type BuildPdfOptions = {
  outputDir: string;
  baseName: string;
};

export async function buildPdfFromResolved(
  page: ResolvedPageNode,
  options: BuildPdfOptions
): Promise<PdfBuildResult> {
  const outputDir = resolve(options.outputDir);
  const texmfVarDir = join(outputDir, ".texmf-var");
  const baseName = options.baseName;
  const latex = renderResolvedToLatex(page);

  await mkdir(outputDir, { recursive: true });
  await mkdir(texmfVarDir, { recursive: true });

  const texPath = join(outputDir, `${baseName}.tex`);
  const pdfPath = join(outputDir, `${baseName}.pdf`);
  const logPath = join(outputDir, `${baseName}.log`);
  const auxPath = join(outputDir, `${baseName}.aux`);

  await writeFile(texPath, latex, "utf8");

  const result = spawnSync(
    "pdflatex",
    ["-interaction=nonstopmode", "-halt-on-error", "-output-directory", outputDir, texPath],
    {
      cwd: outputDir,
      encoding: "utf8",
      env: {
        ...process.env,
        TEXMFVAR: texmfVarDir
      }
    }
  );

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    throw new Error(
      [
        `pdflatex failed for ${texPath}`,
        stdout ? `stdout:\n${stdout}` : "",
        stderr ? `stderr:\n${stderr}` : ""
      ]
        .filter(Boolean)
        .join("\n\n")
    );
  }

  return {
    texPath,
    pdfPath,
    logPath,
    auxPath,
    latex
  };
}
