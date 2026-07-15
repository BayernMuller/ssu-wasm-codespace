#pragma once

#include <cstddef>
#include <cstdint>

extern "C" {

void invert_rgba(std::uint8_t* pixels, std::size_t byte_length);
void grayscale_rgba(std::uint8_t* pixels, std::size_t byte_length);
void adjust_brightness_rgba(
    std::uint8_t* pixels,
    std::size_t byte_length,
    int amount
);
std::uint32_t checksum_rgba(
    const std::uint8_t* pixels,
    std::size_t byte_length
);
std::uint64_t sum_bytes(
    const std::uint8_t* values,
    std::size_t length
);
double distance_between(
    double x1,
    double y1,
    double x2,
    double y2
);
const char* module_message();
std::size_t utf8_length(const char* text);

}
