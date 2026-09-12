import { test } from "node:test";
import assert from "node:assert/strict";
import { assertQaProject, assertQaUrl, QA_PROJECT_REF, PRODUCTION_PROJECT_REF } from "./qa-project-guard.mjs";

test("permits only the exact QA project ref", () => {
  assert.equal(assertQaProject(QA_PROJECT_REF), QA_PROJECT_REF);
  for (const ref of [undefined, "", PRODUCTION_PROJECT_REF, "unknown", `${QA_PROJECT_REF} `]) {
    assert.throws(() => assertQaProject(ref));
  }
});

test("requires the exact HTTPS QA origin without credentials or URL extras", () => {
  assert.equal(assertQaUrl(`https://${QA_PROJECT_REF}.supabase.co`), QA_PROJECT_REF);
  for (const url of [undefined, "", `https://${PRODUCTION_PROJECT_REF}.supabase.co`,
    `http://${QA_PROJECT_REF}.supabase.co`, `https://${QA_PROJECT_REF}.supabase.co.evil.test`,
    `https://secret@${QA_PROJECT_REF}.supabase.co`, `https://${QA_PROJECT_REF}.supabase.co/path`,
    `https://${QA_PROJECT_REF}.supabase.co?token=secret`]) {
    assert.throws(() => assertQaUrl(url), error => !error.message.includes("secret"));
  }
});
