import createPixelModule from "./pixel_ops.js";
import { grayscaleRgba } from "./js_ops.js";

const canvas = document.querySelector("#preview");
const context = canvas.getContext("2d", { willReadFrequently: true });
const runtimeStatus = document.querySelector("#runtime-status");
const imageInput = document.querySelector("#image-input");
const resetButton = document.querySelector("#reset-button");
const downloadButton = document.querySelector("#download-button");
const brightness = document.querySelector("#brightness");
const brightnessValue = document.querySelector("#brightness-value");
const brightnessButton = document.querySelector("#brightness-button");
const imageSize = document.querySelector("#image-size");
const operationTimeLabel = document.querySelector("#operation-time-label");
const operationTime = document.querySelector("#compute-time");
const totalTime = document.querySelector("#total-time");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

const defaultCanvasSizes = {
  small: { width: 480, height: 320 },
  medium: { width: 960, height: 640 },
  large: { width: 1440, height: 960 },
};

let pixelModule;
let originalImage;

function selectDefaultCanvasSize() {
  const parameters = new URLSearchParams(window.location.search);
  const requestedSize = parameters.get("size") ?? "medium";
  const selectedSize =
    defaultCanvasSizes[requestedSize] ?? defaultCanvasSizes.medium;
  canvas.width = selectedSize.width;
  canvas.height = selectedSize.height;
}

function setControlsEnabled(enabled) {
  for (const element of [
    resetButton,
    downloadButton,
    brightness,
    brightnessButton,
    ...filterButtons,
  ]) {
    element.disabled = !enabled;
  }
}

function drawDefaultImage() {
  const { width, height } = canvas;
  context.fillStyle = "#e8efed";
  context.fillRect(0, 0, width, height);

  const colors = ["#166b5b", "#ee6a5b", "#2f78a5", "#f0bd4f"];
  const columns = 8;
  const rows = 6;
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      context.fillStyle = colors[(row + column) % colors.length];
      const inset = 8 + ((row * columns + column) % 3) * 5;
      context.fillRect(
        column * cellWidth + inset,
        row * cellHeight + inset,
        cellWidth - inset * 2,
        cellHeight - inset * 2,
      );
    }
  }

  context.fillStyle = "#17211f";
  context.font = "700 64px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("PIXEL LAB", width / 2, height / 2);
  captureOriginal();
}

function captureOriginal() {
  originalImage = context.getImageData(0, 0, canvas.width, canvas.height);
  imageSize.textContent = `${canvas.width} x ${canvas.height}`;
  operationTimeLabel.textContent = "처리 구간";
  operationTime.textContent = "-";
  totalTime.textContent = "-";
}

function restoreOriginal() {
  if (!originalImage) {
    return;
  }
  context.putImageData(originalImage, 0, 0);
  brightness.value = "0";
  brightnessValue.value = "0";
  runtimeStatus.textContent = "원본 복원 완료";
}

function formatMilliseconds(value) {
  return `${value.toFixed(2)} ms`;
}

