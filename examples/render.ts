import { writeFileSync } from 'node:fs';
import { loadXeet, type Post } from '@asyncfuncai/xeet/node';

const xeet = await loadXeet();
const post: Post = {
  platform: 'threads',
  text: 'One engine, five platforms.',
  author: { name: 'You', handle: 'you' },
};
const { png, report } = xeet.render(post, { width: 600, theme: 'dark', dpr: 2 });
writeFileSync('post.png', png);
console.log(report.size);
