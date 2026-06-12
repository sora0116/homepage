# Homepage

Astro と Cloudflare を前提にした個人ホームページです。ブログと作品は `src/content` の Markdown で管理し、`/admin` では Decap CMS による編集を想定しています。

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run check`

## Environment Variables

- `CONTACT_WEBHOOK_URL`
  問い合わせ送信内容を転送する任意の webhook URL。未設定時は Worker ログへ出力します。
- `GITHUB_OAUTH_CLIENT_ID`
  Decap CMS 用 GitHub OAuth App の Client ID。
- `GITHUB_OAUTH_CLIENT_SECRET`
  Decap CMS 用 GitHub OAuth App の Client Secret。
- `GITHUB_OAUTH_SCOPE`
  任意。既定値は `public_repo`。非公開リポジトリを使う場合は `repo` に変更します。
- ローカル確認では `.dev.vars` を使います。雛形は `.dev.vars.example` を参照してください。

## Cloudflare Pages

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js compatibility should be left on the current default for Pages
- Custom domain: `sora0116.info`

`wrangler.jsonc` は互換日付の固定用です。Astro の Cloudflare adapter により `src/pages/api/contact.ts` は Pages Functions として動作します。

## Decap CMS

`/admin` は手動初期化で `sora0116/homepage` を参照し、`/api/decap/auth` と `/api/decap/auth/callback` で GitHub OAuth を処理します。

GitHub 側では OAuth App を1つ作成し、次を設定します。

- Homepage URL: `https://sora0116.info/admin`
- Authorization callback URL: `https://sora0116.info/api/decap/auth/callback`

作成後に `GITHUB_OAUTH_CLIENT_ID` と `GITHUB_OAUTH_CLIENT_SECRET` を Cloudflare Pages の Secrets に設定してください。

## Post-setup Checklist

- `src/lib/site.ts` のメールアドレスを実アドレスへ更新する
- `CONTACT_WEBHOOK_URL` を Pages の環境変数に設定する
- フォーム送信先 webhook 側で `name`, `email`, `message`, `source` を受けられるようにする
- Decap CMS 用の GitHub OAuth App を作成し、`GITHUB_OAUTH_CLIENT_ID` と `GITHUB_OAUTH_CLIENT_SECRET` を設定する
