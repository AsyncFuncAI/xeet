# Xeet — originally by Guillermo Rauch

All credit for the original Xeet design and renderer goes to [Guillermo Rauch](https://github.com/rauchg/xeet). This independent fork adds five-platform layouts and a public-post resolver. Apache-2.0.

Install the built package (not published to the npm registry):

```sh
npm install https://xeet.sharenow.today/asyncfuncai-xeet-0.2.1.tgz
```

```ts
import { loadXeet, resolvePublicPost, type Post } from '@asyncfuncai/xeet/node';
import { writeFileSync } from 'node:fs';
const xeet = await loadXeet();
const post: Post = { platform: 'threads', text: 'Hello.', author: { name: 'You', handle: 'you' } };
const { png, report } = xeet.render(post, { width: 600, theme: 'dark', dpr: 2 });
writeFileSync('post.png', png);
// const { post } = await resolvePublicPost('https://www.threads.com/@name/post/id');
```

`render`, `explain`, `renderPng`, `renderRgba`, `renderMany` and `sheet` use upstream's synchronous API after loading. Types are bundled. `platform` accepts x, threads, facebook, instagram and tiktok; omit it for X.

`npx xeet render post.json --out post.png --theme dark` uses the same WASM core. `npx xeet resolve URL --out post.json` uses the hosted service. JSON rendering is offline; live links depend on the service and its rate limits. Upstream `xeet.resolve` retains its original X resolver; use `resolvePublicPost` for all five platforms.
