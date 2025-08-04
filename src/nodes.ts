import { Range } from './range';
import { SpaceNode, LineBreakNode, StringNode, IntegerNode, FloatNode, DateNode, DateTimeNode } from './tokens';
import { StatementNode, GroupNode } from './statements';
import { ErrorNode, GeneralNode } from './node';

const nodes = {
  COMMENT: (range: Range, text: string): GeneralNode<'COMMENT'> => new GeneralNode('COMMENT', range, text),
  SPACE: (range: Range, text: string): SpaceNode => new SpaceNode(range, text),
  PARENTHESIS_OPEN: (range: Range, text: string): GeneralNode<'PARENTHESIS_OPEN'> =>
    new GeneralNode('PARENTHESIS_OPEN', range, text),
  PARENTHESIS_CLOSE: (range: Range, text: string): GeneralNode<'PARENTHESIS_CLOSE'> =>
    new GeneralNode('PARENTHESIS_CLOSE', range, text),
  COMMA: (range: Range): GeneralNode<'COMMA'> => new GeneralNode('COMMA', range, ','),
  SYMBOL: (range: Range, text: string): GeneralNode<'SYMBOL'> => new GeneralNode('SYMBOL', range, text),
  LINEBREAK: (range: Range, text: string): LineBreakNode => new LineBreakNode(range, text),
  IDENTITY: (range: Range, text: string): GeneralNode<'IDENTITY'> => new GeneralNode('IDENTITY', range, text),
  STRING: (range: Range, text: string): StringNode => new StringNode(range, text),
  INTEGER: (range: Range, text: string): IntegerNode => new IntegerNode(range, text),
  FLOAT: (range: Range, text: string): FloatNode => new FloatNode(range, text),
  DATE: (range: Range, text: string): DateNode => new DateNode(range, text),
  DATETIME: (range: Range, text: string): DateTimeNode => new DateTimeNode(range, text),
  ARROW: (range: Range): GeneralNode<'ARROW'> => new GeneralNode('ARROW', range, '->'),
  STATEMENT: (range: Range, text: string, indent: number): StatementNode => new StatementNode(range, text, indent),
  GROUP: (range: Range, text: string): GroupNode => new GroupNode(range, text),
  ERROR: (range: Range, text: string, reason: string): ErrorNode => new ErrorNode(range, text, reason),
};

export { nodes };
