export function grayscaleRgba(bytes) {
  for (let index = 0; index + 3 < bytes.length; index += 4) {
    const luminance = (
      77 * bytes[index]
      + 150 * bytes[index + 1]
      + 29 * bytes[index + 2]
      + 128
    ) >> 8;
    bytes[index] = luminance;
    bytes[index + 1] = luminance;
    bytes[index + 2] = luminance;
  }
}
