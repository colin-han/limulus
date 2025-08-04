import { Range } from './range';

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
  | 'ARROW'
  // Statements
  | 'STATEMENT'
  | 'GROUP'
  // Error
  | 'ERROR';

export interface Node<TType extends NodeType = NodeType> {
  readonly type: TType;
  range: Range;
  text: string;

  toString(): string;
}

export abstract class BaseNode<TType extends NodeType = NodeType> implements Node<TType> {
  constructor(
    public readonly type: TType,
    public range: Range,
    public text: string
  ) {}

  toString() {
    return `${this.type}(${this.range.toString()}) ${this.text}`;
  }
}

export class ErrorNode extends BaseNode<'ERROR'> {
  constructor(
    range: Range,
    text: string,
    public readonly reason: string
  ) {
    super('ERROR', range, text);
  }
}
