import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("consumer-style TypeScript fixture type-checks with public reactwright typings", () => {
  const result = spawnSync(
    process.execPath,
    ["./node_modules/typescript/bin/tsc", "-p", "fixtures/intellisense-consumer/tsconfig.json", "--noEmit"],
    {
      cwd: process.cwd(),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, [result.stdout, result.stderr].filter(Boolean).join("\n"));
});
