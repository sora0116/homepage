PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE posts (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text not null,
  body text not null,
  status text not null check (status in ('draft', 'published')),
  published_at text not null,
  updated_at text not null,
  tags_json text
, visibility text not null default 'public' check (visibility in ('public', 'private')));
INSERT INTO "posts" ("id","slug","title","description","body","status","published_at","updated_at","tags_json","visibility") VALUES('post-first','first-post','はじめての記事','サイトの公開準備と今後書いていく内容についての案内です。',replace('このサイトでは、制作メモ、プロダクトの学び、日々の実験を記録します。\n\n公開直後は設計や実装の話が中心ですが、今後は運用の改善や考え方も蓄積していく予定です。','\n',char(10)),'published','2026-06-13T00:00:00.000Z','2026-06-13T00:00:00.000Z','["お知らせ","設計"]','public');
INSERT INTO "posts" ("id","slug","title","description","body","status","published_at","updated_at","tags_json","visibility") VALUES('post-design-notes','design-notes','DADS を取り入れた個人サイト設計','デジタル庁デザインシステムを個人サイトへ取り込むときの考え方をまとめます。',replace('公共向けの設計思想をそのまま持ち込むのではなく、読みやすさとアクセシビリティを軸に翻訳して使います。\n\n今回のサイトでは、色、余白、フォーム、フォーカス表現を優先して合わせています。\n\n設計レビュー用の要点は、本文の一部をそのまま Marp スライドとして見せられます。\n\n::dads{component="notification-banner" type="info" heading="DADS Notification Banner" body="本文から実コンポーネントをそのまま呼び出せます。" title="Notification Banner"}\n\n::marp\n---\ntheme: dads\npaginate: true\n---\n\n# DADS を個人サイトに移すときの要点\n\n- 可読性を最優先にする\n- 余白とフォームを先に揃える\n- 更新導線まで設計に含める\n\n---\n\n## このサイトで優先した項目\n\n1. 色のコントラスト\n2. フォーカスの見え方\n3. 管理画面からの更新しやすさ\n::','\n',char(10)),'published','2026-06-11T00:00:00.000Z','2026-06-13T00:00:00.000Z','["DADS","デザイン"]','public');
INSERT INTO "posts" ("id","slug","title","description","body","status","published_at","updated_at","tags_json","visibility") VALUES('post-test-blog','test-blog','テスト投稿','管理画面の動作確認用に使うサンプル記事です。',replace('この投稿は動的コンテンツ化後の確認用です。\n\n公開状態やタグ、本文の更新が即時反映されることを想定しています。','\n',char(10)),'draft','2026-06-10T00:00:00.000Z','2026-06-13T00:00:00.000Z','["テスト"]','public');
INSERT INTO "posts" ("id","slug","title","description","body","status","published_at","updated_at","tags_json","visibility") VALUES('post-access-notes','access-only-notes','Access 限定の設計メモ','Cloudflare Access を通した閲覧者だけに見せる非公開記事のサンプルです。',replace('この記事は `visibility: private` の動作確認用サンプルです。\n\nCloudflare Access を通ったリクエストでは一覧と詳細に現れ、通常の公開導線からは見えません。\n\n使いどころとしては、設計レビューのメモ、社内向け共有、公開前の下書き公開などを想定しています。','\n',char(10)),'published','2026-06-09T00:00:00.000Z','2026-06-13T00:00:00.000Z','["Access","Private"]','private');
CREATE TABLE works (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  body text not null,
  status text not null check (status in ('draft', 'published')),
  published_at text not null,
  updated_at text not null,
  tags_json text,
  links_json text,
  featured integer not null default 0
);
INSERT INTO "works" ("id","slug","title","summary","body","status","published_at","updated_at","tags_json","links_json","featured") VALUES('work-homepage-foundation','sample-work','個人ホームページ基盤','Astro と Cloudflare を使って、ブログと作品紹介を一体化した公開基盤を構築しました。',replace('ブログ、作品一覧、問い合わせフォーム、管理画面の導線を一つの構成にまとめたサンプル実装です。\n\n静的生成を基本としつつ、フォーム送信だけをサーバーサイドで処理する構成にしています。\n\nデモでは、作品本文の中にそのままスライド要約を差し込めます。\n\n::dads{component="button" label="問い合わせる" href="/contact/" type="solid-fill" title="Primary Button"}\n\n::dads{component="chip-label" label="DADS" style="filled-outline" color="blue" title="Chip Label"}\n\n::marp\n---\ntheme: dads\npaginate: true\n---\n\n# 個人ホームページ基盤\n\nAstro + Cloudflare で構築\n\n---\n\n## 含めた機能\n\n- ブログ\n- 作品一覧\n- 問い合わせフォーム\n- 管理画面プレビュー\n\n---\n\n## 運用の方針\n\n更新は D1 を正として管理し、公開ページと管理画面で同じ本文レンダラを使う。\n\n---\n\n## 採用技術\n\n- Astro\n- Cloudflare Pages\n- D1\n- GitHub OAuth\n\n---\n\n## 情報設計\n\n- トップページ\n- ブログ一覧 / 詳細\n- 作品一覧 / 詳細\n- 問い合わせ\n\n---\n\n## 管理画面\n\n- 記事編集\n- 作品編集\n- ホーム文言編集\n- 問い合わせ確認\n\n---\n\n## Markdown レンダリング\n\n- 通常本文は `marked`\n- スライド部分は `Marp`\n- 管理画面でも同じ見え方\n\n---\n\n## プレゼン表示\n\n- 1 枚ずつ表示\n- キーボード操作対応\n- 全画面モード対応\n\n---\n\n## 全画面 UX\n\n- 上端ホバー時だけツール表示\n- 非表示時はスライドを最大化\n- Esc で全画面解除\n\n---\n\n## データ運用\n\n- D1 を正とする\n- seed は初期投入用\n- 公開データは管理画面から更新\n\n---\n\n## ページ構成 1\n\n- `/`\n- `/blog`\n- `/works`\n- `/contact`\n\n---\n\n## ページ構成 2\n\n- `/admin`\n- `/admin/posts`\n- `/admin/works`\n- `/admin/homepage`\n\n---\n\n## 投稿管理\n\n- 下書き保存\n- 公開 / 非公開\n- タグ付け\n- 本文プレビュー\n\n---\n\n## 作品管理\n\n- 概要文\n- 本文\n- 外部リンク\n- featured 設定\n\n---\n\n## ホーム設定\n\n- ヒーロー文言\n- 自己紹介\n- 専門分野\n- 連絡導線\n\n---\n\n## 問い合わせ処理\n\n- フォーム受信\n- D1 保存\n- webhook 転送\n- 管理画面確認\n\n---\n\n## 認証\n\n- GitHub OAuth\n- セッション署名\n- 許可ユーザー制御\n- 管理画面保護\n\n---\n\n## API 構成\n\n- public posts API\n- public profile API\n- admin posts API\n- admin works API\n\n---\n\n## スタイル方針\n\n- DADS を参照\n- 余白を広めに\n- 境界線は薄く\n- 可読性優先\n\n---\n\n## タイポグラフィ\n\n- 本文は serif\n- UI は sans\n- 見出しは太め\n- 行間は広め\n\n---\n\n## カード UI\n\n- 一覧はカード化\n- hover は控えめ\n- 情報は縦に整列\n- モバイルでも崩さない\n\n---\n\n## レイアウト\n\n- 中央寄せコンテナ\n- 詳細ページは 1 カラム\n- 管理画面は 2 カラム入力\n- モバイルで縦積み\n\n---\n\n## Markdown 機能\n\n- GFM\n- 改行反映\n- コードブロック\n- 見出しリンク生成\n\n---\n\n## Marp 埋め込み\n\n- 本文中に直接書ける\n- 一覧表示\n- プレゼン表示\n- 全画面対応\n\n---\n\n## プレゼン操作\n\n- 前後移動ボタン\n- キーボード操作\n- 一覧から直接ジャンプ\n- ページ数表示\n\n---\n\n## 全画面操作\n\n- 上端ホバーでツール表示\n- Esc で解除\n- F キーで切替\n- 余白なし最大表示\n\n---\n\n## List view\n\n- 自動折り返し\n- スクロール対応\n- クリックで対象スライドへ\n- 大量ページでも見やすい\n\n---\n\n## 公開基盤\n\n- Astro build\n- Cloudflare adapter\n- dist 配備\n- custom domain\n\n---\n\n## ローカル開発\n\n- `npm run dev`\n- `npm run check`\n- `npm run build`\n- `.dev.vars`\n\n---\n\n## データ移行\n\n- schema.sql\n- seed.sql\n- D1 binding\n- 実データは手動更新\n\n---\n\n## セキュリティ\n\n- CSRF を避ける設計\n- 管理 API を分離\n- webhook は env 参照\n- セッション secret\n\n---\n\n## パフォーマンス\n\n- 静的生成中心\n- JS は必要箇所のみ\n- 管理画面だけ動的\n- 画像は public 配置\n\n---\n\n## アクセシビリティ\n\n- skip link\n- focus-visible\n- ラベル明示\n- コントラスト確保\n\n---\n\n## 今後の改善 1\n\n- スライドテーマ追加\n- 発表者ノート\n- 印刷最適化\n- プレゼン共有 URL\n\n---\n\n## 今後の改善 2\n\n- 作品検索\n- タグ絞り込み\n- 下書きプレビュー共有\n- API の拡充\n\n---\n\n## 運用フロー\n\n1. 管理画面で編集\n2. プレビュー確認\n3. 公開状態を変更\n4. 本番で確認\n\n---\n\n## 更新対象\n\n- ブログ本文\n- 作品本文\n- ホーム文言\n- 問い合わせ状態\n\n---\n\n## このサンプルの意図\n\n- 長いデッキの動作確認\n- List view の折り返し確認\n- 全画面操作の確認\n- キーボード操作の確認\n\n---\n\n## 今後の拡張候補\n\n- テーマ切替\n- 発表者ノート\n- PDF エクスポート\n- スライド単位共有\n\n---\n\n## まとめ\n\n長文作品の中でも、要点だけをスライドとしてその場で見せられる構成にしている。\n::','\n',char(10)),'published','2026-06-12T00:00:00.000Z','2026-06-13T00:00:00.000Z','["Astro","Cloudflare","Design System"]','[{"label":"GitHub","href":"https://github.com/sora0116/homepage"},{"label":"Demo","href":"https://sora0116.info"}]',1);
INSERT INTO "works" ("id","slug","title","summary","body","status","published_at","updated_at","tags_json","links_json","featured") VALUES('work-process-library','process-library','設計メモライブラリ','UI の意思決定を記事と作品の両面から追えるようにした、社内向けナレッジ整理の試作です。','制作物単体ではなく、背景の意思決定もセットで保存するための試作プロジェクトです。','published','2026-05-28T00:00:00.000Z','2026-06-13T00:00:00.000Z','["Information Architecture","Writing"]','[{"label":"Case Study","href":"https://example.com/case-study"}]',0);
CREATE TABLE site_settings (
  key text primary key,
  value_json text not null,
  updated_at text not null
);
INSERT INTO "site_settings" ("key","value_json","updated_at") VALUES('homepage','{"heroEyebrow":"Personal Homepage","heroTitle":"読みやすく、更新しやすく、長く使える個人サイト。","heroIntro":"制作、設計、文章を横断して記録するための個人ホームページです。DADS を踏まえた、静かで明快な情報設計を目指しています。","aboutBody":"ウェブの情報設計、実装、運用の間をつなぐ仕事をしています。見た目だけではなく、更新のしやすさとアクセシビリティを設計に含めます。","specialties":["フロントエンド実装","デザインシステム整備","技術文書と運用設計"],"contactIntro":"制作の相談、登壇や執筆の連絡、共同検討の依頼などを受け付けています。","location":"Tokyo / Remote","interests":"Design systems, frontend, writing","email":"hello@example.com"}','2026-06-13T00:00:00.000Z');
CREATE TABLE inquiries (
  id text primary key,
  name text not null,
  email text not null,
  message text not null,
  status text not null check (status in ('new', 'in_progress', 'replied', 'archived')),
  source text not null,
  created_at text not null,
  updated_at text not null
);
INSERT INTO "inquiries" ("id","name","email","message","status","source","created_at","updated_at") VALUES('aa1419af-5367-4821-b151-6233d55e9fb4','Test','hoge@example.com','こんにちは！','archived','homepage-contact-form','2026-06-13T02:04:27.879Z','2026-06-13T04:03:45.954Z');
INSERT INTO "inquiries" ("id","name","email","message","status","source","created_at","updated_at") VALUES('09db73d2-759d-4399-878a-60bcd28a0ea1','User','user@gmail.com','うぇーい','archived','homepage-contact-form','2026-06-13T02:05:25.925Z','2026-06-13T02:05:34.299Z');
INSERT INTO "inquiries" ("id","name","email","message","status","source","created_at","updated_at") VALUES('9cf2795c-12c9-426e-8c60-7179de298e42','a','a@a.com','a','archived','homepage-contact-form','2026-06-13T04:02:18.613Z','2026-06-13T04:03:48.974Z');
INSERT INTO "inquiries" ("id","name","email","message","status","source","created_at","updated_at") VALUES('d52b46a7-dfd1-45b4-9094-1686d25a5d4c','test','test@example.com',replace(replace('# ここってMarkdown\r\n- つかえるの？','\r',char(13)),'\n',char(10)),'archived','homepage-contact-form','2026-06-13T04:08:06.403Z','2026-06-13T04:09:01.093Z');
