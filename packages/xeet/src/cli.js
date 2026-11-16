#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { loadXeet, resolvePublicPost } from './node.js';
const args=process.argv.slice(2), command=args.shift();
const usage=`xeet render <post.json|URL|-> --out post.png [--width 600] [--theme dark] [--dpr 2]\nxeet explain <post.json|URL|->\nxeet sheet <post.json|URL|-> --out sheet.png [--widths 390,600] [--themes light,dark]\nxeet resolve <URL> [--out post.json]\nJSON renders offline. Public URLs use the hosted research service.`;
async function main(){
 if(!command||['--help','-h','help'].includes(command)){console.log(usage);return}
 if(!['render','explain','sheet','resolve'].includes(command))throw Error(usage);
 let input,flags={};const allowed=new Set(['--out','--width','--theme','--dpr','--surface','--widths','--themes']);
 while(args.length){const a=args.shift();if(a.startsWith('--')){if(!allowed.has(a)||!args.length)throw Error('Unknown or missing option: '+a);flags[a]=args.shift()}else if(input===undefined)input=a;else throw Error('Unexpected argument: '+a)}
 if(!input)throw Error(usage);
 const isUrl=/^https:\/\//.test(input);let post;
 if(isUrl)post=(await resolvePublicPost(input)).post;
 else{if(command==='resolve')throw Error('resolve needs a public post URL');const data=JSON.parse(readFileSync(input==='-'?0:input,'utf8'));post=data.post||data}
 const output=flags['--out'];if(command==='resolve'){const text=JSON.stringify(post,null,2)+'\n';output?writeFileSync(output,text):process.stdout.write(text);return}
 const xeet=await loadXeet(),options={};for(const[k,name]of [['--width','width'],['--dpr','dpr']])if(flags[k]){const n=Number(flags[k]);if(!Number.isFinite(n)||n<=0)throw Error('Invalid '+k);options[name]=n}if(flags['--theme'])options.theme=flags['--theme'];if(flags['--surface'])options.surface=flags['--surface'];
 if(command==='explain'){console.log(JSON.stringify(xeet.explain(post,options),null,2));return}
 if(!output)throw Error('Provide --out <file.png>');
 const png=command==='sheet'?xeet.sheet({post,widths:(flags['--widths']||'390,600').split(',').map(Number),themes:(flags['--themes']||'light,dark').split(','),dpr:options.dpr||2}):xeet.render(post,options).png;
 writeFileSync(output,png);console.error(output);
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
