// 金額計算のテスト（このファイルは変更しないこと）
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calcTaxIncluded, applyDiscount } from "../src/price.js";

describe("calcTaxIncluded", () => {
  it("1000 円の税込（10%）は 1100 円", () => {
    assert.equal(calcTaxIncluded(1000), 1100);
  });

  it("端数は切り捨てる: 999 円 → 1098 円（1098.9 の切り捨て）", () => {
    assert.equal(calcTaxIncluded(999), 1098);
  });

  it("税率を指定できる: 1000 円 × 8% → 1080 円", () => {
    assert.equal(calcTaxIncluded(1000, 0.08), 1080);
  });
});

describe("applyDiscount", () => {
  it("4999 円は割引なし", () => {
    assert.equal(applyDiscount(4999), 4999);
  });

  it("ちょうど 5000 円は 10% オフで 4500 円", () => {
    assert.equal(applyDiscount(5000), 4500);
  });

  it("8000 円は 10% オフで 7200 円", () => {
    assert.equal(applyDiscount(8000), 7200);
  });
});
