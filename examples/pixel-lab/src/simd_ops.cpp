#include <cstddef>

#if defined(__wasm_simd128__)
#include <wasm_simd128.h>
#endif

namespace {

#if defined(__wasm_simd128__)
float horizontal_sum_f32x4(v128_t value) {
    return wasm_f32x4_extract_lane(value, 0) +
           wasm_f32x4_extract_lane(value, 1) +
           wasm_f32x4_extract_lane(value, 2) +
           wasm_f32x4_extract_lane(value, 3);
}
#endif

}  // namespace

extern "C" float sum_f32_simd(
    const float* values,
    std::size_t length
) {
    if (values == nullptr || length == 0) {
        return 0.0f;
    }

#if defined(__wasm_simd128__)
    v128_t accumulator = wasm_f32x4_splat(0.0f);
    std::size_t index = 0;

    for (; index + 4 <= length; index += 4) {
        const v128_t chunk = wasm_v128_load(values + index);
        accumulator = wasm_f32x4_add(accumulator, chunk);
    }

    float total = horizontal_sum_f32x4(accumulator);

    for (; index < length; ++index) {
        total += values[index];
    }
    return total;
#else
    float total = 0.0f;
    for (std::size_t i = 0; i < length; ++i) {
        total += values[i];
    }
    return total;
#endif
}
