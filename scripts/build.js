import { readFile, writeFile, rm, copyFile, cp, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { exec } from "node:child_process";

const root = process.cwd();

(async function () {
  const manifest = JSON.parse(await readFile(join(root, "manifest.json")));

  const zipFolder = join(root, manifest.name);

  await mkdir(zipFolder, { recursive: true });

  await rm(zipFolder, { recursive: true, force: true });

  await cp(join(root, "dist/"), join(zipFolder, "dist/"), {
    recursive: true,
  });

  await cp(join(root, "icons/"), join(zipFolder, "icons/"), {
    recursive: true,
  });

  await cp(join(root, "manifest.json"), join(zipFolder, "manifest.json"));

  await rm(join(root, `${manifest.name}.zip`), { force: true });

  // only for macOS
  exec(`zip -r ${manifest.name}.zip ${zipFolder}`);
})();
