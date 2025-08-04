import { GeneralNode } from './node';
import { Range } from './range';

export type QuotationMarker = '"' | "'" | '`' | '"""';

export class LineBreakNode extends GeneralNode<'LINEBREAK'> {
  constructor(
    range: Range,
    text: string,
    public readonly count: number
  ) {
    super('LINEBREAK', range, text);
  }
}

export class SpaceNode extends GeneralNode<'SPACE'> {
  constructor(
    range: Range,
    text: string,
    public readonly size: number
  ) {
    super('SPACE', range, text);
  }
}

export class StringNode extends GeneralNode<'STRING'> {
  constructor(
    range: Range,
    text: string,
    public readonly quot: QuotationMarker
  ) {
    super('STRING', range, text);
  }
}

export abstract class NumberNode<TType extends 'INTEGER' | 'FLOAT'> extends GeneralNode<TType> {
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

export class DateNode extends GeneralNode<'DATE'> {
  constructor(
    range: Range,
    text: string,
    public readonly value: Date
  ) {
    super('DATE', range, text);
  }
}

export class DateTimeNode extends GeneralNode<'DATETIME'> {
  constructor(
    range: Range,
    text: string,
    public readonly value: Date
  ) {
    super('DATETIME', range, text);
  }
}
