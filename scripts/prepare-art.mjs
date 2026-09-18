import { createRequire } from "node:module";
import { mkdir, copyFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
const sharp = require(process.env.REPO_METRO_SHARP || "sharp");
const names = ["starry", "sunflowers", "pearl"];
const inputs = process.argv.slice(2);
if (inputs.length !== 3) throw new Error("Pass starry, sunflowers, and pearl source PNG paths, in that order.");
await mkdir(resolve("assets/paintings"), { recursive: true });
await mkdir(resolve(".artifacts/art-originals"), { recursive: true });
for (let index = 0; index < names.length; index++) {
  const name = names[index];
  await copyFile(inputs[index], resolve(".artifacts/art-originals", name + ".png"));
  const output = resolve("assets/paintings", name + ".webp");
  await sharp(inputs[index]).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toFile(output);
  console.log(name + ": " + (await stat(output)).size + " bytes");
}

