import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { exec } from "node:child_process";

const root = process.cwd();

(async function () {
  const manifest = JSON.parse(await readFile(join(root, "manifest.json")));

  await rm(join(root, `${manifest.name}.zip`), { force: true });

  // only for macOS
  exec(`zip -r ${manifest.name}.zip ${zipFolder}`);
})();
