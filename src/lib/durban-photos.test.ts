import { DURBAN_PHOTOS, photoSrcSet } from "./durban-photos";
import { existsSync } from "fs";
import path from "path";

let passed = 0;
function ok(c: boolean, m: string) {
  if (!c) throw new Error(m);
  passed++;
}

const ids = Object.keys(DURBAN_PHOTOS);
ok(ids.length >= 9, "at least 9 photos catalogued");
for (const id of ids) {
  const p = DURBAN_PHOTOS[id as keyof typeof DURBAN_PHOTOS];
  ok(/^\/images\/(durban|duban)\//.test(p.src), `${id} src path`);
  if (p.owner) {
    ok(p.author === "Duban", `${id} owner credit`);
  } else {
    ok(/CC BY|CC0|Public domain/i.test(p.license), `${id} reuse licence`);
    ok(p.commonsUrl.includes("commons.wikimedia.org"), `${id} commons link`);
  }
  ok(p.author.length > 1, `${id} author`);
  ok(photoSrcSet(p).includes(".webp"), `${id} srcset`);
  const file = path.join(process.cwd(), "public", p.src.replace(/^\//, ""));
  ok(existsSync(file), `${id} file exists on disk`);
}
ok(DURBAN_PHOTOS.hero.owner === true, "hero is owner promenade");
ok(DURBAN_PHOTOS.ushaka.src.includes("ushaka-gate"), "ushaka replaced");
ok(DURBAN_PHOTOS.umhlanga.src.includes("umhlanga-night"), "umhlanga replaced");
ok(DURBAN_PHOTOS["golden-mile"].src.includes("durban-letters"), "golden mile replaced");
ok(DURBAN_PHOTOS.botanic.owner !== true, "botanic stays Commons");
console.log(`durban-photos.test.ts: ${passed} assertions passed`);
