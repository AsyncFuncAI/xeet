#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PIN=8ddaea31d4ab16c3b14296da851b1fedda843412
mkdir -p .vendor
if [[ ! -d .vendor/xeet/.git ]]; then git clone https://github.com/rauchg/xeet.git .vendor/xeet; fi
git -C .vendor/xeet checkout "$PIN"
cp -R overrides/. .vendor/xeet/
# Open Noto fonts only, from checksummed distribution packages.
python3 -m venv .vendor/fonttools-env
.vendor/fonttools-env/bin/pip install fonttools==4.68.0 zstandard==0.25.0
.vendor/fonttools-env/bin/python scripts/fetch-fonts.py
.vendor/fonttools-env/bin/python scripts/emoji-font.py .vendor/xeet/assets/vendor/fonts/NotoColorEmoji.ttf
