#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PIN=8ddaea31d4ab16c3b14296da851b1fedda843412
mkdir -p .vendor
if [[ ! -d .vendor/xeet/.git ]]; then git clone https://github.com/rauchg/xeet.git .vendor/xeet; fi
git -C .vendor/xeet checkout "$PIN"
cp -R overrides/. .vendor/xeet/
# Open Noto fonts only. Emoji bitmap tables are adapted by scripts/emoji-font.py.
python3 - <<'FONTS'
from pathlib import Path
from zipfile import ZipFile
import hashlib, urllib.request
p=Path('.vendor/xeet-fonts.zip')
expected='b951830b408409d5efa9c8fa78d46d4770d253eddb9c21a71372d8bf3cde1204'
if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=expected:
 urllib.request.urlretrieve('https://xeet.sharenow.today/xeet-fonts.zip',p)
if hashlib.sha256(p.read_bytes()).hexdigest()!=expected: raise SystemExit('Font archive checksum mismatch')
with ZipFile(p) as z:
 for name in z.namelist():
  if Path(name).name!=name: raise SystemExit('Unexpected font archive path')
 z.extractall('.vendor/xeet/assets/vendor/fonts')
FONTS
