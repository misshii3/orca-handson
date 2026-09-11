# Orca ハンズオン — Claude Code と Codex に同じバグを直させて、良い方を PR にする

所要時間の目安: 60〜90 分（エージェントの待ち時間を含む）
確認環境: macOS（Apple Silicon）、Orca 1.4.199（日本語 UI）、Claude Code 2.1.x、Codex CLI 0.15x、Node.js 22

Orca は更新が速く、ボタンの文言や配置が変わることがあります。本書の表記は上記バージョンの実機で確認したものです。
画面と食い違ったら、主要な用語には英語ドキュメントの呼び方を（ ）で併記しているので、それを手がかりに [公式ドキュメント](https://www.onorca.dev/docs) を探してください。

> **スクリーンショットについて**: 画像は検証用に `orca-handson-test` という名前で複製したリポジトリで撮影しています。サイドバーに別のプロジェクト（`20260910_…`）も写っていますが、あなたの画面では `orca-handson` だけが見えていれば正常です。
>
> **キー表記**: ⌘ = command、⇧ = shift、↩ = Enter（return）、⌫ = delete

---

## 0. このハンズオンのゴール

終わったときに、次のことが一人でできるようになっているのがゴールです。

- Orca にリポジトリを登録し、タスクごとに **ワークツリー（作業ディレクトリ）** を切れる
- 2 つのワークツリーで **Claude Code と Codex を同時に走らせ**、同じバグを直させる
- 2 つの差分を **見比べて良い方を選び**、差分の行に **コメントを付けてエージェントに修正させる**
- Orca の中から **コミット → push → PR 作成** まで済ませる
- 不要になったワークツリーを **後片付け** できる

### 全体の流れ

![ハンズオンのロードマップ。準備（1〜4 章）、本編（5〜12 章）、付録の順に進む](images/diagrams/09_handson-roadmap.svg)

本編で体験する流れを 1 枚にすると次のようになります。**同じ指示を 2 つのエージェントに出し、選んだ 1 つだけを PR にします。**

![レースの流れ。main から 2 つのワークツリーを作り、Claude Code と Codex に同じ指示を出し、差分を見比べて良い方を選び、メモで仕上げて PR にする](images/diagrams/01_race-flow.svg)

### 用語の対応（先に押さえておく）

Orca の日本語 UI は、英語ドキュメントと呼び方が少し違います。

| 英語ドキュメント | Orca 日本語 UI | 意味 |
|---|---|---|
| Repo / Repository | **プロジェクト** | 登録した git リポジトリ |
| Primary checkout | **main ［プライマリ］** | あなたが clone した本体のディレクトリ。ワークツリーはここから分岐する |
| Worktree / Workspace | **ワークツリー**、**ワークスペース**（両方出てきます） | タスク 1 つ分の作業ディレクトリ。実体は `git worktree` |
| Agent | **Agent** | Claude Code や Codex などの CLI エージェント |
| Changes | **Changes** タブ | 中央に開く、ワークツリー全体の差分（9 章で使う） |
| Source Control | 右パネルのブランチアイコン | ステージ・コミット・push・PR（11 章で使う） |

---

## 1. 前提条件チェック（10 分）

ターミナル（Terminal.app や iTerm）で次を順に実行し、すべて通ることを確認します。

```bash
claude --version      # 2.x
codex --version       # codex-cli 0.15x
node --version        # v20 以上
git --version
gh --version
gh auth status        # "Logged in to github.com account <あなたのID>" が出れば OK
```

### `gh` が入っていない、またはログインしていない場合

```bash
brew install gh
gh auth login
```

`gh auth login` の質問は次のように答えます。

| 質問 | 答え |
|---|---|
| What account do you want to log into? | **GitHub.com** |
| What is your preferred protocol for Git operations? | **HTTPS** |
| Authenticate Git with your GitHub credentials? | **Yes** |
| How would you like to authenticate? | **Login with a web browser** |

表示されたワンタイムコードをブラウザに入力すれば完了です。もう一度 `gh auth status` を実行して確認してください。

> Orca の GitHub 連携（PR 作成、チェック表示）は、この `gh` のログインをそのまま使います。Orca 側で別途トークンを入れる必要はありません。

✅ **ここまでできたら**: 6 つのコマンドが全部エラーなく終わり、`gh auth status` に自分のアカウント名が出ている。

---

## 2. Orca のインストールと初回起動（10 分）

### インストール

どちらか一方で構いません。

```bash
# Homebrew の場合
brew install --cask stablyai/orca/orca
```

または [公式サイト](https://www.onorca.dev/) の「Download for macOS (Apple Silicon)」から `.dmg` を取得して Applications に入れます。

### 初回起動で聞かれること

1. **ホームディレクトリへのアクセス許可** … 許可します
2. **既存設定の取り込み**（`~/.claude`、`~/.codex`、Ghostty 設定）… 取り込みます。Claude Code と Codex のログイン情報がそのまま使えるようになります
3. 空の画面に「**プロジェクトを追加**」「**作成 workspace**」のボタンが出れば起動完了です

### 画面の見方

![Orca の画面構成。① 左サイドバー ② 中央のタブとペイン ③ 右パネル ④ ステータスバー ⑤ 設定 ⑥ 右パネルの開閉](images/diagrams/05_orca-screen-layout.svg)

- ① **左サイドバー**: 上に「オンボーディングチェックリスト / タスク / 自動化 / Orca モバイル」、その下に「**プロジェクト**」一覧。プロジェクトの下にワークツリーがぶら下がります
- ② **中央**: 選んだワークツリーのタブ（ターミナル、Changes、エディタなど）。ワークツリーを切り替えると、ここに出るタブも切り替わります
- ③ **右パネル**: 「ファイル / Agent セッション履歴 / Source Control / PR」の 4 タブ。3 番目のブランチアイコンが Source Control で、9 章と 11 章で使います
- ④ **下のステータスバー**: Claude と Codex の **使用量とレート制限の残り**。ここが便利です
- ⑤ **左下の歯車**: 設定（⌘, でも開きます）
- ⑥ **右上のアイコン**: 右パネルの開閉

✅ **ここまでできたら**: Orca が起動し、左下の歯車から設定画面が開ける。

---

## 3. 初期設定（5 分。3-1 と 3-2 は必須）

**3-1 と 3-2 は飛ばさないでください。** Orca は既定で、エージェントを起動するときに **権限確認を全部スキップするフラグ** を付けます。3-3 と 3-4 は任意です。

設定（⌘,）→ 左の「**Agent**」を開き、下の方の「**Agent の権限**」を見てください。既定では **Yolo** が選ばれていて、「インストール済み」の欄に

- Claude: `claude --dangerously-skip-permissions`
- Codex: `codex --dangerously-bypass-approvals-and-sandbox`

と表示されています。これが「Yolo」の中身です。

![Agent 設定の既定（Yolo）。起動コマンドに権限スキップのフラグが付いている](images/01_settings_agent_yolo.png)

### 3-1. （必須）Agent の権限を「手動」にする

「**Agent の権限**」の右側のトグルで **手動** を選びます。すると「インストール済み」の表示が `claude`、`codex` だけになります。

![「手動」に切り替えると、起動コマンドからフラグが消える](images/02_settings_agent_manual.png)

「手動」にすると、Orca は何もフラグを付けずにエージェントを起動します。**確認プロンプトが出るかどうかは、その先の Claude Code / Codex 自身の設定次第** です（7 章の図で整理します）。
ジュニアのうちは、エージェントが「何をしようとしているか」を確認プロンプトで読む経験を積んでください。Yolo を使いたくなったときの指針は [付録 C](#付録-c-権限スキップyoloを使いたくなったら) にあります。

### 3-2. （必須）GitHub 連携を確認する

設定 → 「**連携**」を開き、「GitHub」が **Connected** になっていることを確認します。説明にあるとおり「PR、Issue、チェックは gh CLI」で動くので、1 章の `gh auth login` が済んでいれば自動的に Connected です。

![連携設定。GitHub は gh CLI のログインを使う](images/03_settings_integrations.png)

### 3-3. （任意）Orca CLI を登録する

設定 → 「**一般**」の下の方に「**Orca CLI**」があります。「シェルコマンド」のトグルを ON にすると `/usr/local/bin/orca` が登録され、ターミナルから `orca` コマンドが使えます。付録 A で使うので、ここで ON にしておくと後が楽です。

![一般設定の Orca CLI。シェルコマンドのトグルで /usr/local/bin/orca を登録する](images/04_settings_orca_cli.png)

### 3-4. （任意）テレメトリ

設定 → 「**プライバシーとテレメトリ**」に「匿名の使用状況データを共有する」のトグルがあります。収集内容は [01_overview.md の 6 章](./01_overview.md#6-安全面の注意) を参照し、必要なら OFF にしてください。

![プライバシーとテレメトリの設定](images/05_settings_privacy.png)

「**アプリに戻る**」で設定を閉じます。

✅ **ここまでできたら**: 「Agent の権限」が **手動**、「連携」の GitHub が **Connected**。

---

## 4. サンプルリポジトリを手に入れる（5 分）

この教材のテンプレートリポジトリから、**自分のアカウントに** 複製を作ります。テンプレートには、わざとバグを仕込んだ小さな Node.js アプリが入っています。

```bash
cd ~/Documents            # 好きな場所で構いません（以後の説明はここに置いた前提です）
gh repo create orca-handson --template misshii3/orca-handson --private --clone
cd orca-handson
npm test
```

`npm test` の出力に次の要約が出れば正常です。**5 件失敗するのが正しい状態** です。

```
ℹ tests 9
ℹ suites 3
ℹ pass 4
ℹ fail 5
```

この要約は出力の **中ほど**、`✖ failing tests:` という行の直前に出ます。その下に続く赤いエラーは、わざと仕込んだバグによるものです。今は読まなくて構いません（ターミナルを上にスクロールすると要約が見つかります）。

### 中身を 1 分だけ眺める

| ファイル | 役割 |
|---|---|
| `src/price.js` | `calcTaxIncluded`（税込計算）と `applyDiscount`（割引）。バグ 2 か所 |
| `src/date.js` | `formatDate`（`YYYY-MM-DD` 形式）。バグ 1 か所（この 1 か所に問題が 2 つあります） |
| `test/*.test.js` | Node.js 標準の `node:test` によるテスト。**仕様はテストが正**。テスト名を読むと仕様が分かります |

どこがバグかは、まだ読まなくて大丈夫です。エージェントに探させ、あとで差分を読むのが今日の練習です。答えは 9 章の末尾にあります。

✅ **ここまでできたら**: 自分の GitHub に `orca-handson` リポジトリができ、ローカルで `npm test` が **fail 5** で終わる。

---

## 5. プロジェクトを追加する

> 5 章から 9 章までが、公式チュートリアル「Your first 3-agent session」の 6 ステップ（Add Repo → Create worktree → Pick agent → Race → Split → Review diff）に相当します。

Orca に戻り、サイドバーの「プロジェクト」右側の **＋** か、中央の「**プロジェクトを追加**」を押します。

![プロジェクトを追加するダイアログ](images/06_add_project_dialog.png)

「**フォルダーを参照**」を選び、4 章でクローンした `orca-handson` フォルダを指定します。

> 「URL からクローン」でも登録できますが、その場合は clone 先を別に聞かれ、12 章で使うパス `~/Documents/orca-handson` を読み替える必要があります。今日は「フォルダーを参照」を使ってください。

サイドバーに `orca-handson` が現れ、その下に `main ［プライマリ］` と表示されます。この `main` があなたが clone した本体（プライマリチェックアウト）で、以後作るワークツリーはここから分岐します。

✅ **ここまでできたら**: サイドバーに `orca-handson` → `main ［プライマリ］` が見える。

---

## 6. ワークツリーを作って Claude Code を起動する

### 6-1. 作成ダイアログを開く

サイドバーで `orca-handson` をクリックして選び、**⌘N**（または中央の「作成 workspace」）を押します。

「**ワークツリーを作成する**」ダイアログが開きます。項目は上から次のとおりです。

| 項目 | 入れる値 |
|---|---|
| プロジェクト | `orca-handson` になっているか確認。右側の灰色の文字が `<あなたのID>/orca-handson`（自分の複製）であることも見ておく。違えばドロップダウンで選ぶ |
| 実行先 | `Local Mac` のまま |
| 名前または「作成元」 | タブを「**名前**」にして `fix-tests-claude` と入力 |
| Agent | **Claude** |
| 詳細設定 | 触らない |

![ワークツリー作成ダイアログ。名前と Agent を指定する](images/07_create_worktree_dialog.png)

> タブは 4 つあります。「スマート」は Issue 番号やブランチ名から、「GitHub」は Issue / PR から、「ブランチ」は既存ブランチからワークツリーを作る機能です。今日は「名前」だけ使います。左下の「さらに作成」トグルも触りません。

「**ワークツリーを作成する ⌘↩**」を押します。

### 6-2. 作成直後に起きること

- サイドバーに `fix-tests-claude` が追加され、その下にブランチ名 `<あなたのGitHubID>/fix-tests-claude` が出ます。**ブランチ名は Orca が自動で付けます**
- 左下に「**セットアップスクリプトを追加する**」というポップアップが出ることがあります（`package.json` から `npm install` を検出したもの）。このサンプルは依存パッケージがないので **× で閉じて** 構いません
- 中央にターミナルタブが開き、`claude` が自動で起動します

![ワークツリー作成直後。セットアップスクリプトのポップアップは閉じてよい](images/08_worktree_created_setup_popup.png)

裏側では `git worktree` が 1 つ増えています。ファイルの置き場所を図にすると次のとおりです。あなたが clone した `~/Documents/orca-handson` が本体（`.git` の持ち主）で、ワークツリーは `~/orca/workspaces/orca-handson/<名前>` に作られます。

![git worktree の仕組み。1 つの .git に、プライマリの main と 2 つのワークツリーがぶら下がる](images/diagrams/04_git-worktree.svg)

### 6-3. Claude Code の初回確認に答える

初めてのディレクトリで Claude Code を起動すると「**Quick safety check: Is this a project you created or one you trust?**」と聞かれます。
既定では「**No, exit**」に `❯` が付いています。そのまま Enter すると Claude Code が終了してしまうので、**↓キーで「Yes, I trust this folder」に移してから** Enter します（自分で clone したリポジトリなので信頼して問題ありません）。

![Claude Code のフォルダ信頼確認。フラグなしの `claude` で起動していることが 1 行目でわかる](images/09_claude_trust_prompt.png)

1 行目に `fix-tests-claude > claude` と出ていることを確認してください。`--dangerously-skip-permissions` が **付いていない** のが、3 章で「手動」にした効果です。

> 間違えて終了してしまったら、そのターミナルで `claude` と打てば再起動できます。

### 6-4. macOS の許可ダイアログが出たら

エージェントが動き始めると、macOS から「**"Orca.app" から、"書類" フォルダ内のファイルへのアクセス権を求められています**」のようなダイアログが出ることがあります。これは Orca（とその中で動くエージェント）が保護フォルダを読もうとしたときの OS の確認です。
ワークツリー自体は `~/orca/workspaces/` にありますが、その `.git` の本体は `~/Documents/orca-handson` にある（6-2 の図）ため、「書類」へのアクセスが求められます。

![macOS の権限ダイアログの例](images/10_macos_permission_prompt.png)

- 「書類」「デスクトップ」など、**自分のリポジトリを置いた場所** へのアクセスは **許可** してください。拒否すると、そのフォルダにあるプロジェクトで Orca が動けなくなります
- 「"Orca.app" が "Codex Computer Use.app" を制御するアクセスを要求しています」は Codex のコンピュータ操作機能に関するものです。今日のハンズオンには不要なので、**許可しなくても進められます**。所属組織の PC 運用ルールに従ってください
- あとで変えたいときは、macOS の「システム設定 → プライバシーとセキュリティ」で変更できます

✅ **ここまでできたら**: サイドバーに `fix-tests-claude`、中央に Claude Code の起動画面（`❯` のプロンプト）。

---

## 7. レース開始 — Claude Code と Codex に同じ指示を出す

### 7-1. Claude Code に指示を貼る

Claude Code のプロンプトに、次の文をそのまま貼って Enter します（日本語 IME で打つより、コピーして貼り付けるのが確実です）。

```
npm test を実行して、失敗しているテストをすべて通してください。制約: test/ 以下は変更しないこと。修正は src/ 以下だけ。最後に、何が原因でどう直したかを日本語で簡潔に説明してください。
```

Claude Code が `npm test` を実行したりファイルを書き換えたりしようとするたびに、**確認プロンプトが出る場合があります**（あなたの Claude Code の権限モードが既定のときです）。内容を読んで、問題なければ許可してください。これが「エージェントが何をしようとしているかを読む」練習です。

「権限」の話は 3 つの層に分かれていて、混同しやすいので図にしておきます。3 章で触ったのは 1 層目だけです。

![権限の 3 つの層。Orca の「Agent の権限」は起動フラグを決めるだけ。確認プロンプトを出すかはエージェント自身の設定、フォルダアクセスのダイアログは macOS が出す](images/diagrams/02_permission-layers.svg)

> 画面下に `auto mode on (shift+tab to cycle)` などと出ている場合、それはあなたの **Claude Code 自身の設定**（2 層目）です。`Shift+Tab` で確認モードを切り替えられます。何も出ていなければ既定（毎回確認）です。Orca の「手動」設定（1 層目）とは別の層の話なので、混同しないでください。

### 7-2. 2 本目のワークツリーで Codex を起動する

Claude が動いている間に、もう一度 **⌘N** を押します。今回はプロジェクトが最初から `orca-handson` になっているはずです。

| 項目 | 入れる値 |
|---|---|
| 名前 | タブを「名前」にして `fix-tests-codex` |
| Agent | ドロップダウンを開いて **Codex** を選ぶ |

![Agent ドロップダウン。Claude / Codex / GitHub Copilot / Gemini / Kiro / Cursor などが並ぶ](images/11_agent_dropdown.png)

「ワークツリーを作成する ⌘↩」を押すと、`fix-tests-codex` ができて `codex` が起動します。Codex のプロンプト（`» Ask Codex to do anything`）に **同じ文** を貼って Enter します。

![Codex が作業中。サイドバーの Codex 側にスピナー、Claude 側に完了のチェックが出ている](images/12_codex_working.png)

**ここで一度 `fix-tests-claude` に戻ってください。** 「手動」モードの Claude Code は、あなたが Codex を起動している間に確認プロンプトで止まっていることが多いです。ターミナルに `y/n` や選択肢が出ていたら、内容を読んで答えます。

### 7-3. 2 つを並べて見る（分割表示）

今、両方のエージェントが動いています。同時に眺めたいので、**タブをドラッグして分割** します。

- 中央のタブ（ターミナルのタブ）を、ペインの **右端** までドラッグすると左右分割、**下端** までドラッグすると上下分割です
- 分割の境目は好きな位置にでき、レイアウトはワークツリーごとに保存されます
- 別のワークツリーのターミナルを隣に出すには、8 章の **⌘J** パレットで名前を打って **Shift+↩** を押します（新しい分割で開く）

### 7-4. サイドバーで進み具合を見る

2 つのワークツリーの状態は、サイドバーのアイコンだけで追えます。

| サイドバーの表示 | 意味 |
|---|---|
| 回転するスピナー | 作業中 |
| 黄色いアイコン、`[thinking]` `[working]` の文字 | 考え中・実行中の詳細 |
| ベル | 未読の完了通知がある（あなたの番） |
| 緑のチェック | 完了（待機中） |
| 赤いドット | エラー、ブロック、中断 |
| 灰色のドット | しばらく動いていない |
| Codex の下にぶら下がる `default` の行 | Codex が起動したサブエージェント。Orca は子行として表示します |

タブやサイドバーの行の名前は、最初の指示から Orca が自動で付けます。

![両方のエージェントが完了した状態のサイドバー](images/13_sidebar_states_done.png)

- 目安は 1〜5 分です。**スピナーが 1 分以上動いたまま進まないときは、ターミナルに確認プロンプトが出ています。** そのワークツリーを開いて答えてください
- 参考値: 今回の実測では、Claude Code は約 2 分、Codex は約 1 分で完走し、どちらも **9 件すべて成功** させました
- 片方が失敗した、あるいは `test/` を書き換えてしまった場合は、もう片方を採用して先へ進んで構いません（それ自体が比較の材料になります）

✅ **ここまでできたら**: 2 つのワークツリーに緑のチェックが付き、各ターミナルに日本語の修正説明が出ている。

---

## 8. ワークツリー間を移動する（⌘J）

ここから先は 2 つのワークツリーを行き来します。サイドバーをクリックしてもよいのですが、**⌘J**（ジャンプパレット）を覚えると速いです。

- **⌘J** を押し、ワークツリー名の一部（`codex` など）を打って **↩** で切り替え
- **Shift+↩** なら、そのワークツリーのターミナルを **新しい分割で開く**（7-3 の並べて見る用途）
- タブの切り替えは ⌘⇧] / ⌘⇧[

![⌘J のジャンプパレット。最近のワークツリーやターミナルを検索して飛べる](images/28_jump_palette.png)

> ⌘J を押しても何も出ないときは、ターミナルにキー入力が吸われています。サイドバーの空いている所を一度クリックしてから押してください。

レビューのときは、**左に Changes（差分）、右にターミナル** の並びにしておくと、差分を見ながらエージェントの説明を読めます。

✅ **ここまでできたら**: ⌘J で `fix-tests-claude` と `fix-tests-codex` を行き来できる。

---

## 9. 差分を読んで比べる（Diff viewer）

### 9-1. Source Control パネルを開く

右上のパネル開閉アイコンで右パネルを開き、上部 4 つのうち **3 番目のブランチアイコン** を押すと Source Control パネルになります。

![Source Control パネル。ブランチ名、メッセージ欄、ステージオール、変更点の一覧](images/14_source_control_panel.png)

見えるもの:

- 一番上の「**PR を作成**」ボタン（**まだ押しません**。11 章で使います）
- `<ID>/fix-tests-codex → origin/main`（このブランチと、分岐元）
- 「メッセージ」欄（右上に AI 生成のアイコン）
- 「**＋ ステージオール**」（Stage All）
- 「**変更点 2**」と、変更されたファイル（例: `date.js +2 -2`、`price.js +2 -2`。数字はエージェントの修正内容で変わります）
- 一番下の「コミット」は、このブランチのコミット履歴。まだ何もコミットしていないので空です

### 9-2. 統合 diff を開く

「変更点」の右の「**すべて見る**」（View All）を押すと、中央に **Changes** タブが開き、全ファイルの差分が縦に並びます。

![Changes タブ（統合 diff）。ファイルごとにハンクが並ぶ](images/15_diff_viewer.png)

差分の中で、ひと続きになった変更のかたまりを **ハンク（hunk）** と呼びます。1 ファイルに複数のハンクがあることもあります。

ツールバーの機能:

| ボタン | 働き |
|---|---|
| すべて折りたたむ | 変更のない行を隠す |
| インライン / サイドバイサイド | 表示方式の切り替え。右パネルを閉じてペインを広げるとサイドバイサイドが読みやすい |
| ラップオフ | 長い行の折り返し |
| Whitespace Off | 空白の差分を表示するか |

キーボードでも移動できます。`j` / `k` で次・前のファイル、`n` / `p` で次・前のハンク、`s` でカーソル下のハンクをステージ。

### 9-3. 2 つのワークツリーを見比べる

サイドバー（または ⌘J）で `fix-tests-claude` と `fix-tests-codex` を切り替え、それぞれの Changes を見てください。
ワークツリーを切り替えると中央のタブも切り替わるので、もう一方でも 9-1 → 9-2 と同じ手順で「すべて見る」を押して Changes を開きます。

見る観点は 3 つです。

- [ ] **正しいか**: 境界値（5,000 円ちょうど）、端数処理（切り捨て）、月の 0 始まりと 2 桁ゼロ埋めが直っているか
- [ ] **余計なことをしていないか**: `test/` を触っていないか、無関係なファイルに差分がないか
- [ ] **読めるか**: なぜそう直したかが、コードやコメントから分かるか

今回の実測では、**ロジックの修正は 2 つとも同じ** でした。違いは、Claude Code は各修正行に日本語コメントを添え、Codex はコメントなしの最小差分だったことです。
どちらを「良い」とするかはチームの方針次第です。ここでは **Codex の方を採用し、足りないコメントを次の章で足させる** ことにします（Claude を採用しても手順は同じです。以後の `fix-tests-codex` を読み替えてください）。

<details>
<summary>答え合わせ: 仕込んであった 3 つのバグ</summary>

| ファイル | 関数 | 誤 | 正 |
|---|---|---|---|
| `src/price.js` | `calcTaxIncluded` | `Math.round`（四捨五入） | `Math.floor`（切り捨て） |
| `src/price.js` | `applyDiscount` | `total > THRESHOLD`（5,000 円ちょうどが割引されない） | `total >= THRESHOLD` |
| `src/date.js` | `formatDate` | `getMonth()` をそのまま使い、ゼロ埋めもしていない（`2026-0-5` になる） | `getMonth() + 1` にして、月・日を `padStart(2, "0")` で 2 桁にする |

エージェントの差分がこの 3 点を押さえていれば「正しい」と判断できます。

</details>

✅ **ここまでできたら**: 2 つの差分を見比べ、採用する方を決めた。

---

## 10. 差分の行にコメントして、エージェントに直させる（Annotate AI Diff）

採用した方（ここでは `fix-tests-codex`）の Changes タブを開きます（9-2 の「すべて見る」）。

### 10-1. 行にノートを付ける

`src/date.js` の、月を計算している行（`getMonth()` を含む行）にマウスを乗せると、行番号の左に **＋** が出ます（キーボードなら行にカーソルを置いて `c`）。

![変更行にマウスを乗せると行番号の左に「+」が出る](images/16_diff_gutter_plus.png)

＋ を押すと「**NN 行目 / Add note for the AI**」の入力欄が開きます（NN はその行の番号で、エージェントの修正内容によって変わります）。次のように書いて「**Add note ↵**」を押します。

```
なぜ getMonth() に +1 が必要なのか、初見の人にも分かる日本語コメントをこの行の上に追加してください。
```

![ノートの入力欄](images/17_annotate_popup.png)

ノートはその行に固定され、diff の中に「Note line NN」として表示されます。ツールバーには「**AI メモ 1**」と「**Send**」が現れ、Source Control パネルにも「ノート 1」が出ます。

![ノートが行に固定された状態](images/18_annotate_note_added.png)

> ペインが狭いとツールバーのボタンが重なって押しにくいことがあります。右パネルを閉じるか、ウィンドウを広げてください。サイドバイサイド表示にすると、ノートは右側に大きく表示されます。

![サイドバイサイド表示でのノート。送信・編集・削除のアイコンが付く](images/19_diff_side_by_side_note.png)

### 10-2. まとめて送る

気になる行が複数あるなら、**全部にノートを付けてから** 送ります。1 件ずつ送るより、エージェントが全体を見て一貫した修正をしてくれるからです。次の図は 2 か所にノートを付けた例です（行番号は例で、あなたの画面とは違います）。

![Annotate の流れ。複数の行に付けたノートが「Send」で 1 つのプロンプトにまとまってエージェントに届き、差分が更新される](images/diagrams/07_annotate-flow.svg)

ツールバーの「**Send**」（英語 UI では Send to agent）を押すと「**メモの送信先**」メニューが開きます。

![メモの送信先メニュー。動いている Codex か、新規 Agent を選べる](images/20_send_to_agent_menu.png)

- 上段: このワークツリーで **すでに動いているエージェント**（ここでは `Codex · Done · 実行して失敗テストを修正`）
- 下段「新規 Agent」: 別のエージェントを新しく起動して渡す

上段の Codex を選びます。右下に「**メモをアクティブな Agent に送信しました**」と出て、Codex のターミナルに

```
File: src/date.js
Line: NN
User comment: "なぜ getMonth() に +1 が必要なのか、..."
```

という形で届き、Codex が作業を始めます。Codex がファイルを書き換えたりコマンドを実行しようとして確認が出たら、内容を読んで許可してください。
数十秒で `date.js` にコメント行が追加され、Changes の `date.js` の行数（例: `+2 -2` → `+3 -2`）が増えます。変わらないときは付録 B の「Changes の差分が古い」を見てください。

✅ **ここまでできたら**: Codex がコメント行を追加し、Changes にその差分が出ている。

---

## 11. コミット → push → PR 作成

すべて Source Control パネル（右パネルのブランチアイコン）で行います。

**まずサイドバーで、採用した `fix-tests-codex` を選んでください。** パネル最上部が `<あなたのID>/fix-tests-codex → origin/main` になっていることを確認します。ここを間違えると、不採用の Claude 側の変更をコミットしてしまいます。

これから押すボタンと、裏で起きている git の操作の対応は次のとおりです。**ボタンの文言が、今どの段階にいるかを教えてくれます。**

![Source Control のボタンと git 操作の対応。ステージオール → Commit → ブランチを公開 → PR を作成](images/diagrams/03_source-control-flow.svg)

### 11-1. ステージする

「**＋ ステージオール**」を押します。見出しが「**ステージ済みの変更 2**」に変わり、ボタンが「**✓ Commit**」になります。

![ステージ後。ボタンが Commit に変わる](images/21_sc_staged.png)

### 11-2. コミットメッセージを AI に書かせる

「メッセージ」欄の右上の **AI アイコン**（きらきらマーク。英語 UI では Generate with AI）を押します。初回だけ「**コミットメッセージの生成**」ダイアログが出て、使う Agent（既定は Claude）とプロンプトのテンプレートを確認できます。そのまま「**Generate**」を押してください。

![初回のみ出る「コミットメッセージの生成」ダイアログ](images/22_commit_msg_generate_dialog.png)

10〜20 秒でメッセージが入ります。**必ず読んで**、事実と違えば直してください。生成に失敗したときは、手で書いて構いません（例: `fix: 税込計算・割引・日付フォーマットのバグを修正`）。

![AI が生成したコミットメッセージ](images/23_commit_msg_generated.png)

「**Commit**」を押します（⌘↩ でも可）。

### 11-3. push する

コミットすると、ボタンが「**ブランチを公開**」（Publish Branch）に変わり、右上に `↑1`（未 push のコミット数）が出ます。

![コミット後。ボタンが「ブランチを公開」になる](images/24_publish_branch.png)

「ブランチを公開」を押すと `origin`（GitHub 上のあなたの `orca-handson`）にブランチが push されます。Orca は **黙って force push はしません**。履歴を書き換えたときだけ「Force push with lease」が別に出ます。

### 11-4. PR を作る

パネル上部の「**PR を作成**」を押します。確認環境では **確認ダイアログなしで即座に PR が作られ**、タイトルはブランチ名から（例: `Fix tests codex`）、本文は空でした。

PR は **あなたのリポジトリの `main` に向けて** 作られます。テンプレート元の `misshii3/orca-handson` には何も届かないので、安心して押してください。

- パネル上部の表示が「**PR #1**」に変わり、サイドバーのワークツリーに PR アイコンが付きます
- 右パネルの **4 番目のアイコン（PR）** を押すと、PR の状態（OPEN）、チェックの結果、コメント、「Create merge commit」ボタンが見えます

![PR 作成後の Source Control パネルとサイドバー](images/25_pr_created_sidebar.png)

![PR パネル。状態、チェック、コメントが見える](images/26_pr_panel.png)

> 画像に写っている「CodeRabbit」は、筆者の GitHub アカウントに入っているレビューボットです。参加者の環境には出ません。

> バージョンによっては、作成前にタイトル・説明・下書きかどうかを確認するダイアログが出て、「AI で PR の説明を生成」できます。出た場合は説明を生成して内容を確認してから作成してください。
> 今回のように本文が空で作られた場合は、PR パネル右上の外部リンクアイコンから GitHub で開き、説明を書き足してください。ターミナルからなら `gh pr edit 1 --body "..."` でも書けます。

ブラウザで `https://github.com/<あなたのID>/orca-handson/pulls` を開き、PR ができていることを確認します。差分は自分の目で最後にもう一度読んでください。

✅ **ここまでできたら**: 自分の GitHub に PR が 1 件でき、Orca の PR パネルに OPEN と表示されている。

---

## 12. 後片付け

不採用にした `fix-tests-claude` を消します。消す前に、何が消えて何が残るかを押さえておきます。

![ワークツリー削除で消えるもの・残るもの。フォルダと未コミットの変更とローカルブランチは消える。プライマリ、push 済みブランチ、PR は残る](images/diagrams/06_worktree-cleanup.svg)

サイドバーで `fix-tests-claude` を **右クリック** → 一番下の「**削除 ⌘⇧⌫**」。

![ワークツリーの右クリックメニュー。一番下が削除](images/27_worktree_context_menu.png)

確認ダイアログが出るので、文言を読んで OK します（設定「一般」→「ワークスペースを削除する前に確認する」が既定で ON）。

このとき起きること:

- `~/orca/workspaces/orca-handson/fix-tests-claude` ディレクトリが消える
- **コミットしていない変更は、ディレクトリと一緒に消えます。** 今回の Claude Code の修正はコミットしていないので、ここで失われます（不採用なので問題ありません）。残したい変更があるときは、削除する前にそのワークツリーでコミットしてください
- ローカルブランチ `<ID>/fix-tests-claude` も消える。push していないので、リモートには何もありません
- **コミット済みでまだマージされていない** ブランチだけは「Preserved branches」に退避され、消すかどうかを後で決められます（[01_overview.md の 2 章](./01_overview.md#2-前提知識-git-worktree-とは)）

ターミナルで確かめると、Orca のワークツリーが本物の `git worktree` だったことが分かります。

```bash
cd ~/Documents/orca-handson
git worktree list
git branch
```

`git worktree list` はプライマリと採用した方の 2 行になり、`git branch` では別のワークツリーで checkout 中のブランチに `+` が付きます。

```
/Users/<あなた>/Documents/orca-handson                        abc1234 [main]
/Users/<あなた>/orca/workspaces/orca-handson/fix-tests-codex  def5678 [<ID>/fix-tests-codex]

+ <ID>/fix-tests-codex
* main
```

採用した `fix-tests-codex` は、PR をマージした後に同じ手順で消してください。PR のマージは PR パネルの「Create merge commit」か、GitHub 上で行えます。

プロジェクトごと Orca から外したいときは、サイドバーのプロジェクト名にマウスを乗せて右に出る「**…**」→「**プロジェクトの削除**」です。Orca の一覧から外れるだけで、clone したフォルダは残ります（確認ダイアログの文言を読んで確かめてください）。

✅ **ここまでできたら**: サイドバーに `main` と `fix-tests-codex` だけが残っている。

ここまでで本編は終わりです。お疲れさまでした。

---

## 付録 A（任意）: Orca CLI をエージェントから使う

3-3 で Orca CLI を登録していれば、ターミナルから Orca 自身を操作できます。Orca の中のエージェントも同じコマンドが使えるので、「エージェントがワークツリーを切って別のエージェントを走らせる」といった使い方ができます。

```bash
orca status --json                     # Orca が動いているか
orca worktree ps --json                # 全ワークツリーとエージェントの状態
orca worktree create --repo name:orca-handson --name from-cli --agent claude --prompt "README.md を読んで要約して" --activate --json
orca terminal list --json              # 生きているターミナル
orca terminal read --screen --json     # いま見えている画面を文字で取得
orca terminal send --text "続けて" --enter --json
```

登録していない場合は、フルパスでも動きます。

```bash
/Applications/Orca.app/Contents/Resources/bin/orca status --json
```

ここで作った `from-cli` ワークツリーは、終わったら 12 章と同じ手順で削除してください。

セッション復元も試してみてください。Orca を ⌘Q で終了して再起動すると、ワークツリー、タブ、ターミナルのスクロールバックが戻り、終了したエージェントには「再起動」のチップが出ます。

---

## 付録 B: トラブルシューティング

| 症状 | 見るところ・直し方 |
|---|---|
| `gh repo create` が `name already exists` と言う | 同名のリポジトリが自分のアカウントにある。別名（例: `orca-handson-2`）で作り、以後のリポジトリ名を読み替える |
| テンプレートから作った直後の clone が `empty repository` や `not found` になる | テンプレートの複製は数秒かかることがある。少し待って `gh repo clone <あなたのID>/orca-handson` を実行 |
| ⌘N を押してもダイアログが出ない | サイドバーでプロジェクト（`orca-handson`）をクリックして選択してから押す |
| 「ワークツリーを作成する」ボタンが押せない | 「名前」タブの入力欄が空。名前を入れる |
| エージェントが起動しない、`command not found` | Orca の「ブランクターミナル」を開いて `which claude` `which codex` を打つ。出なければ PATH の問題。ターミナルアプリでは動くのに Orca で動かないときは、シェルの設定ファイル（`~/.zshrc`）に PATH を書いてから Orca を再起動 |
| Claude Code の trust 画面で「No, exit」を選んでしまった | そのターミナルで `claude` と打って再起動し、↓で「Yes, I trust this folder」を選ぶ |
| Codex がログインを求める | ターミナルで `codex login` を実行してから、Orca で Codex を起動し直す |
| スピナーが回ったまま進まない | そのワークツリーのターミナルを開く。`y/n` や選択肢の確認プロンプトで止まっている |
| ワークツリーの作成に失敗する | プライマリの `main` で `git fetch origin` を実行してから再試行。同名のワークツリーが残っていないかも確認 |
| 「PR を作成」が反応しない、GitHub のエラーが出る | ターミナルで `gh auth status`。`GITHUB_TOKEN` や `GH_TOKEN` 環境変数に古い値が入っていると gh のログインより優先されて失敗する。`unset GITHUB_TOKEN GH_TOKEN` してから `gh auth login` をやり直す |
| GitHub のレート制限（rate-limiting）と言われる | しばらく待つ。`gh api rate_limit` で残量を確認できる |
| macOS の許可ダイアログが何度も出る | 「システム設定 → プライバシーとセキュリティ → フルディスクアクセス」に Orca を追加すると出なくなる（組織のルールを確認） |
| Changes の差分が古い、変わらない | 差分ツールバーの更新アイコンを押す。外で `git rebase` や `reset` をした直後は反映が遅れることがある |
| `orca` コマンドが見つからない | 設定 → 一般 → Orca CLI のトグルが ON か確認。`/usr/local/bin` が PATH にあるか確認。急ぐならフルパスで実行 |
| ワークツリーのターミナルで日本語入力がおかしい | IME を英数に切り替えてから入力。長文はメモ帳に書いて貼り付けるのが確実 |
| エージェントの確認プロンプトが一切出ない | 設定 → Agent → 「Agent の権限」が **手動** か確認。手動でも出ないなら、Claude Code / Codex 自身の設定（Claude は `Shift+Tab` のモード、Codex は `/approvals`）を確認 |
| 何が起きたか分からない | メニューの Help → Open Logs でログを見る。Help → Send Feedback でスクリーンショット付きで開発元に送れる |

---

## 付録 C: 権限スキップ（Yolo）を使いたくなったら

Orca の設計思想は「ワークツリーは使い捨てだから、エージェントには自由にやらせて、**差分で検品する**」です。Yolo はその思想の表れで、慣れた人が使えば速いのは事実です。

ただし、次の条件を満たすときだけにしてください。

1. **業務リポジトリでは使わない**。練習用・使い捨てのワークツリーに限る
2. そのワークツリーから届く範囲に、本番の認証情報や `.env` が **ない**
3. `git push --force` や `rm -rf` のような **取り消せない操作** をエージェントがしても困らない状態である
4. 終わったら **必ず差分を全部読む**。読まないなら Yolo を使う資格はまだない、と考える

Yolo に切り替える場所は、設定 → Agent → 「Agent の権限」です。ハンズオンが終わったら **手動に戻す** のを忘れないでください。

---

## 参考リンク

- 公式チュートリアル「Your first 3-agent session」: https://www.onorca.dev/docs/first-session
- レシピ「Race three agents on the same task」: https://www.onorca.dev/docs/recipes/parallel-agents
- Annotate AI Diff: https://www.onorca.dev/docs/review/annotate-ai-diff
- Commit & push from Orca: https://www.onorca.dev/docs/review/commit-push
- Troubleshooting GitHub errors: https://www.onorca.dev/docs/github-errors
- Orca CLI overview: https://www.onorca.dev/docs/cli/overview
