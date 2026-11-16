"""Fetch checksummed open Noto packages; extract selected fonts on macOS or Linux."""
from pathlib import Path
import hashlib, io, tarfile, subprocess
root=Path(__file__).resolve().parents[1]
cache=root/'.vendor/font-packages';cache.mkdir(parents=True,exist_ok=True)
dest=root/'.vendor/xeet/assets/vendor/fonts';dest.mkdir(parents=True,exist_ok=True)
packages=[
 ('https://archive.ubuntu.com/ubuntu/pool/main/f/fonts-noto/fonts-noto-core_20201225-2_all.deb','4fee136cb12fc197703a340e010478f780a41044339fcefbd78ed9aa96c8b617'),
 ('https://archive.ubuntu.com/ubuntu/pool/main/f/fonts-noto-color-emoji/fonts-noto-color-emoji_2.047-0ubuntu0.24.04.1_all.deb','b102b62ce6a7313315223cff5e052bdf8fc0ad162c9e961ce0dc2202bc139ce2'),
]
wanted={'NotoSans-Regular.ttf','NotoSans-Bold.ttf','NotoSansArabic-Regular.ttf','NotoSansHebrew-Regular.ttf','NotoSansSymbols2-Regular.ttf','NotoColorEmoji.ttf'}
found=set()
for url,digest in packages:
 p=cache/url.rsplit('/',1)[1]
 if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=digest:subprocess.run(["curl","--fail","--location","--retry","2","--max-time","120","--silent","--show-error",url,"-o",str(p)],check=True)
 data=p.read_bytes()
 if hashlib.sha256(data).hexdigest()!=digest:raise SystemExit('Font package checksum mismatch')
 if data[:8]!=b'!<arch>\n':raise SystemExit('Unexpected package format')
 at=8
 while at+60<=len(data):
  head=data[at:at+60];name=head[:16].decode().strip().rstrip('/');size=int(head[48:58]);payload=data[at+60:at+60+size];at+=60+size+(size%2)
  if name.startswith('data.tar'):
   if name.endswith('.zst'):
    import zstandard
    payload=zstandard.ZstdDecompressor().stream_reader(io.BytesIO(payload)).read()
   with tarfile.open(fileobj=io.BytesIO(payload),mode='r:*') as archive:
    for item in archive:
     name=Path(item.name).name
     if item.isfile() and name in wanted:
      (dest/name).write_bytes(archive.extractfile(item).read());found.add(name)
if found!=wanted:raise SystemExit('Missing fonts: '+str(wanted-found))
print('Downloaded and verified six open Noto font files')
