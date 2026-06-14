# Homepage

Astro と Cloudflare を前提にした個人ホームページです。ブログ、作品、トップページ文言は `D1` を正として管理し、`/admin` から更新します。

## Scripts

- `npm install`
- `npm run db:local:reset`
- `npm run dev`
- `npm run build`
- `npm run check`

## Environment Variables

- `CONTACT_WEBHOOK_URL`
  問い合わせ送信内容を転送する任意の webhook URL。未設定時は Worker ログへ出力します。
- `GITHUB_OAUTH_CLIENT_ID`
  管理画面用 GitHub OAuth App の Client ID。
- `GITHUB_OAUTH_CLIENT_SECRET`
  管理画面用 GitHub OAuth App の Client Secret。
- `GITHUB_OAUTH_SCOPE`
  任意。既定値は `public_repo`。非公開リポジトリを使う場合は `repo` に変更します。
- `ADMIN_SESSION_SECRET`
  任意。管理セッション署名用の secret。未設定時は `GITHUB_OAUTH_CLIENT_SECRET` を使います。
- `ADMIN_GITHUB_LOGINS`
  任意。管理を許可する GitHub login をカンマ区切りで指定します。既定は `sora0116` です。
- `ADMIN_LOCAL_LOGIN`
  任意。`npm run dev` 時だけ使う簡易ログインを有効化します。`true` のとき `/api/admin/auth/login` は GitHub OAuth ではなくローカル管理セッションを発行します。
- `ADMIN_LOCAL_LOGIN_USERNAME`
  任意。ローカル簡易ログイン時の login 名です。未設定時は `ADMIN_GITHUB_LOGINS` の先頭を使います。
- `ADMIN_LOCAL_LOGIN_NAME`
  任意。ローカル簡易ログイン時の表示名です。
- `ADMIN_LOCAL_LOGIN_AVATAR_URL`
  任意。ローカル簡易ログイン時の avatar URL です。
- ローカル確認では `.dev.vars` を使います。雛形は `.dev.vars.example` を参照してください。

## Local Dev

`npm run dev` では Node 上にローカル開発用の runtime shim を差し込み、`DB` と admin セッションを localhost 上で確認できます。

1. `.dev.vars.example` をコピーして `.dev.vars` を作る
2. 必要なら `ADMIN_LOCAL_LOGIN="true"` のままにする
3. `npm run db:local:reset`
4. `npm run dev`

これで:

- `DB` は `.wrangler/state/local-dev/homepage.sqlite` に永続化され、初回アクセス時も自動で schema / seed が入る
- 添付ファイルは `.wrangler/state/local-dev/media` に保存され、`/media/*` から配信される
- `/admin` は `ADMIN_LOCAL_LOGIN="true"` のときローカル簡易ログインで入れる
- cookie は localhost では `Secure` なしで発行されるので `http://localhost` でも管理セッションを維持できる

## Cloudflare Pages

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js compatibility should be left on the current default for Pages
- Custom domain: `sora0116.info`

`wrangler.jsonc` は互換日付の固定用です。Astro の Cloudflare adapter により `src/pages/api/contact.ts` は Pages Functions として動作します。

## D1 Setup

`DB` という名前で D1 binding を Worker に追加してください。スキーマと初期データは [db/schema.sql](/home/sora/work/homepage/db/schema.sql:1) と [db/seed.sql](/home/sora/work/homepage/db/seed.sql:1) にあります。問い合わせ保存も同じ D1 を使います。

ブログ本文の添付ファイル用に、`MEDIA_BUCKET` という名前の R2 binding も使います。`wrangler.jsonc` と `wrangler.toml.example` には `homepage-media` を入れてあるので、実際のバケット名に合わせて必要なら差し替えてください。管理画面からアップロードした画像やファイルはここへ保存し、`/media/*` で公開配信します。アップロード metadata は `media_assets` テーブルにも保存し、記事をまたいで再利用できるようにしています。

既存の `posts` テーブルを使っている環境では、非公開ブログ用に [db/migrations/0002_posts_visibility.sql](/home/sora/work/homepage/db/migrations/0002_posts_visibility.sql:1) と、メディア一覧用に [db/migrations/0003_media_assets.sql](/home/sora/work/homepage/db/migrations/0003_media_assets.sql:1) も反映してください。

## Private Blog Posts

ブログ記事には `visibility` があり、`private` の記事は `/private-blog/*` にだけ出ます。さらに Cloudflare Access を通ったリクエストでだけ表示されます。実装上は `cf-access-authenticated-user-email` か `cf-access-jwt-assertion` ヘッダの存在を見ています。

そのため、本番で使うときは `/private-blog/*` に対して Cloudflare Access のアプリケーションを前段に置いてください。

## Admin Auth

`/admin` は GitHub OAuth で保護し、`/api/admin/auth/login` と `/api/admin/auth/callback` で認証を処理します。

GitHub 側では OAuth App を1つ作成し、次を設定します。

- Homepage URL: `https://sora0116.info/admin`
- Authorization callback URL: `https://sora0116.info/api/admin/auth/callback`

作成後に `GITHUB_OAUTH_CLIENT_ID` と `GITHUB_OAUTH_CLIENT_SECRET` を Cloudflare の Worker runtime secrets に設定してください。

## Post-setup Checklist

- `src/lib/site.ts` のメールアドレスを実アドレスへ更新する
- `CONTACT_WEBHOOK_URL` を Pages の環境変数に設定する
- 問い合わせ保存用に `db/schema.sql` の `inquiries` テーブルを反映する
- フォーム送信先 webhook 側で `name`, `email`, `message`, `source` を受けられるようにする
- `DB` D1 binding を設定し、`db/schema.sql` と `db/seed.sql` を反映する
- 管理画面用の GitHub OAuth App を作成し、`GITHUB_OAUTH_CLIENT_ID` と `GITHUB_OAUTH_CLIENT_SECRET` を設定する
