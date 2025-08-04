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
}

export class GroupNode extends GeneralNode<'GROUP'> {
  constructor(range: Range, text: string) {
    super('GROUP', range, text);
  }

  elements: Node[] = [];
  nodes: Node[] = [];
}
