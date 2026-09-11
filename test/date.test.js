// 日付フォーマットのテスト（このファイルは変更しないこと）
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatDate } from "../src/date.js";

describe("formatDate", () => {
  it("2026 年 1 月 5 日 → 2026-01-05（月・日はゼロ埋め）", () => {
    assert.equal(formatDate(new Date(2026, 0, 5)), "2026-01-05");
  });

  it("2026 年 12 月 25 日 → 2026-12-25", () => {
    assert.equal(formatDate(new Date(2026, 11, 25)), "2026-12-25");
  });

  it("2026 年 9 月 11 日 → 2026-09-11", () => {
    assert.equal(formatDate(new Date(2026, 8, 11)), "2026-09-11");
  });
});
