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

  toString(indent?: string): string;
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
