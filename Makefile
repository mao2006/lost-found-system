SHELL := /bin/bash
PNPM ?= pnpm
OUT_DIR ?= out

.PHONY: help clean build ssg

help:
	@echo "可用命令:"
	@echo "  make ssg    - 清理并构建 SSG (输出到 $(OUT_DIR))"
	@echo "  make build  - 执行 next build"
	@echo "  make clean  - 清理构建产物"

clean:
	rm -rf .next $(OUT_DIR)

build:
	$(PNPM) build

ssg: clean build
	@test -d $(OUT_DIR) || (echo "未检测到 $(OUT_DIR)，请检查 next.config.ts 是否配置 output: 'export'" && exit 1)
	@echo "SSG 打包完成，产物目录: $(OUT_DIR)"
