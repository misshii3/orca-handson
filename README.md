# Orca ハンズオン（ジュニアエンジニア向け・自習用）

[Orca](https://www.onorca.dev/) は、Claude Code や Codex などの CLI コーディングエージェントを
タスクごとに独立した git worktree で **並列に走らせ、差分を読んで、PR まで出す** ためのデスクトップアプリです。

このリポジトリは、Orca を初めて触る人が一人で進められるように作った教材です。
資料と一緒に、意図的にバグを仕込んだ小さな Node.js サンプル（`src/`, `test/`）が入っています。

## 進め方

1. [01_overview.md](./01_overview.md) を読む（15 分）
   Orca が何を解決するツールなのか、git worktree とは何か、安全面で気をつけることを押さえます。
2. [02_handson.md](./02_handson.md) を上から順に進める（60〜90 分）
   Claude Code と Codex に同じバグ修正を競わせ、良い方の差分にコメントを付けて改善させ、PR を作るところまで体験します。
   手順ごとに実機のスクリーンショット（`images/`）を載せています。

## このリポジトリの使い方（参加者向け）

このリポジトリは **テンプレートリポジトリ** です。自分のアカウントに複製してから使います。
詳しい手順は `02_handson.md` にありますが、要点だけ書くと次のコマンドです。

```bash
gh repo create orca-handson --template misshii3/orca-handson --private --clone
cd orca-handson
npm test   # 失敗するテストがあるのが正常です
```

## サンプルアプリについて

| ファイル | 内容 |
|---|---|
| `src/price.js` | 税込計算と割引計算（バグあり） |
| `src/date.js` | 日付フォーマット（バグあり） |
| `test/*.test.js` | Node.js 標準の `node:test` によるテスト。**仕様はテストが正** |

依存パッケージはありません。Node.js 20 以上で `npm test` が動きます。
テンプレートの状態では 9 テスト中 5 件が失敗します（バグは 3 か所）。

## 動作確認環境

- macOS（Apple Silicon）
- Orca 1.4.199
- Claude Code 2.1.x / Codex CLI 0.15x
- Node.js 22

Orca は更新頻度が高く、画面の表記が変わることがあります。手順と画面が合わないときは
[公式ドキュメント](https://www.onorca.dev/docs) を確認してください。

## ライセンス

MIT
