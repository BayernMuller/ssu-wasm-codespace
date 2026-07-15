#include "image_ops.h"

#include <algorithm>
#include <cmath>

namespace {

constexpr std::size_t kChannelsPerPixel = 4;

std::uint8_t clamp_channel(int value) {
    return static_cast<std::uint8_t>(std::clamp(value, 0, 255));
}

bool can_process(const std::uint8_t* pixels, std::size_t byte_length) {
    return pixels != nullptr && byte_length >= kChannelsPerPixel;
}

}  // namespace

extern "C" {

void invert_rgba(std::uint8_t* pixels, std::size_t byte_length) {
    if (!can_process(pixels, byte_length)) {
        return;
    }

    for (std::size_t i = 0; i + 3 < byte_length; i += kChannelsPerPixel) {
        pixels[i] = static_cast<std::uint8_t>(255 - pixels[i]);
        pixels[i + 1] = static_cast<std::uint8_t>(255 - pixels[i + 1]);
        pixels[i + 2] = static_cast<std::uint8_t>(255 - pixels[i + 2]);
    }
}

void grayscale_rgba(std::uint8_t* pixels, std::size_t byte_length) {
    if (!can_process(pixels, byte_length)) {
        return;
    }

    for (std::size_t i = 0; i + 3 < byte_length; i += kChannelsPerPixel) {
        const int luminance =
            (77 * pixels[i] + 150 * pixels[i + 1] +
             29 * pixels[i + 2] + 128) >>
            8;
        const auto gray = static_cast<std::uint8_t>(luminance);
        pixels[i] = gray;
        pixels[i + 1] = gray;
        pixels[i + 2] = gray;
    }
}

void adjust_brightness_rgba(
    std::uint8_t* pixels,
    std::size_t byte_length,
    int amount
) {
    if (!can_process(pixels, byte_length)) {
        return;
    }

    amount = std::clamp(amount, -255, 255);
    for (std::size_t i = 0; i + 3 < byte_length; i += kChannelsPerPixel) {
        pixels[i] = clamp_channel(static_cast<int>(pixels[i]) + amount);
        pixels[i + 1] =
            clamp_channel(static_cast<int>(pixels[i + 1]) + amount);
        pixels[i + 2] =
            clamp_channel(static_cast<int>(pixels[i + 2]) + amount);
    }
}

std::uint32_t checksum_rgba(
    const std::uint8_t* pixels,
    std::size_t byte_length
) {
    if (pixels == nullptr) {
        return 0;
    }

    std::uint32_t hash = 2166136261u;
    for (std::size_t i = 0; i < byte_length; ++i) {
        hash ^= pixels[i];
        hash *= 16777619u;
    }
    return hash;
}

std::uint64_t sum_bytes(
    const std::uint8_t* values,
    std::size_t length
) {
    if (values == nullptr) {
        return 0;
    }

    std::uint64_t total = 0;
    for (std::size_t i = 0; i < length; ++i) {
        total += values[i];
    }
    return total;
}

double distance_between(
    double x1,
    double y1,
    double x2,
    double y2
) {
    return std::hypot(x2 - x1, y2 - y1);
}

const char* module_message() {
    return "Pixel Lab module ready";
}

std::size_t utf8_length(const char* text) {
    if (text == nullptr) {
        return 0;
    }

    std::size_t length = 0;
    while (text[length] != '\0') {
        ++length;
    }
    return length;
}

}  // extern "C"
