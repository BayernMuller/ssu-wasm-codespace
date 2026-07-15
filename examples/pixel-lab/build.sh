#!/usr/bin/env bash
set -euo pipefail

build_all=false
if [[ "${1:-}" == "--all" ]]; then
  build_all=true
elif [[ $# -gt 0 ]]; then
  echo "usage: $0 [--all]" >&2
  exit 2
fi

example_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source_dir="${example_dir}/src"
web_dir="${example_dir}/web"
dist_dir="${example_dir}/dist"

rm -rf "${dist_dir}"
mkdir -p "${dist_dir}"
cp "${web_dir}"/* "${dist_dir}/"

common_flags=(
  --no-entry
  -std=c++20
  -O3
  -flto
  -sMODULARIZE=1
  -sEXPORT_ES6=1
  -sENVIRONMENT=web,worker
  -sFILESYSTEM=0
)

em++ "${source_dir}/image_ops.cpp" \
  -I"${source_dir}" \
  -sWASM_BIGINT=1 \
  '-sEXPORTED_FUNCTIONS=["_malloc","_free","_invert_rgba","_grayscale_rgba","_adjust_brightness_rgba","_sum_bytes","_distance_between","_module_message","_utf8_length"]' \
  '-sEXPORTED_RUNTIME_METHODS=["HEAPU8","UTF8ToString","cwrap"]' \
  "${common_flags[@]}" \
  -sALLOW_MEMORY_GROWTH=1 \
  -sGROWABLE_ARRAYBUFFERS=0 \
  -o "${dist_dir}/pixel_ops.js"

if [[ "${build_all}" == true ]]; then
  em++ "${source_dir}/simd_ops.cpp" \
    -msimd128 \
    '-sEXPORTED_FUNCTIONS=["_malloc","_free","_sum_f32_simd"]' \
    '-sEXPORTED_RUNTIME_METHODS=["HEAPF32"]' \
    "${common_flags[@]}" \
    -sALLOW_MEMORY_GROWTH=1 \
    -sGROWABLE_ARRAYBUFFERS=0 \
    -o "${dist_dir}/simd_ops.js"

  em++ "${source_dir}/thread_ops.cpp" \
    -pthread \
    -sPTHREAD_POOL_SIZE=4 \
    -sINITIAL_MEMORY=64MB \
    '-sEXPORTED_FUNCTIONS=["_malloc","_free","_parallel_sum_f32"]' \
    '-sEXPORTED_RUNTIME_METHODS=["HEAPF32"]' \
    "${common_flags[@]}" \
    -o "${dist_dir}/thread_ops.js"
fi

echo "Built Pixel Lab in examples/pixel-lab/dist"
