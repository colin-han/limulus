import { Node, BaseNode } from './nodes';
import { Range } from './range';

export class StatementNode extends BaseNode<'STATEMENT'> {
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

export class GroupNode extends BaseNode<'GROUP'> {
  constructor(range: Range, text: string) {
    super('GROUP', range, text);
  }

  elements: Node[] = [];
  nodes: Node[] = [];
}
