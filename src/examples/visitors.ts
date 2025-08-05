import { BaseVisitor } from '../visitor';
import { Node, GeneralNode, ErrorNode } from '../node';
import { StringNode, IntegerNode, FloatNode, DateNode, DateTimeNode, PercentageNode } from '../tokens';
import { StatementNode, FunctionNode } from '../statements';

/**
 * 文本收集器访问者 - 收集所有节点的文本内容
 */
export class TextCollectorVisitor extends BaseVisitor<string> {
  protected override defaultResult(): string {
    return '';
  }

  protected override aggregateResult(...results: string[][]): string {
    return results.flat().join('');
  }

  protected override visitTerminal(node: Node): string {
    return node.text;
  }

  override visitStatement(node: StatementNode): string {
    // 访问elements和children，避免重复遍历原始tokens
    const elementTexts = this.visitChildren(node.elements);
    const childTexts = this.visitChildren(node.children);
    return this.aggregateResult(elementTexts, childTexts);
  }

  override visitFunction(node: FunctionNode): string {
    // 访问name和parameters，避免重复遍历原始tokens
    const nameText = this.visit(node.name);
    const paramTexts = this.visitChildren(node.parameters);
    return this.aggregateResult([nameText], paramTexts);
  }
}

/**
 * 节点计数器访问者 - 统计不同类型节点的数量
 */
export class NodeCounterVisitor extends BaseVisitor<Record<string, number>> {
  protected override defaultResult(): Record<string, number> {
    return {};
  }

  protected override aggregateResult(...results: Record<string, number>[][]): Record<string, number> {
    const merged: Record<string, number> = {};
    for (const resultGroup of results) {
      for (const result of resultGroup) {
        for (const [type, count] of Object.entries(result)) {
          merged[type] = (merged[type] || 0) + count;
        }
      }
    }
    return merged;
  }

  protected override visitTerminal(node: Node): Record<string, number> {
    return { [node.type]: 1 };
  }

  override visitStatement(node: StatementNode): Record<string, number> {
    const elementCounts = this.visitChildren(node.elements);
    const childCounts = this.visitChildren(node.children);
    const selfCount = { [node.type]: 1 };
    return this.aggregateResult([selfCount], elementCounts, childCounts);
  }

  override visitFunction(node: FunctionNode): Record<string, number> {
    const nameCounts = [this.visit(node.name)];
    const paramCounts = this.visitChildren(node.parameters);
    const selfCount = { [node.type]: 1 };
    return this.aggregateResult([selfCount], nameCounts, paramCounts);
  }
}

/**
 * 思维导图节点接口
 */
export interface MindMapNode {
  title: string;
  children: MindMapNode[];
  metadata?: {
    type?: string;
    value?: unknown;
    position?: { x: number; y: number };
    style?: Record<string, unknown>;
  };
}

/**
 * 思维导图构建器访问者 - 将语法树转换为思维导图结构
 * 这是一个示例实现，展示如何构建高级的语义分析器
 */
export class MindMapBuilderVisitor extends BaseVisitor<MindMapNode[]> {
  protected override defaultResult(): MindMapNode[] {
    return [];
  }

  protected override aggregateResult(...results: MindMapNode[][][]): MindMapNode[] {
    return results.flat(2);
  }

  protected override visitTerminal(_node: Node): MindMapNode[] {
    // 普通终端节点不创建思维导图节点
    return [];
  }

  override visitStatement(node: StatementNode): MindMapNode[] {
    // 每个语句创建一个思维导图节点
    const title = this.extractStatementTitle(node);
    const children: MindMapNode[] = [];

    // 处理子语句
    for (const child of node.children) {
      children.push(...this.visit(child));
    }

    // 处理函数调用
    for (const element of node.elements) {
      if (element.type === 'FUNCTION') {
        children.push(...this.visit(element));
      }
    }

    return [
      {
        title,
        children,
        metadata: {
          type: 'statement',
          value: {
            indent: node.indent,
            range: node.range,
          },
        },
      },
    ];
  }

  override visitFunction(node: FunctionNode): MindMapNode[] {
    const functionName = node.name.text;
    const parameters: MindMapNode[] = [];

    // 将参数转换为子节点
    for (const param of node.parameters) {
      const paramNode = this.createParameterNode(param);
      if (paramNode) {
        parameters.push(paramNode);
      }
    }

    return [
      {
        title: `${functionName}()`,
        children: parameters,
        metadata: {
          type: 'function',
          value: {
            name: functionName,
            parameterCount: node.parameters.length,
            range: node.range,
          },
        },
      },
    ];
  }

