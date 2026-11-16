#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Rust + wasm-bindgen are build-time tools; no browser is used to render.
PIN=8ddaea31d4ab16c3b14296da851b1fedda843412
mkdir -p .vendor
if [[ ! -d .vendor/xeet/.git ]]; then git clone https://github.com/rauchg/xeet.git .vendor/xeet; fi
git -C .vendor/xeet checkout "$PIN"
cp -R overrides/. .vendor/xeet/
# The font aliases in the manifest match Xeet internals. Actual files are Noto,
# never Apple's fonts, Arial or Chirp. This build helper targets Debian/Ubuntu.
mkdir -p .vendor/font-packages .vendor/fonts
(
 cd .vendor/font-packages
 apt-get download fonts-noto-core fonts-noto-color-emoji
 for f in ./*.deb; do dpkg-deb -x "$f" ../fonts; done
)
FONT_DIR=.vendor/xeet/assets/vendor/fonts
for f in NotoSans-Regular NotoSans-Bold NotoSansArabic-Regular NotoSansHebrew-Regular NotoSansSymbols2-Regular NotoColorEmoji; do
 cp ".vendor/fonts/usr/share/fonts/truetype/noto/$f.ttf" "$FONT_DIR/"
done
python3 -m venv .vendor/fonttools-env
.vendor/fonttools-env/bin/pip install fonttools==4.68.0
.vendor/fonttools-env/bin/python scripts/emoji-font.py "$FONT_DIR/NotoColorEmoji.ttf"
rustup target add wasm32-unknown-unknown
if ! command -v wasm-bindgen >/dev/null || [[ $(wasm-bindgen --version) != 'wasm-bindgen 0.2.130' ]]; then
 cargo install wasm-bindgen-cli --version 0.2.130 --locked
fi
RUSTFLAGS='-C target-feature=+simd128' CARGO_PROFILE_RELEASE_LTO=thin CARGO_PROFILE_RELEASE_STRIP=false cargo build --manifest-path .vendor/xeet/Cargo.toml -p xeet-wasm --target wasm32-unknown-unknown --release
mkdir -p deploy/web/wasm
wasm-bindgen .vendor/xeet/target/wasm32-unknown-unknown/release/xeet_wasm.wasm --target web --out-dir deploy/web/wasm --out-name teet_wasm
mkdir -p deploy/web/assets
cp -R .vendor/xeet/app/_assets/. deploy/web/assets/
python3 scripts/package.py
