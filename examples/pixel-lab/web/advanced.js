const simdResult = document.querySelector("#simd-result");
const threadResult = document.querySelector("#thread-result");
const isolationResult = document.querySelector("#isolation-result");
const status = document.querySelector("#advanced-status");

const input = Float32Array.from([1, 2, 3, 4, 5, 6, 7]);

function withFloatInput(module, operation) {
  const pointer = module._malloc(input.byteLength);
  if (pointer === 0) {
    throw new Error("메모리 할당 실패");
  }

  try {
    module.HEAPF32.set(input, pointer / Float32Array.BYTES_PER_ELEMENT);
    return operation(pointer);
  } finally {
    module._free(pointer);
  }
}

async function runSimd() {
  const { default: createSimdModule } = await import("./simd_ops.js");
  const module = await createSimdModule();
  const result = withFloatInput(module, (pointer) =>
    module._sum_f32_simd(pointer, input.length));
  simdResult.textContent = String(result);
  return result;
}

async function runThreads() {
  if (!globalThis.crossOriginIsolated) {
    threadResult.textContent = "전용 서버 필요";
    return null;
  }

  const { default: createThreadModule } = await import("./thread_ops.js");
  const module = await createThreadModule();
  const result = withFloatInput(module, (pointer) =>
    module._parallel_sum_f32(pointer, input.length, 3));
  threadResult.textContent = String(result);
  return result;
}

try {
  isolationResult.textContent = globalThis.crossOriginIsolated ? "사용" : "사용 안 함";
  const simd = await runSimd();
  const threaded = await runThreads();
  if (simd !== 28 || (threaded !== null && threaded !== 28)) {
    throw new Error("예상 합계와 결과가 다름");
  }
  status.textContent = threaded === null
    ? "SIMD 확인 완료, pthread는 전용 서버로 다시 확인"
    : "SIMD와 pthread 결과 확인 완료";
} catch (error) {
  console.error(error);
  status.textContent = "고급 모듈 확인 실패, --all 빌드를 확인";
}
