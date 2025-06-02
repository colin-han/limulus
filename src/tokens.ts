import { BaseNode } from './nodes';
import { Range } from './range';

export type QuotationMarker = '"' | "'" | '`' | '"""';

export class CommentNode extends BaseNode<'COMMENT'> {
  constructor(range: Range, text: string) {
    super('COMMENT', range, text);
  }
}

export class ParenthesisOpenNode extends BaseNode<'PARENTHESIS_OPEN'> {
  constructor(range: Range, text: string) {
    super('PARENTHESIS_OPEN', range, text);
  }
}

export class ParenthesisCloseNode extends BaseNode<'PARENTHESIS_CLOSE'> {
  constructor(range: Range, text: string) {
    super('PARENTHESIS_CLOSE', range, text);
  }
}

export class CommaNode extends BaseNode<'COMMA'> {
  constructor(range: Range) {
    super('COMMA', range, ',');
  }
}

export class SymbolNode extends BaseNode<'SYMBOL'> {
  constructor(range: Range, text: string) {
    super('SYMBOL', range, text);
  }
}

export class LineBreakNode extends BaseNode<'LINEBREAK'> {
  constructor(
    range: Range,
    text: string,
    public readonly count: number
  ) {
    super('LINEBREAK', range, text);
  }
}

export class SpaceNode extends BaseNode<'SPACE'> {
  constructor(
    range: Range,
    text: string,
    public readonly size: number
  ) {
    super('SPACE', range, text);
  }
}

export class IdentityNode extends BaseNode<'IDENTITY'> {
  constructor(range: Range, text: string) {
    super('IDENTITY', range, text);
  }
}

export class StringNode extends BaseNode<'STRING'> {
  constructor(
    range: Range,
    text: string,
    public readonly quot: QuotationMarker
  ) {
    super('STRING', range, text);
  }
}

export abstract class NumberNode<TType extends 'INTEGER' | 'FLOAT'> extends BaseNode<TType> {
  constructor(
    type: TType,
    range: Range,
    text: string,
    public readonly value: number
  ) {
    super(type, range, text);
  }
}

export class IntegerNode extends NumberNode<'INTEGER'> {
  constructor(range: Range, text: string, value: number) {
    super('INTEGER', range, text, value);
  }
}
export class FloatNode extends NumberNode<'FLOAT'> {
  constructor(range: Range, text: string, value: number) {
    super('FLOAT', range, text, value);
  }
}

export class DateNode extends BaseNode<'DATE'> {
  constructor(
    range: Range,
    text: string,
    public readonly value: Date
  ) {
    super('DATE', range, text);
  }
}

export class DateTimeNode extends BaseNode<'DATETIME'> {
  constructor(
    range: Range,
    text: string,
    public readonly value: Date
  ) {
    super('DATETIME', range, text);
  }
}

export class ArrowNode extends BaseNode<'ARROW'> {
  constructor(range: Range) {
    super('ARROW', range, '->');
  }
}
