# flex-diy

This is fork of the `stable` branch of [bolt.diy](https://github.com/stackblitz-labs/bolt.diy).

### One-time setup

- clone the repo, e.g. git clone git@github.com:get-convex/flex-diy.git
- use node 18 or 20, e.g. `nvm use 18`
- install pnpm somehow, e.g. `npm install -g pnpm
- run `pnpm i`
- set up the .env.local file (do this BEFORE running the next command)
- run `pnpx convex dev --configure existing --team convex --project bolt-diy-f612e --once`

When you create the .env.local file, include at least

```
# Get one from `https://console.anthropic.com/settings/keys` or ask
ANTHROPIC_API_KEY=sk-ant-api03-...

# Our test Auth0 account
VITE_AUTH0_DOMAIN=https://convexdev-test.us.auth0.com
VITE_AUTH0_CLIENT_ID=oEo9vzuqoz5vmtFThMqNrmmCKulsMBPD

# It's important to add this before running a convex commmand
# (but otherwise you can change CONVEX_URL to VITE_CONVEX_URL later)
VITE_CONVEX_URL='placeholder'

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

# Working on the template

There are a few steps to iterating on the template.

Run `npm run rebuild-template` for directions.
