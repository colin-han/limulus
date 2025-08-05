# Statementizer策略总结

## 核心设计理念

Statementizer使用**状态机**模式，通过三个状态来解析基于缩进的语法结构，并识别函数调用。

## 三种状态

### 1. NEWLINE状态

**目的**: 处理新行开始，确定缩进级别和语句类型

**策略**:

- `LINEBREAK`: 保持NEWLINE状态，记录token
- `SPACE`: 转到STATEMENT状态，根据缩进创建新statement
- `COMMENT`: 记录注释，保持NEWLINE状态
- `IDENTITY`: 转到STATEMENT状态，设为pendingIdentity（为函数识别做准备）
- 其他token: 转到STATEMENT状态，创建缩进为0的statement

### 2. STATEMENT状态

**目的**: 解析语句内容，识别函数调用模式

**策略**:

- `LINEBREAK`: 转到NEWLINE状态，清空pendingIdentity
- `SPACE/COMMENT`: 直接记录token
- `PARENTHESIS_OPEN`: **关键逻辑** - 如果有pendingIdentity，创建FunctionNode；否则报错
- `IDENTITY`: 将前一个pendingIdentity添加到elements，设置新的pendingIdentity
- 其他token: 将pendingIdentity添加到elements，然后添加当前token

### 3. FUNCTION状态

**目的**: 解析函数参数，支持嵌套函数调用

**策略**:

- `PARENTHESIS_CLOSE`: 完成当前函数，返回上一级状态
- `COMMA`: 参数分隔符，直接记录
- `SPACE/COMMENT/LINEBREAK`: 直接记录
- `IDENTITY`: 设为pendingIdentity（为嵌套函数做准备）
- `PARENTHESIS_OPEN`: 如果有pendingIdentity，创建嵌套FunctionNode
- 其他token: 将pendingIdentity添加到参数，然后添加当前token

## 核心数据结构

### StatementizerContext

```typescript
class StatementizerContext {
  statementStack: StatementNode[]; // statement层级栈
  functionStack: FunctionNode[]; // 函数嵌套栈
  currentStatement: StatementNode; // 当前statement
  currentFunction: FunctionNode | null; // 当前函数
  state: State; // 当前状态
  pendingIdentity: Node | null; // 待处理的标识符
}
```

### 关键策略点

1. **pendingIdentity机制**: 用于识别"标识符+圆括号"模式
2. **双栈结构**: statementStack处理缩进层级，functionStack处理函数嵌套
3. **状态转换**: 根据token类型和当前状态进行状态转换
4. **延迟绑定**: 标识符暂存在pendingIdentity中，等待后续token确定其用途

## 函数识别的核心逻辑

**条件**: `pendingIdentity != null && token.type == 'PARENTHESIS_OPEN'`
**动作**: 创建FunctionNode，将pendingIdentity作为函数名

这确保了只有"标识符+圆括号"的模式才会被识别为函数调用，符合你的需求。

## 当前问题

1. **pendingIdentity处理不完整** - 某些情况下没有正确添加到elements
2. **范围计算错误** - statement的起始位置计算有误
3. **函数参数解析不完整** - 参数没有完全添加到parameters中
4. **嵌套函数支持不足** - 嵌套函数调用的参数处理有问题
