import { Node, GeneralNode } from './node';
import { Range } from './range';

export class StatementNode extends GeneralNode<'STATEMENT'> {
  constructor(
    range: Range,
    text: string,
    public readonly indent: number
  ) {
    super('STATEMENT', range, text);
  }

  children: Node[] = [];
  elements: Node[] = [];
  nodes: Node[] = [];

  toString(indent: string = ''): string {
    let result = `${indent}STATEMENT[indent=${this.indent}]@${this.range.toString()}`;

    if (this.elements.length > 0) {
      result += `\n${indent}  ELEMENTS:`;
      for (const element of this.elements) {
        result += `\n${element.toString(indent + '    ')}`;
      }
    }

    if (this.children.length > 0) {
      result += `\n${indent}  CHILDREN:`;
      for (const child of this.children) {
        result += `\n${child.toString(indent + '    ')}`;
      }
    }

    return result;
  }
}

export class GroupNode extends GeneralNode<'GROUP'> {
  constructor(range: Range, text: string) {
    super('GROUP', range, text);
  }

  elements: Node[] = [];
  nodes: Node[] = [];

  toString(indent: string = ''): string {
    let result = `${indent}GROUP@${this.range.toString()}`;

    if (this.elements.length > 0) {
      result += `\n${indent}  ELEMENTS:`;
      for (const element of this.elements) {
        result += `\n${element.toString(indent + '    ')}`;
      }
    }

    return result;
  }
}
