insert or replace into posts (
  id,
  slug,
  title,
  description,
  body,
  status,
  published_at,
  updated_at,
  tags_json
) values
  (
    'post-first',
    'first-post',
    'はじめての記事',
    'サイトの公開準備と今後書いていく内容についての案内です。',
    'このサイトでは、制作メモ、プロダクトの学び、日々の実験を記録します。

公開直後は設計や実装の話が中心ですが、今後は運用の改善や考え方も蓄積していく予定です。',
    'published',
    '2026-06-13T00:00:00.000Z',
    '2026-06-13T00:00:00.000Z',
    '["お知らせ","設計"]'
  ),
  (
    'post-design-notes',
    'design-notes',
    'DADS を取り入れた個人サイト設計',
    'デジタル庁デザインシステムを個人サイトへ取り込むときの考え方をまとめます。',
    '公共向けの設計思想をそのまま持ち込むのではなく、読みやすさとアクセシビリティを軸に翻訳して使います。

今回のサイトでは、色、余白、フォーム、フォーカス表現を優先して合わせています。',
    'published',
    '2026-06-11T00:00:00.000Z',
    '2026-06-13T00:00:00.000Z',
    '["DADS","デザイン"]'
  ),
  (
    'post-test-blog',
    'test-blog',
    'テスト投稿',
    '管理画面の動作確認用に使うサンプル記事です。',
    'この投稿は動的コンテンツ化後の確認用です。

公開状態やタグ、本文の更新が即時反映されることを想定しています。',
    'draft',
    '2026-06-10T00:00:00.000Z',
    '2026-06-13T00:00:00.000Z',
    '["テスト"]'
  );

insert or replace into works (
  id,
  slug,
  title,
  summary,
  body,
  status,
  published_at,
  updated_at,
  tags_json,
  links_json,
  featured
) values
  (
    'work-homepage-foundation',
    'sample-work',
    '個人ホームページ基盤',
    'Astro と Cloudflare を使って、ブログと作品紹介を一体化した公開基盤を構築しました。',
    'ブログ、作品一覧、問い合わせフォーム、管理画面の導線を一つの構成にまとめたサンプル実装です。

静的生成を基本としつつ、フォーム送信だけをサーバーサイドで処理する構成にしています。',
    'published',
    '2026-06-12T00:00:00.000Z',
    '2026-06-13T00:00:00.000Z',
    '["Astro","Cloudflare","Design System"]',
    '[{"label":"GitHub","href":"https://github.com/sora0116/homepage"},{"label":"Demo","href":"https://sora0116.info"}]',
    1
  ),
  (
    'work-process-library',
    'process-library',
    '設計メモライブラリ',
    'UI の意思決定を記事と作品の両面から追えるようにした、社内向けナレッジ整理の試作です。',
    '制作物単体ではなく、背景の意思決定もセットで保存するための試作プロジェクトです。',
    'published',
    '2026-05-28T00:00:00.000Z',
    '2026-06-13T00:00:00.000Z',
    '["Information Architecture","Writing"]',
    '[{"label":"Case Study","href":"https://example.com/case-study"}]',
    0
  );

insert or replace into site_settings (key, value_json, updated_at) values (
  'homepage',
  '{"heroEyebrow":"Personal Homepage","heroTitle":"読みやすく、更新しやすく、長く使える個人サイト。","heroIntro":"制作、設計、文章を横断して記録するための個人ホームページです。DADS を踏まえた、静かで明快な情報設計を目指しています。","aboutBody":"ウェブの情報設計、実装、運用の間をつなぐ仕事をしています。見た目だけではなく、更新のしやすさとアクセシビリティを設計に含めます。","specialties":["フロントエンド実装","デザインシステム整備","技術文書と運用設計"],"contactIntro":"制作の相談、登壇や執筆の連絡、共同検討の依頼などを受け付けています。","location":"Tokyo / Remote","interests":"Design systems, frontend, writing","email":"hello@example.com"}',
  '2026-06-13T00:00:00.000Z'
);
