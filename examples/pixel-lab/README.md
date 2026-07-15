# Pixel Lab 예제

Pixel Lab은 C++로 이미지 픽셀을 바꾸고 JavaScript로 화면에 표시하는 완성 예제다.

## 빌드

저장소 루트에서 다음 명령을 실행한다.

```bash
bash examples/pixel-lab/build.sh
```

결과는 `examples/pixel-lab/dist/`에 생성된다.

## 실행

```bash
python3 -m http.server 8000 \
  --directory examples/pixel-lab/dist
```

Codespaces의 `PORTS` 탭에서 포트 `8000`을 연다.

## 화면 기능

- `색 반전`은 RGB 값을 반대로 바꾼다.
- `흑백`은 RGB를 같은 밝기 값으로 바꾼다.
- `JS 흑백`은 같은 계산을 JavaScript 기준선으로 실행한다.
- `밝기 적용`은 RGB 값을 늘리거나 줄인다.
- `원본 복원`은 처음 이미지로 돌아간다.
- `이미지 열기`는 자신의 이미지 파일을 사용한다.

최근 처리 영역은 Wasm 필터에서 `Wasm 호출`, JavaScript 기준선에서 `JS 계산`을 표시한다. `전체`는 각 방식의 픽셀 읽기부터 Canvas 반영과 필요한 정리까지다. 지표의 글자와 상태를 바꾸는 시간은 제외한다.

기본 그림을 고정된 크기로 비교하려면 주소 끝에 `?size=small`, `?size=medium`, `?size=large` 중 하나를 붙이고 새로 연다.

## 파일 역할

| 파일 | 역할 |
| --- | --- |
| `src/image_ops.cpp` | C++ 이미지 계산 |
| `web/app.js` | Wasm 호출과 Canvas 처리 |
| `web/js_ops.js` | JavaScript 성능 기준선 |
| `web/index.html` | 화면 요소 |
| `web/advanced.js` | SIMD와 pthread 결과 확인 |
| `web/styles.css` | 화면 모양 |
| `serve.py` | pthread 실행용 HTTP 헤더 제공 |

## 데이터 흐름

```text
Canvas Uint8ClampedArray
-> copy to HEAPU8 view
-> C++ filter
-> same Wasm memory
-> copy to Canvas array
```

JavaScript가 `_malloc`으로 Wasm 공간을 얻고 `_free`로 돌려준다. 이미지 배열 전체를 복사한 뒤 C++ 필터는 한 번만 호출한다.

## 선택 모듈

스레드와 SIMD 모듈까지 만들려면 다음 명령을 사용한다.

```bash
bash examples/pixel-lab/build.sh --all
python3 examples/pixel-lab/serve.py
```

포트 `8000`의 `/advanced.html`을 연다. SIMD와 pthread 결과가 모두 `28`이고 교차 출처 격리가 `사용`인지 확인한다. 확인 후 `Ctrl+C`를 누른다. 이 모듈은 기본 화면에서 사용하지 않는다.
