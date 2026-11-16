# Xeet — originally by Guillermo Rauch

https://xeet.sharenow.today — **xeet** (X), **teet** (Threads), **feet** (Facebook), **igeet** (Instagram), **tikeet** (TikTok).

**All credit for the original Xeet goes to [Guillermo Rauch](https://github.com/rauchg).** This is an independent extension, not an official release or endorsement by him.

This fork reuses [rauchg/xeet](https://github.com/rauchg/xeet)'s actual interface, composer and Rust/WASM renderer, pinned at `8ddaea31d4ab16c3b14296da851b1fedda843412`. Apache-2.0; see LICENSE and NOTICE. It adds platform-specific Rust layouts, real public-post resolution and open Noto fonts. No headless browser is involved in PNG rendering. This fork is not pixel-parity certified.

## Build

On Debian/Ubuntu, install Rust, Python with venv, Node, git, fontconfig and dpkg tools. Run `bash scripts/build.sh`. The script fetches pinned upstream source, applies `overrides/`, downloads open Noto fonts, adapts the emoji bitmap font and builds WASM. It copies the upstream example images and Geist fonts and packages the browser SDK and source downloads. Generated binaries, images and credentials are not committed.

`node scripts/render.mjs post.json post.png dark 600` renders offline. `post.platform` is `x`, `threads`, `facebook`, `instagram` or `tiktok`. Omitted platform preserves upstream X behavior. Browser SDK methods are async; serve `deploy/web/xeet.js` alongside `wasm/`. The SDK archive contains both.

## Live links

`deploy/worker.js` is a Cloudflare Worker backed by D1. It queues public-post lookups, caches for one hour and rate limits new requests. `bridge/run.mjs` runs on the connected studio computer and uses its authenticated research CLI. Account credentials stay on that computer. Only a separate, random shared queue key is deployed as `RESOLVER_KEY`.

Install image support with `python3 -m pip install --target .python-deps pillow pillow-heif`. Start the bridge with `node bridge/run.mjs /path/to/private-config.json`, where the mode-600 file has `url` (deployed origin) and `key` (matching RESOLVER_KEY). Supervise with systemd. Never commit the configuration. The service must remain running for uncached public-link lookups. Examples, text and JSON rendering do not depend on it.

Deploy `deploy/` with sharenow Fullstack, providing RESOLVER_KEY in a mode-600 JSON secrets file. The contract persists its app_id after first deployment; subsequent `up` updates that app.

## What is and is not supported

- Actual X renderer and original example carousel, composer, size/theme variants, download and code view.
- Threads detail layout with full-width text/media, public profile picture and native-style actions.
- Facebook and Instagram post layouts; TikTok portrait video still with profile and engagement overlay.
- Real captions, names, avatars, media, timestamps and counts when the public provider returns them. Missing data is omitted; deleted/private/restricted posts may fail.
- Videos render as still images, never downloadable video. Facebook and Instagram show the first carousel item. Threads shows up to four media items. Non-X layouts do not reproduce X-specific polls, quote cards or link-card behavior.
- Open Noto fonts replace upstream platform-specific font files. UI uses upstream open Geist fonts. Upstream example photos are retained as demonstration references, not invented posts.
- Live link resolution is limited to 12 requests per IP/hour and 150 new jobs/day, cached one hour; it is not a public unlimited scraping API.

Verification was manual: actual public post resolution, browser interaction, PNG export and release build. No unit-test suite was added or run.