function processPixels(filter, amount = 0) {
  if (!pixelModule) {
    return;
  }

  const totalStarted = performance.now();
  let pointer = 0;
  let wasmCallElapsed = 0;
  let processingError;
  let failureMessage = "필터 처리 실패";

  try {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const bytes = imageData.data;
    pointer = pixelModule._malloc(bytes.byteLength);
    if (pointer === 0) {
      failureMessage = "메모리 할당 실패";
      throw new Error(failureMessage);
    }

    pixelModule.HEAPU8.set(bytes, pointer);

    if (filter === "invert") {
      const wasmCallStarted = performance.now();
      pixelModule._invert_rgba(pointer, bytes.byteLength);
      wasmCallElapsed = performance.now() - wasmCallStarted;
    } else if (filter === "grayscale") {
      const wasmCallStarted = performance.now();
      pixelModule._grayscale_rgba(pointer, bytes.byteLength);
      wasmCallElapsed = performance.now() - wasmCallStarted;
    } else if (filter === "brightness") {
      const wasmCallStarted = performance.now();
      pixelModule._adjust_brightness_rgba(pointer, bytes.byteLength, amount);
      wasmCallElapsed = performance.now() - wasmCallStarted;
    } else {
      throw new Error(`Unknown filter: ${filter}`);
    }

    const currentHeap = pixelModule.HEAPU8;
    bytes.set(currentHeap.subarray(pointer, pointer + bytes.byteLength));
    context.putImageData(imageData, 0, 0);
  } catch (error) {
    processingError = error;
  } finally {
    if (pointer !== 0) {
      pixelModule._free(pointer);
    }
  }

  const totalElapsed = performance.now() - totalStarted;
  if (processingError) {
    console.error(processingError);
    runtimeStatus.textContent = failureMessage;
    return;
  }

  operationTimeLabel.textContent = "Wasm 호출";
  operationTime.textContent = formatMilliseconds(wasmCallElapsed);
  totalTime.textContent = formatMilliseconds(totalElapsed);
  runtimeStatus.textContent = "필터 적용 완료";
}

function processPixelsInJavaScript() {
  const totalStarted = performance.now();
  let computeElapsed = 0;
  let processingError;

  try {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const computeStarted = performance.now();
    grayscaleRgba(imageData.data);
    computeElapsed = performance.now() - computeStarted;
    context.putImageData(imageData, 0, 0);
  } catch (error) {
    processingError = error;
  }

  const totalElapsed = performance.now() - totalStarted;
  if (processingError) {
    console.error(processingError);
    runtimeStatus.textContent = "JavaScript 필터 처리 실패";
    return;
  }

  operationTimeLabel.textContent = "JS 계산";
  operationTime.textContent = formatMilliseconds(computeElapsed);
  totalTime.textContent = formatMilliseconds(totalElapsed);
  runtimeStatus.textContent = "JavaScript 필터 적용 완료";
}

async function loadImage(file) {
  if (!file) {
    return;
  }

  runtimeStatus.textContent = "이미지 불러오는 중";
  try {
    const bitmap = await createImageBitmap(file);
    const maximumDimension = 1600;
    const scale = Math.min(
      1,
      maximumDimension / Math.max(bitmap.width, bitmap.height),
    );
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    captureOriginal();
    runtimeStatus.textContent = "이미지 준비 완료";
  } catch (error) {
    console.error(error);
    runtimeStatus.textContent = "이미지를 열 수 없음";
  } finally {
    imageInput.value = "";
  }
}

function downloadImage() {
  canvas.toBlob((blob) => {
    if (!blob) {
      runtimeStatus.textContent = "PNG 생성 실패";
      return;
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "pixel-lab.png";
    link.click();
    URL.revokeObjectURL(link.href);
    runtimeStatus.textContent = "PNG 저장 완료";
  }, "image/png");
}

imageInput.addEventListener("change", () => loadImage(imageInput.files[0]));
resetButton.addEventListener("click", restoreOriginal);
downloadButton.addEventListener("click", downloadImage);

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    if (button.dataset.filter === "grayscale-js") {
      processPixelsInJavaScript();
    } else {
      processPixels(button.dataset.filter);
    }
  });
}

brightness.addEventListener("input", () => {
  brightnessValue.value = brightness.value;
});

brightnessButton.addEventListener("click", () => {
  processPixels("brightness", Number(brightness.value));
  brightness.value = "0";
  brightnessValue.value = "0";
});

selectDefaultCanvasSize();
drawDefaultImage();

try {
  pixelModule = await createPixelModule();
  const messagePointer = pixelModule._module_message();
  console.info(pixelModule.UTF8ToString(messagePointer));
  setControlsEnabled(true);
  runtimeStatus.textContent = "Wasm 모듈 준비 완료";
} catch (error) {
  console.error(error);
  runtimeStatus.textContent = "Wasm 모듈 시작 실패";
}
