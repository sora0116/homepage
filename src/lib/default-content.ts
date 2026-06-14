export type PostStatus = "draft" | "published";
export type PostVisibility = "public" | "private";

export interface PostRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: PostStatus;
  visibility: PostVisibility;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
}

export interface WorkLink {
  label: string;
  href: string;
}

export interface WorkRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  status: PostStatus;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  links: WorkLink[];
  featured: boolean;
}

export interface HomepageSettings {
  heroEyebrow: string;
  heroTitle: string;
  heroIntro: string;
  aboutBody: string;
  specialties: string[];
  contactIntro: string;
  location: string;
  interests: string;
  email: string;
}

const now = "2026-06-13T00:00:00.000Z";

export const defaultPosts: PostRecord[] = [
  {
    id: "post-first",
    slug: "first-post",
    title: "はじめての記事",
    description: "サイトの公開準備と今後書いていく内容についての案内です。",
    body: `このサイトでは、制作メモ、プロダクトの学び、日々の実験を記録します。

公開直後は設計や実装の話が中心ですが、今後は運用の改善や考え方も蓄積していく予定です。`,
    status: "published",
    visibility: "public",
    publishedAt: "2026-06-13T00:00:00.000Z",
    updatedAt: now,
    tags: ["お知らせ", "設計"]
  },
  {
    id: "post-design-notes",
    slug: "design-notes",
    title: "DADS を取り入れた個人サイト設計",
    description: "デジタル庁デザインシステムを個人サイトへ取り込むときの考え方をまとめます。",
    body: `公共向けの設計思想をそのまま持ち込むのではなく、読みやすさとアクセシビリティを軸に翻訳して使います。

今回のサイトでは、色、余白、フォーム、フォーカス表現を優先して合わせています。

設計レビュー用の要点は、本文の一部をそのまま Marp スライドとして見せられます。

::dads{component="notification-banner" type="info" heading="DADS Notification Banner" body="本文から実コンポーネントをそのまま呼び出せます。" title="Notification Banner"}

::marp
---
theme: dads
paginate: true
---

# DADS を個人サイトに移すときの要点

- 可読性を最優先にする
- 余白とフォームを先に揃える
- 更新導線まで設計に含める

---

## このサイトで優先した項目

1. 色のコントラスト
2. フォーカスの見え方
3. 管理画面からの更新しやすさ
::`,
    status: "published",
    visibility: "public",
    publishedAt: "2026-06-11T00:00:00.000Z",
    updatedAt: now,
    tags: ["DADS", "デザイン"]
  },
  {
    id: "post-test-blog",
    slug: "test-blog",
    title: "テスト投稿",
    description: "管理画面の動作確認用に使うサンプル記事です。",
    body: `この投稿は動的コンテンツ化後の確認用です。

公開状態やタグ、本文の更新が即時反映されることを想定しています。`,
    status: "draft",
    visibility: "public",
    publishedAt: "2026-06-10T00:00:00.000Z",
    updatedAt: now,
    tags: ["テスト"]
  },
  {
    id: "post-access-notes",
    slug: "access-only-notes",
    title: "Access 限定の設計メモ",
    description: "Cloudflare Access を通した閲覧者だけに見せる非公開記事のサンプルです。",
    body: `この記事は \`visibility: private\` の動作確認用サンプルです。

Cloudflare Access を通ったリクエストでは一覧と詳細に現れ、通常の公開導線からは見えません。

使いどころとしては、設計レビューのメモ、社内向け共有、公開前の下書き公開などを想定しています。`,
    status: "published",
    visibility: "private",
    publishedAt: "2026-06-09T00:00:00.000Z",
    updatedAt: now,
    tags: ["Access", "Private"]
  }
];

