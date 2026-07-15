#include <cstdint>

extern "C" {

std::int32_t add(std::int32_t left, std::int32_t right) {
    return left + right;
}

std::int32_t subtract(std::int32_t left, std::int32_t right) {
    return left - right;
}

}
