#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
bash scripts/prepare.sh
rustup target add wasm32-unknown-unknown
if ! command -v wasm-bindgen >/dev/null || [[ $(wasm-bindgen --version) != 'wasm-bindgen 0.2.130' ]]; then
 cargo install wasm-bindgen-cli --version 0.2.130 --locked
fi
RUSTFLAGS='-C target-feature=+simd128' CARGO_PROFILE_RELEASE_LTO=thin CARGO_PROFILE_RELEASE_STRIP=false cargo build --manifest-path .vendor/xeet/Cargo.toml -p xeet-wasm --target wasm32-unknown-unknown --release
mkdir -p deploy/web/wasm
wasm-bindgen .vendor/xeet/target/wasm32-unknown-unknown/release/xeet_wasm.wasm --target web --out-dir deploy/web/wasm --out-name teet_wasm
mkdir -p deploy/web/assets
cp -R .vendor/xeet/app/_assets/. deploy/web/assets/
mkdir -p packages/xeet/wasm
wasm-bindgen .vendor/xeet/target/wasm32-unknown-unknown/release/xeet_wasm.wasm --target nodejs --out-dir packages/xeet/wasm --out-name xeet_wasm
printf '{"type":"commonjs"}\n' > packages/xeet/wasm/package.json
(cd packages/xeet && npm pack --pack-destination ../../deploy/web)
python3 scripts/package.py
