/**
 * 日付フォーマットユーティリティ
 *
 * 仕様は test/date.test.js を正とする。
 */

/**
 * Date を "YYYY-MM-DD" 形式の文字列にする。
 * 月・日は 2 桁ゼロ埋め。
 *
 * @param {Date} date 対象の日付
 * @returns {string} "YYYY-MM-DD"
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return `${year}-${month}-${day}`;
}
