import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../import-strong.mjs", import.meta.url), "utf8");
const parseSource = source
  .slice(source.indexOf("function parseLines"), source.indexOf("function validateRows"))
  .replace("function parseLines", "export function parseLines");
const { parseLines } = await import(
  `data:text/javascript;base64,${Buffer.from(parseSource).toString("base64")}`,
);

test("reads canonical lexical columns and normalizes suffixed Hebrew entries", () => {
  const rows = parseLines([
    "H1254a\tH1254A =\tH1254A\tבָּרָא\tba.ra\tH:V\tto create",
    "H1254b\tH1254B =\tH1254B\tבָּרָא\tba.ra\tH:V\tto fatten",
    "H0430\tH0430G =\tH3068G\tאֱלֹהִים\te.lo.him\tH:N-M\tGod",
  ].join("\n"), "hebrew");

  assert.deepEqual(rows.map((row) => row.strong_number), ["H1254", "H430"]);
  assert.equal(rows[0].lemma, "בָּרָא");
  assert.equal(rows[0].transliteration, "ba.ra");
  assert.equal(rows[1].lemma, "אֱלֹהִים");
});

test("does not capture technical references from non-canonical columns", () => {
  const rows = parseLines(
    "H0410\tH0410I = combination of\tH3068G (H0410I+H0430G)\tאֵל\tel\tH:N-M\tEl",
    "hebrew",
  );
  assert.equal(rows[0].strong_number, "H410");
  assert.equal(rows[0].lemma, "אֵל");
  assert.equal(rows[0].transliteration, "el");
  assert.equal(rows[0].glosses, "El");
});
