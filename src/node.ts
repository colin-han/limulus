import { Range } from './range';

// 前向声明Visitor接口以避免循环依赖
export interface Visitor<T = unknown> {
  visit(node: Node): T;
}

export type NodeType =
  // Tokens
  | 'COMMENT'
  | 'SPACE'
  | 'PARENTHESIS_OPEN'
  | 'PARENTHESIS_CLOSE'
  | 'COMMA'
  | 'SYMBOL'
  | 'LINEBREAK'
  | 'IDENTITY'
  | 'STRING'
  | 'INTEGER'
  | 'FLOAT'
  | 'DATE'
  | 'DATETIME'
  | 'PERCENTAGE'
  | 'ARROW'
  // Statements
  | 'STATEMENT'
  | 'FUNCTION'
  // Error
  | 'ERROR';

export interface Node<TType extends NodeType = NodeType> {
  readonly type: TType;
  range: Range;
  text: string;

  toString(indent?: string): string;
  accept<T>(visitor: Visitor<T>): T;
}

export class GeneralNode<TType extends NodeType = NodeType> implements Node<TType> {
  constructor(
    public readonly type: TType,
    public range: Range,
    public text: string
  ) {}

  toString(indent: string = '') {
    return `${indent}${this.type}[${this.text}]@${this.range.toString()}`;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visit(this);
  }
}

export class ErrorNode extends GeneralNode<'ERROR'> {
  constructor(
    range: Range,
    text: string,
    public readonly reason: string
  ) {
    super('ERROR', range, text);
  }

  override toString(indent: string = ''): string {
    return `${indent}ERROR[${this.text}]@${this.range.toString()}:${this.reason}`;
  }
}
