import { Node, GeneralNode, ErrorNode, Visitor as IVisitor } from './node';
import {
  SpaceNode,
  LineBreakNode,
  StringNode,
  IntegerNode,
  FloatNode,
  DateNode,
  DateTimeNode,
  PercentageNode,
} from './tokens';
import { StatementNode, FunctionNode } from './statements';

/**
 * 基础访问者接口，定义了访问所有节点类型的方法
 * 泛型T表示访问方法的返回类型
 */
export interface Visitor<T = unknown> extends IVisitor<T> {
  // Token节点访问方法
  visitComment(node: GeneralNode<'COMMENT'>): T;
  visitSpace(node: SpaceNode): T;
  visitParenthesisOpen(node: GeneralNode<'PARENTHESIS_OPEN'>): T;
  visitParenthesisClose(node: GeneralNode<'PARENTHESIS_CLOSE'>): T;
  visitComma(node: GeneralNode<'COMMA'>): T;
  visitSymbol(node: GeneralNode<'SYMBOL'>): T;
  visitLinebreak(node: LineBreakNode): T;
  visitIdentity(node: GeneralNode<'IDENTITY'>): T;
  visitString(node: StringNode): T;
  visitInteger(node: IntegerNode): T;
  visitFloat(node: FloatNode): T;
  visitDate(node: DateNode): T;
  visitDatetime(node: DateTimeNode): T;
  visitPercentage(node: PercentageNode): T;
  visitArrow(node: GeneralNode<'ARROW'>): T;

  // 语句节点访问方法
  visitStatement(node: StatementNode): T;
  visitFunction(node: FunctionNode): T;

  // 错误节点访问方法
  visitError(node: ErrorNode): T;
}

/**
 * 基础访问者抽象类，提供默认实现
 * 子类可以选择性重写需要的访问方法
 */
export abstract class BaseVisitor<T = unknown> implements Visitor<T> {
  /**
   * 主要访问方法，根据节点类型分发到具体的访问方法
   */
  visit(node: Node): T {
    switch (node.type) {
      case 'COMMENT':
        return this.visitComment(node as GeneralNode<'COMMENT'>);
      case 'SPACE':
        return this.visitSpace(node as SpaceNode);
      case 'PARENTHESIS_OPEN':
        return this.visitParenthesisOpen(node as GeneralNode<'PARENTHESIS_OPEN'>);
      case 'PARENTHESIS_CLOSE':
        return this.visitParenthesisClose(node as GeneralNode<'PARENTHESIS_CLOSE'>);
      case 'COMMA':
        return this.visitComma(node as GeneralNode<'COMMA'>);
      case 'SYMBOL':
        return this.visitSymbol(node as GeneralNode<'SYMBOL'>);
      case 'LINEBREAK':
        return this.visitLinebreak(node as LineBreakNode);
      case 'IDENTITY':
        return this.visitIdentity(node as GeneralNode<'IDENTITY'>);
      case 'STRING':
        return this.visitString(node as StringNode);
      case 'INTEGER':
        return this.visitInteger(node as IntegerNode);
      case 'FLOAT':
        return this.visitFloat(node as FloatNode);
      case 'DATE':
        return this.visitDate(node as DateNode);
      case 'DATETIME':
        return this.visitDatetime(node as DateTimeNode);
      case 'PERCENTAGE':
        return this.visitPercentage(node as PercentageNode);
      case 'ARROW':
        return this.visitArrow(node as GeneralNode<'ARROW'>);
      case 'STATEMENT':
        return this.visitStatement(node as StatementNode);
      case 'FUNCTION':
        return this.visitFunction(node as FunctionNode);
      case 'ERROR':
        return this.visitError(node as ErrorNode);
      default:
        throw new Error(`未知的节点类型: ${node.type}`);
    }
  }

  /**
   * 访问子节点的辅助方法
   */
  protected visitChildren(nodes: readonly Node[]): T[] {
    return nodes.map((node) => this.visit(node));
  }

  // Token节点的默认实现
  visitComment(node: GeneralNode<'COMMENT'>): T {
    return this.visitTerminal(node);
  }

  visitSpace(node: SpaceNode): T {
    return this.visitTerminal(node);
  }

  visitParenthesisOpen(node: GeneralNode<'PARENTHESIS_OPEN'>): T {
    return this.visitTerminal(node);
  }

  visitParenthesisClose(node: GeneralNode<'PARENTHESIS_CLOSE'>): T {
    return this.visitTerminal(node);
  }

  visitComma(node: GeneralNode<'COMMA'>): T {
    return this.visitTerminal(node);
  }

  visitSymbol(node: GeneralNode<'SYMBOL'>): T {
    return this.visitTerminal(node);
  }

  visitLinebreak(node: LineBreakNode): T {
    return this.visitTerminal(node);
  }

  visitIdentity(node: GeneralNode<'IDENTITY'>): T {
    return this.visitTerminal(node);
  }

  visitString(node: StringNode): T {
    return this.visitTerminal(node);
  }

  visitInteger(node: IntegerNode): T {
    return this.visitTerminal(node);
  }

  visitFloat(node: FloatNode): T {
    return this.visitTerminal(node);
  }

  visitDate(node: DateNode): T {
    return this.visitTerminal(node);
  }

  visitDatetime(node: DateTimeNode): T {
    return this.visitTerminal(node);
  }

  visitPercentage(node: PercentageNode): T {
    return this.visitTerminal(node);
  }

  visitArrow(node: GeneralNode<'ARROW'>): T {
    return this.visitTerminal(node);
  }

  // 语句节点的默认实现
  visitStatement(node: StatementNode): T {
    // 访问elements（结构化节点）和children，避免重复遍历原始tokens
    const elementResults = this.visitChildren(node.elements);
    const childResults = this.visitChildren(node.children);
    return this.aggregateResult(elementResults, childResults);
  }

  visitFunction(node: FunctionNode): T {
    // 访问name和parameters，避免重复遍历原始tokens
    const nameResult = this.visit(node.name);
    const paramResults = this.visitChildren(node.parameters);
    return this.aggregateResult([nameResult], paramResults);
  }

  visitError(node: ErrorNode): T {
    return this.visitTerminal(node);
  }

  /**
   * 访问终端节点的默认实现
   * 子类可以重写此方法来提供通用的终端节点处理逻辑
   */
  protected visitTerminal(_node: Node): T {
    return this.defaultResult();
  }

  /**
   * 聚合多个结果的默认实现
   * 子类可以重写此方法来定义如何合并子节点的访问结果
   */
  protected aggregateResult(..._results: T[][]): T {
    return this.defaultResult();
  }

  /**
   * 默认结果值
   * 子类必须实现此方法来定义默认返回值
   */
  protected abstract defaultResult(): T;
}
