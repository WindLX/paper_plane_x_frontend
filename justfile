set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default:
    @just --list

setup:
    pnpm install

dev:
    pnpm dev

run:
    pnpm dev

test:
    pnpm test

lint:
    pnpm lint

lint-fix:
    pnpm lint:fix

format:
    pnpm format

format-check:
    pnpm format:check

typecheck:
    pnpm exec vue-tsc -b

build:
    pnpm build

build-console:
    pnpm build:console

build-console-fast:
    pnpm build:console:fast

pre-commit:
    just format-check
    just lint
    just test
    just build