export const defaultWorks: WorkRecord[] = [
  {
    id: "work-homepage-foundation",
    slug: "sample-work",
    title: "個人ホームページ基盤",
    summary:
      "Astro と Cloudflare を使って、ブログと作品紹介を一体化した公開基盤を構築しました。",
    body: `ブログ、作品一覧、問い合わせフォーム、管理画面の導線を一つの構成にまとめたサンプル実装です。

静的生成を基本としつつ、フォーム送信だけをサーバーサイドで処理する構成にしています。

デモでは、作品本文の中にそのままスライド要約を差し込めます。

::dads{component="button" label="問い合わせる" href="/contact/" type="solid-fill" title="Primary Button"}

::dads{component="chip-label" label="DADS" style="filled-outline" color="blue" title="Chip Label"}

::marp
---
theme: dads
paginate: true
---

# 個人ホームページ基盤

Astro + Cloudflare で構築

---

## 含めた機能

- ブログ
- 作品一覧
- 問い合わせフォーム
- 管理画面プレビュー

---

## 運用の方針

更新は D1 を正として管理し、公開ページと管理画面で同じ本文レンダラを使う。

---

## 採用技術

- Astro
- Cloudflare Pages
- D1
- GitHub OAuth

---

## 情報設計

- トップページ
- ブログ一覧 / 詳細
- 作品一覧 / 詳細
- 問い合わせ

---

## 管理画面

- 記事編集
- 作品編集
- ホーム文言編集
- 問い合わせ確認

---

## Markdown レンダリング

- 通常本文は \`marked\`
- スライド部分は \`Marp\`
- 管理画面でも同じ見え方

---

## プレゼン表示

- 1 枚ずつ表示
- キーボード操作対応
- 全画面モード対応

---

## 全画面 UX

- 上端ホバー時だけツール表示
- 非表示時はスライドを最大化
- Esc で全画面解除

---

## データ運用

- D1 を正とする
- seed は初期投入用
- 公開データは管理画面から更新

---

## ページ構成 1

- \`/\`
- \`/blog\`
- \`/works\`
- \`/contact\`

---

## ページ構成 2

- \`/admin\`
- \`/admin/posts\`
- \`/admin/works\`
- \`/admin/homepage\`

---

## 投稿管理

- 下書き保存
- 公開 / 非公開
- タグ付け
- 本文プレビュー

---

## 作品管理

- 概要文
- 本文
- 外部リンク
- featured 設定

---

## ホーム設定

- ヒーロー文言
- 自己紹介
- 専門分野
- 連絡導線

---

## 問い合わせ処理

- フォーム受信
- D1 保存
- webhook 転送
- 管理画面確認

---

## 認証

- GitHub OAuth
- セッション署名
- 許可ユーザー制御
- 管理画面保護

---

## API 構成

- public posts API
- public profile API
- admin posts API
- admin works API

---

## スタイル方針

- DADS を参照
- 余白を広めに
- 境界線は薄く
- 可読性優先

---

## タイポグラフィ

- 本文は serif
- UI は sans
- 見出しは太め
- 行間は広め

---

## カード UI

- 一覧はカード化
- hover は控えめ
- 情報は縦に整列
- モバイルでも崩さない

---

## レイアウト

- 中央寄せコンテナ
- 詳細ページは 1 カラム
- 管理画面は 2 カラム入力
- モバイルで縦積み

---

## Markdown 機能

- GFM
- 改行反映
- コードブロック
- 見出しリンク生成

---

## Marp 埋め込み

- 本文中に直接書ける
- 一覧表示
- プレゼン表示
- 全画面対応

---

## プレゼン操作

- 前後移動ボタン
- キーボード操作
- 一覧から直接ジャンプ
- ページ数表示

---

## 全画面操作

- 上端ホバーでツール表示
- Esc で解除
- F キーで切替
- 余白なし最大表示

---

## List view

- 自動折り返し
- スクロール対応
- クリックで対象スライドへ
- 大量ページでも見やすい

---

## 公開基盤

- Astro build
- Cloudflare adapter
- dist 配備
- custom domain

---

## ローカル開発

- \`npm run dev\`
- \`npm run check\`
- \`npm run build\`
- \`.dev.vars\`

---

## データ移行

- schema.sql
- seed.sql
- D1 binding
- 実データは手動更新

---

## セキュリティ

- CSRF を避ける設計
- 管理 API を分離
- webhook は env 参照
- セッション secret

---

## パフォーマンス

- 静的生成中心
- JS は必要箇所のみ
- 管理画面だけ動的
- 画像は public 配置

---

## アクセシビリティ

- skip link
- focus-visible
- ラベル明示
- コントラスト確保

---

## 今後の改善 1

- スライドテーマ追加
- 発表者ノート
- 印刷最適化
- プレゼン共有 URL

---

## 今後の改善 2

- 作品検索
- タグ絞り込み
- 下書きプレビュー共有
- API の拡充

---

## 運用フロー

1. 管理画面で編集
2. プレビュー確認
3. 公開状態を変更
4. 本番で確認

---

## 更新対象

- ブログ本文
- 作品本文
- ホーム文言
- 問い合わせ状態

---

## このサンプルの意図

- 長いデッキの動作確認
- List view の折り返し確認
- 全画面操作の確認
- キーボード操作の確認

---

## 今後の拡張候補

- テーマ切替
- 発表者ノート
- PDF エクスポート
- スライド単位共有

---

## まとめ

長文作品の中でも、要点だけをスライドとしてその場で見せられる構成にしている。
::`,
    status: "published",
    publishedAt: "2026-06-12T00:00:00.000Z",
    updatedAt: now,
    tags: ["Astro", "Cloudflare", "Design System"],
    links: [
      { label: "GitHub", href: "https://github.com/sora0116/homepage" },
      { label: "Demo", href: "https://sora0116.info" }
    ],
    featured: true
  },
  {
    id: "work-process-library",
    slug: "process-library",
    title: "設計メモライブラリ",
    summary:
      "UI の意思決定を記事と作品の両面から追えるようにした、社内向けナレッジ整理の試作です。",
    body: `制作物単体ではなく、背景の意思決定もセットで保存するための試作プロジェクトです。`,
    status: "published",
    publishedAt: "2026-05-28T00:00:00.000Z",
    updatedAt: now,
    tags: ["Information Architecture", "Writing"],
    links: [{ label: "Case Study", href: "https://example.com/case-study" }],
    featured: false
  }
];

export const defaultHomepageSettings: HomepageSettings = {
  heroEyebrow: "Personal Homepage",
  heroTitle: "読みやすく、更新しやすく、長く使える個人サイト。",
  heroIntro:
    "制作、設計、文章を横断して記録するための個人ホームページです。DADS を踏まえた、静かで明快な情報設計を目指しています。",
  aboutBody:
    "ウェブの情報設計、実装、運用の間をつなぐ仕事をしています。見た目だけではなく、更新のしやすさとアクセシビリティを設計に含めます。",
  specialties: [
    "フロントエンド実装",
    "デザインシステム整備",
    "技術文書と運用設計"
  ],
  contactIntro:
    "制作の相談、登壇や執筆の連絡、共同検討の依頼などを受け付けています。",
  location: "Tokyo / Remote",
  interests: "Design systems, frontend, writing",
  email: "hello@example.com"
};
