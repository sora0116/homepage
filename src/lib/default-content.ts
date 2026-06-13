export type PostStatus = "draft" | "published";

export interface PostRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: PostStatus;
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

設計レビュー用の資料は、本文中にそのまま埋め込んで確認できます。

::slide{src="https://docs.google.com/presentation/d/1Gk4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b/edit#slide=id.p1" title="Google Slides のサンプル" aspect="16:9"}

配布用の PDF も同じ書式で並べられます。

::slide{src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" title="PDF のサンプル" aspect="16:9"}`,
    status: "published",
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
    publishedAt: "2026-06-10T00:00:00.000Z",
    updatedAt: now,
    tags: ["テスト"]
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

デモでは、外部公開したスライド URL をそのまま作品本文に差し込めます。

::slide{src="https://sli.dev/" title="Slidev 公開 URL のサンプル" aspect="16:9"}

Marp で出力した HTML を置いている場合も同じです。

::slide{src="https://marp.app/" title="Marp 公開 HTML のサンプル" aspect="16:9"}`,
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
