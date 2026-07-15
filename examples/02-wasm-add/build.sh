#!/usr/bin/env bash
set -euo pipefail

example_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
dist_dir="${example_dir}/dist"

rm -rf "${dist_dir}"
mkdir -p "${dist_dir}"
cp "${example_dir}"/web/* "${dist_dir}/"

em++ "${example_dir}/src/add.cpp" \
  --no-entry \
  -std=c++20 \
  -O2 \
  -sMODULARIZE=1 \
  -sEXPORT_ES6=1 \
  -sENVIRONMENT=web \
  '-sEXPORTED_FUNCTIONS=["_add","_subtract"]' \
  -o "${dist_dir}/add.js"

echo "Built examples/02-wasm-add/dist"
