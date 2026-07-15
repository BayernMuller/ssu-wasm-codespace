FROM emscripten/emsdk:6.0.2 AS emsdk

FROM mcr.microsoft.com/devcontainers/cpp:1-ubuntu-24.04

COPY --from=emsdk /emsdk /emsdk

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        wabt \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && chown -R vscode:vscode /emsdk

ENV PATH="/emsdk:/emsdk/upstream/emscripten:${PATH}"
