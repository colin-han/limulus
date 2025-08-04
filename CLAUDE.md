# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

- **构建**: `yarn build` 或 `tsc` - 将TypeScript编译到dist/目录，生成类型声明文件
- **测试**: `yarn test` - 运行Jest测试套件，要求100%代码覆盖率
- **代码检查**: `yarn lint` - 同时运行TypeScript检查和ESLint
  - 仅TypeScript检查: `yarn lint:ts`
  - 仅ESLint检查: `yarn lint:eslint`
  - 自动修复ESLint问题: `yarn lint:fix`
- **代码格式化**: `yarn prettier` - 使用Prettier自动格式化代码

## 项目架构

这是一个基于TypeScript的词法分析库，实现基于缩进的语法解析。核心架构遵循两阶段解析管道：

### 第一阶段：词法分析 (`src/tokenizer.ts`)

- **目的**: 使用基于正则表达式的模式匹配将原始文本转换为类型化令牌
- **核心组件**: `tokenise()` 生成器函数，产出Node对象
- **令牌类型**: 支持字符串、数字、日期/日期时间、标识符、符号、括号、注释、空白和换行符
- **错误处理**: 为无法识别的模式生成ErrorNode实例

### 第二阶段：语句结构化 (`src/statementizer.ts`)

- **目的**: 基于缩进将令牌分组为层次化的语句结构
- **核心组件**: `statementize()` 函数处理分词器输出
- **状态机**: 使用NEWLINE/STATEMENT/GROUP状态跟踪解析上下文
- **输出**: 表示代码结构的StatementNode和GroupNode对象树

### 核心数据类型 (`src/node.ts`, `src/tokens.ts`, `src/statements.ts`)

- **BaseNode**: 所有AST节点的抽象基类，包含类型、范围和文本
- **具体令牌**: CommentNode、StringNode、NumberNode变体等
- **结构节点**: StatementNode（带缩进级别）、GroupNode（括号表达式）
- **范围跟踪**: 所有节点都包含精确的源位置信息

### 工具类

- **Range** (`src/range.ts`): 跟踪源文本中的行/列位置
- **工厂函数** (`src/nodes.ts`): 所有节点类型的便捷构造函数

该库旨在构建依赖类似Python缩进语义的自定义DSL解析器。
