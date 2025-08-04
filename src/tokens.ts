import { GeneralNode } from './node';
import { Range } from './range';

export type QuotationMarker = '"' | "'" | '`' | '"""';

export class LineBreakNode extends GeneralNode<'LINEBREAK'> {
  constructor(range: Range, text: string) {
    super('LINEBREAK', range, text);
  }

  get count(): number {
    return (this.text.match(/\n/g) || []).length;
  }
}

export class SpaceNode extends GeneralNode<'SPACE'> {
  constructor(range: Range, text: string) {
    super('SPACE', range, text);
  }

  get size(): number {
    return this.text.length;
  }
}

export class StringNode extends GeneralNode<'STRING'> {
  constructor(range: Range, text: string) {
    super('STRING', range, text);
  }

  get quot(): QuotationMarker {
    return this.text[0] as QuotationMarker;
  }
}

export abstract class NumberNode<TType extends 'INTEGER' | 'FLOAT'> extends GeneralNode<TType> {
  constructor(type: TType, range: Range, text: string) {
    super(type, range, text);
  }

  get value(): number {
    return parseFloat(this.text.replace(/_/g, ''));
  }
}

export class IntegerNode extends NumberNode<'INTEGER'> {
  constructor(range: Range, text: string) {
    super('INTEGER', range, text);
  }

  override get value(): number {
    return parseInt(this.text.replace(/_/g, ''), 10);
  }
}
export class FloatNode extends NumberNode<'FLOAT'> {
  constructor(range: Range, text: string) {
    super('FLOAT', range, text);
  }
}

export class DateNode extends GeneralNode<'DATE'> {
  constructor(range: Range, text: string) {
    super('DATE', range, text);
  }

  get value(): Date {
    return new Date(this.text);
  }
}

export class DateTimeNode extends GeneralNode<'DATETIME'> {
  constructor(range: Range, text: string) {
    super('DATETIME', range, text);
  }

  get value(): Date {
    return new Date(this.text);
  }
}
