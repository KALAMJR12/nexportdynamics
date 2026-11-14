# Deploy Nexport with GitHub and Cloudflare Pages

You can publish the public website without buying or connecting a domain. Cloudflare Pages gives it a free `*.pages.dev` address. Each push to the GitHub production branch can trigger a new build and deployment.

The admin API is deliberately closed unless Cloudflare Access is configured. Cloudflare Access for this setup requires a hostname in an active Cloudflare zone, so the public `pages.dev` site can go live first; add a custom domain and Access later when you are ready to enable the admin dashboard.

## Before starting

- A Cloudflare account (a free account is enough for the public site).
- A GitHub account and a repository where you can push this project.
- Node.js and npm installed on your Windows computer.

## 1. Push the project to GitHub

This project is connected to `https://github.com/KALAMJR12/nexportdynamics.git`. The production branch is `main`.

Open Command Prompt in the project folder, then push changes to GitHub:

```cmd
git push -u origin main
```

GitHub will ask you to authenticate if needed. Do not put an access token in the URL or share one in chat. If you are setting up a different repository, create an empty repository and update the remote with `git remote set-url origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git`.

## 2. Create and configure the production D1 database

Install dependencies and authenticate Wrangler:

```cmd
npm ci
npx wrangler login
```

A browser window opens. Sign in and approve Wrangler. Check whether a database already exists:

```cmd
npx wrangler d1 list
```

If `nexport_db` appears, set its ID as `database_id` in `wrangler.toml`. If it does not appear, create it:

```cmd
npx wrangler d1 create nexport_db --update-config
```

Commit and push the updated config so the Pages build can use the database binding:

```cmd
git add wrangler.toml
git commit -m "Configure production D1 database"
git push
```

Apply the schema and placeholder examples:

```cmd
npx wrangler d1 migrations apply nexport_db --remote
```

The sample testimonials and advisories are published with visible `[SAMPLE]` labels as requested. They are placeholders, not verified claims or current operational advice. Replace or unpublish them before treating the site as an official source.

## 3. Connect GitHub to Cloudflare Pages

In the Cloudflare dashboard:

1. Open **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Connect your GitHub account and authorize the repository you just pushed.
3. Select the repository and production branch (`main`).
4. Choose **None** as the framework preset.
5. Set **Build command** to `npm run build`.
6. Set **Build output directory** to `dist`.
7. Use the **V2 build system** if Cloudflare asks which build system to use. The repository's `wrangler.toml` configures Pages Functions and requires V2.
8. Create the project. Cloudflare assigns a URL like `https://<project-name>.pages.dev`.

Before the first build, add `PUBLIC_SITE_URL` in the Pages project's **Settings** → **Environment variables** → **Production**. Set it to the full Pages URL Cloudflare assigned, for example `https://nexport-site.pages.dev`. This ensures the canonical, Open Graph, robots, and sitemap URLs match the deployed site.

## 4. Confirm the production configuration

The D1 binding is already declared in the repository's `wrangler.toml`:

- Binding name: `DB`
- Database: `nexport_db`

When using this Wrangler configuration, treat it as the source of truth for Pages Functions settings. Confirm the deployed project uses the V2 build system and that its build command/output directory match the configuration. Do not add a separate dashboard D1 binding that conflicts with the file.

After setting `PUBLIC_SITE_URL`, trigger a new deployment by pushing a commit or selecting **Retry deployment**.

## 5. Verify the deployment

Open the Pages URL and verify the site loads. Submit a test quote and verify it was stored:

```cmd
npx wrangler d1 execute nexport_db --remote --command "SELECT id, type, created_at FROM messages ORDER BY id DESC LIMIT 5"
```

Public content APIs should display the visibly labeled sample feedback and notices. Replace or unpublish them when real content is ready. Admin APIs remain closed until Cloudflare Access is configured. Delete your test quote before sharing the dashboard or database output.

## 6. Enable the admin dashboard later (requires a domain)

Do this when you own a domain and have added it as an active zone in Cloudflare:

1. In Cloudflare Zero Trust, create a **Self-hosted** Access application for the domain's `/admin*` and `/api/admin/*` paths.
2. Add an **Allow** policy for only your specific email address(es). Do not allow everyone.
3. In the Pages project, set these as **Production** environment variables:
   - `ACCESS_AUD`: the Access application's Application Audience (AUD) tag.
   - `ACCESS_ISSUER`: your team's issuer, for example `https://your-team.cloudflareaccess.com`.
4. Add the custom domain to the Pages project and make sure Access protects that hostname.
5. Redeploy after setting the production variables, then visit `https://<your-domain>/admin/` and sign in through Access.

The API also verifies the signed Access JWT itself. If the variables are missing or a token cannot be verified, admin API requests fail closed.

## Notes before announcing the site

- Confirm that contact details, service claims, mineral grades/quantities, and public business statements are accurate.
- Replace the `[SAMPLE]` feedback and advisories with verified, current content through the admin dashboard after Access is enabled.
- Use a custom domain later if you want branded URLs, Cloudflare Access for the admin, and the company's preferred search-engine canonical domain.
