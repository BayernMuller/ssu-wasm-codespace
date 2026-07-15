import createModule from "./add.js";

const leftInput = document.querySelector("#left");
const rightInput = document.querySelector("#right");
const result = document.querySelector("#result");
const addButton = document.querySelector("#add");
const subtractButton = document.querySelector("#subtract");

const int32Minimum = -2147483648;
const int32Maximum = 2147483647;

try {
  const module = await createModule();

  function values() {
    const rawValues = [leftInput.value, rightInput.value];
    const parsedValues = rawValues.map(Number);
    const allValuesAreInt32 = parsedValues.every(
      (value) =>
        Number.isInteger(value) &&
        value >= int32Minimum &&
        value <= int32Maximum,
    );
    if (rawValues.includes("") || !allValuesAreInt32) {
      throw new RangeError("32비트 정수를 입력해야 합니다.");
    }
    return parsedValues;
  }

  function calculate(operation, expectedResult) {
    try {
      const [left, right] = values();
      const expected = expectedResult(left, right);
      if (expected < int32Minimum || expected > int32Maximum) {
        throw new RangeError("계산 결과가 32비트 정수 범위를 벗어납니다.");
      }
      result.value = String(operation(left, right));
    } catch (error) {
      result.value = error.message;
    }
  }

  addButton.addEventListener("click", () => {
    calculate(module._add, (left, right) => left + right);
  });
  subtractButton.addEventListener("click", () => {
    calculate(module._subtract, (left, right) => left - right);
  });

  addButton.disabled = false;
  subtractButton.disabled = false;
  result.value = "모듈 준비 완료";
} catch (error) {
  console.error(error);
  result.value = "모듈 시작 실패";
}
