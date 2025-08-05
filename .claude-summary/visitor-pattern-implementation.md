# Visitor模式实现总结

本次实现了完整的Visitor模式系统，参考Antlr的SyntaxVisitor范式，为后续实现思维导图DSL的高级语义识别奠定了基础。

## 核心架构

### 1. 基础接口设计 (`src/visitor.ts`)

- **Visitor接口**: 定义了访问所有节点类型的方法
- **BaseVisitor抽象类**: 提供默认实现和通用逻辑
- **accept方法**: 为所有Node类型添加了accept方法以支持访问者模式

```typescript
export interface Visitor<T = any> {
  visit(node: Node): T;
  visitComment(node: GeneralNode<'COMMENT'>): T;
  visitSpace(node: SpaceNode): T;
  // ... 为每种节点类型定义访问方法
}

export abstract class BaseVisitor<T = any> implements Visitor<T> {
  visit(node: Node): T {
    // 根据节点类型分发到具体的访问方法
  }

  protected abstract defaultResult(): T;
  protected aggregateResult(...results: T[][]): T;
  protected visitTerminal(node: Node): T;
}
```

### 2. Node接口扩展

为所有Node类型添加了accept方法:

```typescript
export interface Node<TType extends NodeType = NodeType> {
  readonly type: TType;
  range: Range;
  text: string;
  toString(indent?: string): string;
  accept<T>(visitor: Visitor<T>): T; // 新增
}
```

## 示例Visitor实现 (`src/examples/visitors.ts`)

### 1. TextCollectorVisitor

收集所有节点的文本内容

```typescript
const visitor = new TextCollectorVisitor();
const text = statements.map((stmt) => stmt.accept(visitor)).join('');
```

### 2. NodeCounterVisitor

统计不同类型节点的数量

```typescript
const visitor = new NodeCounterVisitor();
const counts = statement.accept(visitor);
// 结果: { IDENTITY: 3, FUNCTION: 1, PERCENTAGE: 1, ... }
```

### 3. MindMapBuilderVisitor

**核心功能**: 将语法树转换为思维导图结构

```typescript
export interface MindMapNode {
  title: string;
  children: MindMapNode[];
  metadata?: {
    type?: string;
    value?: any;
    position?: { x: number; y: number };
    style?: Record<string, any>;
  };
}

const visitor = new MindMapBuilderVisitor();
const mindMap = statement.accept(visitor);
```

#### 思维导图构建特性:

- **层次结构**: 自动根据语句缩进创建父子关系
- **函数调用**: 转换为带参数的思维导图节点
- **数据类型样式**: 不同类型的数据使用不同颜色
  - 字符串: 绿色
  - 数字: 蓝色
  - 百分比: 橙色
  - 日期: 紫色
- **元数据**: 包含类型、值、范围等详细信息

### 4. ErrorCollectorVisitor

收集语法树中的所有错误节点

```typescript
const visitor = new ErrorCollectorVisitor();
const errors = statement.accept(visitor);
// 返回 ErrorNode[] 数组
```

## 使用示例

### 基础使用

```typescript
import { tokenise } from './tokenizer';
import { statementize } from './statementizer';
import { TextCollectorVisitor } from './examples/visitors';

const doc = `project
    frontend
    backend`;

const statements = statementize(tokenise(doc));
const visitor = new TextCollectorVisitor();
const text = statements[0].accept(visitor);
```

### 思维导图DSL示例

```typescript
const doc = `主项目
    前端开发
        页面设计("用户界面", 85%)
        功能实现(2025-01-01, "React")
    后端开发
        数据库(performance: 95%)
        API接口`;

const statements = statementize(tokenise(doc));
const visitor = new MindMapBuilderVisitor();
const mindMap = statements[0].accept(visitor);

// 结果是层次化的MindMapNode结构，可直接用于渲染思维导图
```

### 自定义Visitor

```typescript
class MyCustomVisitor extends BaseVisitor<string> {
  protected defaultResult(): string {
    return '';
  }

  override visitIdentity(node: GeneralNode<'IDENTITY'>): string {
    return `ID:${node.text}`;
  }

  override visitPercentage(node: PercentageNode): string {
    return `${node.percentage}%`;
  }
}
```

## 测试覆盖

完整的单元测试套件 (`src/visitor.test.ts`):

- 15个测试用例，全部通过
- 覆盖所有visitor实现
- 验证accept方法的正确分发
- 测试思维导图构建的各种场景

## 关键修复：解决重复遍历问题

### 问题分析

初始实现中存在节点重复访问问题：

- StatementNode的`nodes`数组包含所有原始tokens
- FunctionNode的`nodes`数组也包含相同的tokens
- Visitor遍历时会重复计算相同节点，导致PERCENTAGE从1被计算为2

### 解决方案

采用分层遍历策略：

- **StatementNode**: 遍历`elements`（结构化节点）+ `children`（子语句）
- **FunctionNode**: 遍历`name`（函数名）+ `parameters`（参数）
- **保留nodes数组**: 用于源码重构、格式化等功能

### 修复效果

```typescript
// 修复前：func(a, b, 50%)
{
  "IDENTITY": 6,     // 重复计算
  "PERCENTAGE": 2    // 重复计算
}

// 修复后：func(a, b, 50%)
{
  "IDENTITY": 3,     // func, a, b (正确)
  "PERCENTAGE": 1    // 50% (正确)
}
```

## 核心设计原则

1. **单路径遍历**: 每个节点只通过一个语义路径被访问
2. **保留原始数据**: nodes数组保留用于其他功能
3. **清晰的职责分离**:
   - `nodes`: 原始tokens（用于源码操作）
   - `elements/parameters/children`: 结构化节点（用于visitor遍历）

## 后续扩展方向

这个修复后的Visitor模式为实现思维导图DSL的高级语义识别提供了强大基础:

1. **语义分析器**: 可以实现专门的visitor来识别特定的语义模式
2. **代码生成**: 可以从AST生成不同格式的输出
3. **验证器**: 实现语法和语义验证
4. **转换器**: 在不同AST结构间进行转换
5. **优化器**: 对AST进行优化变换

通过这个可扩展且正确的visitor框架，可以轻松实现复杂的DSL处理逻辑，支持思维导图的智能解析、自动布局、样式应用等高级功能。
