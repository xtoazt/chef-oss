# flex-diy

This is fork of the `stable` branch of [bolt.diy](https://github.com/stackblitz-labs/bolt.diy).

### One-time setup

- clone the repo, e.g. git clone git@github.com:get-convex/flex-diy.git
- use node 18 or 20, e.g. `nvm use 18`
- install pnpm somehow, e.g. `npm install -g pnpm
- run `pnpm i`
- run `pnpx convex dev --configure existing --team convex --project bolt-diy-f612e`

Create a .env.local file, include at least

```
# makes it so you won't have to paste one in
ANTHROPIC_API_KEY=sk-ant-api03-...
# Optional, less important now that we download less from GitHub.
# Prevents being rate-limited by GitHub (which causes "Failed to download template")
VITE_GITHUB_ACCESS_TOKEN=ghp_...
# maybe useful
VITE_LOG_LEVEL=debug
```

# each time

```
pnpm i
pnpm run dev
# and in another terminal,
pnpx convex dev
```

### Auth

There are two forms of auth, dictated by the `FLEX_AUTH_MODE` environment variable.

#### `FLEX_AUTH_MODE=InviteCode`

- Convex projects are provisioned automatically against one of our teams
- The credentials are saved as default environment variables on the `bolt-diy-f612` Convex project
- You need a "code" to access Flex. There's an internal mutation you can run to issue yourself a code (e.g. `sshader-test`).
- Each code corresponds to a user, so if you're doing this in production, issue a code with your name in it.

#### `FLEX_AUTH_MODE=ConvexOAuth`

- Users sign in with their Github account to Convex (as of writing, actually a test Convex Auth0 app)
- Users go through an OAuth flow to link projects in their account to Flex

# Working on the template

There are a few steps to iterating on the template.

Run `npm run rebuild-template` for directions.