  override visitIdentity(node: GeneralNode<'IDENTITY'>): MindMapNode[] {
    // 标识符可以创建简单的节点
    return [
      {
        title: node.text,
        children: [],
        metadata: {
          type: 'identity',
          value: node.text,
        },
      },
    ];
  }

  override visitString(node: StringNode): MindMapNode[] {
    return [
      {
        title: node.text,
        children: [],
        metadata: {
          type: 'string',
          value: node.text.slice(1, -1), // 去掉引号
          style: { color: 'green' },
        },
      },
    ];
  }

  override visitInteger(node: IntegerNode): MindMapNode[] {
    return [
      {
        title: node.value.toString(),
        children: [],
        metadata: {
          type: 'number',
          value: node.value,
          style: { color: 'blue' },
        },
      },
    ];
  }

  override visitFloat(node: FloatNode): MindMapNode[] {
    return [
      {
        title: node.value.toString(),
        children: [],
        metadata: {
          type: 'number',
          value: node.value,
          style: { color: 'blue' },
        },
      },
    ];
  }

  override visitPercentage(node: PercentageNode): MindMapNode[] {
    return [
      {
        title: `${node.percentage}%`,
        children: [],
        metadata: {
          type: 'percentage',
          value: node.value, // 小数形式
          style: { color: 'orange' },
        },
      },
    ];
  }

  override visitDate(node: DateNode): MindMapNode[] {
    return [
      {
        title: node.text,
        children: [],
        metadata: {
          type: 'date',
          value: node.value,
          style: { color: 'purple' },
        },
      },
    ];
  }

  override visitDatetime(node: DateTimeNode): MindMapNode[] {
    return [
      {
        title: node.text,
        children: [],
        metadata: {
          type: 'datetime',
          value: node.value,
          style: { color: 'purple' },
        },
      },
    ];
  }

  /**
   * 从语句节点提取标题
   */
  private extractStatementTitle(node: StatementNode): string {
    if (node.elements.length === 0) {
      return '空语句';
    }

    // 收集非空白、非换行的元素文本
    const meaningfulElements = node.elements.filter(
      (element) => element.type !== 'SPACE' && element.type !== 'LINEBREAK'
    );

    if (meaningfulElements.length === 0) {
      return '空语句';
    }

    // 如果第一个元素是标识符，用它作为标题
    const firstElement = meaningfulElements[0];
    if (firstElement.type === 'IDENTITY') {
      return firstElement.text;
    }

    // 否则使用所有有意义元素的文本
    return meaningfulElements.map((e) => e.text).join(' ');
  }

  /**
   * 创建参数节点
   */
  private createParameterNode(param: Node): MindMapNode | null {
    switch (param.type) {
      case 'IDENTITY':
      case 'STRING':
      case 'INTEGER':
      case 'FLOAT':
      case 'PERCENTAGE':
      case 'DATE':
      case 'DATETIME': {
        const results = this.visit(param);
        return results[0] || null;
      }

      case 'SPACE':
      case 'COMMA':
        // 忽略空白和逗号
        return null;

      default:
        return {
          title: param.text,
          children: [],
          metadata: {
            type: param.type.toLowerCase(),
            value: param.text,
          },
        };
    }
  }
}

/**
 * 错误收集器访问者 - 收集所有错误节点
 */
export class ErrorCollectorVisitor extends BaseVisitor<ErrorNode[]> {
  protected override defaultResult(): ErrorNode[] {
    return [];
  }

  protected override aggregateResult(...results: ErrorNode[][][]): ErrorNode[] {
    return results.flat(2);
  }

  protected override visitTerminal(_node: Node): ErrorNode[] {
    return [];
  }

  override visitError(node: ErrorNode): ErrorNode[] {
    return [node];
  }

  override visitStatement(node: StatementNode): ErrorNode[] {
    const elementErrors = this.visitChildren(node.elements).flat();
    const childErrors = this.visitChildren(node.children).flat();
    return [...elementErrors, ...childErrors];
  }

  override visitFunction(node: FunctionNode): ErrorNode[] {
    const nameErrors = this.visit(node.name);
    const paramErrors = this.visitChildren(node.parameters).flat();
    return [...nameErrors, ...paramErrors];
  }
}
