from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).resolve().parents[1]
web=root/'deploy/web'
with ZipFile(web/'xeet-sdk.zip','w',ZIP_DEFLATED) as z:
 for p in [web/'xeet.js',*sorted((web/'wasm').glob('*'))]:
  if p.is_file(): z.write(p,p.relative_to(web))
 for name in ['LICENSE','NOTICE']: z.write(root/name,name)
with ZipFile(web/'xeet-source.zip','w',ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  rel=p.relative_to(root)
  if any(x in rel.parts for x in ['.git','.vendor','.python-deps','.tools','wasm']): continue
  if rel.parts[:3] == ('deploy','web','assets'): continue
  if not p.is_file() or p.suffix in ['.zip','.log','.png'] or p.name in ['.studio-port','dev.mjs']: continue
  z.write(p,rel)
print('Packaged source and browser SDK')
