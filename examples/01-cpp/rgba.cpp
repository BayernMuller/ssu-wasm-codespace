#include <array>
#include <cstddef>
#include <cstdint>
#include <iostream>

void invert_rgba(std::uint8_t* pixels, std::size_t byte_length) {
    if (pixels == nullptr) {
        return;
    }

    for (std::size_t index = 0; index + 3 < byte_length; index += 4) {
        pixels[index] = static_cast<std::uint8_t>(255 - pixels[index]);
        pixels[index + 1] = static_cast<std::uint8_t>(255 - pixels[index + 1]);
        pixels[index + 2] = static_cast<std::uint8_t>(255 - pixels[index + 2]);
    }
}

int main() {
    std::array<std::uint8_t, 8> pixels{
        255, 100, 0, 255,
        10, 20, 30, 128,
    };

    invert_rgba(pixels.data(), pixels.size());

    for (const auto value : pixels) {
        std::cout << static_cast<int>(value) << ' ';
    }
    std::cout << '\n';
}
