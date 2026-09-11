/**
 * 金額計算ユーティリティ
 *
 * 仕様は test/price.test.js を正とする。
 */

/**
 * 税込価格を返す。
 * 端数は切り捨て（1 円未満は切り捨てる）。
 *
 * @param {number} price 税抜価格（円）
 * @param {number} [rate=0.1] 税率（既定 10%）
 * @returns {number} 税込価格（円）
 */
export function calcTaxIncluded(price, rate = 0.1) {
  return Math.round(price * (1 + rate));
}

/**
 * 割引後の合計金額を返す。
 * 合計が 5,000 円以上なら 10% オフ、それ未満なら割引なし。
 *
 * @param {number} total 割引前の合計金額（円）
 * @returns {number} 割引後の合計金額（円）
 */
export function applyDiscount(total) {
  const THRESHOLD = 5000;
  const RATE = 0.1;
  if (total > THRESHOLD) {
    return Math.floor(total * (1 - RATE));
  }
  return total;
}
