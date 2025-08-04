import { Range } from './range';
import {
  SpaceNode,
  LineBreakNode,
  StringNode,
  IntegerNode,
  FloatNode,
  DateNode,
  DateTimeNode,
  QuotationMarker,
} from './tokens';
import { StatementNode, GroupNode } from './statements';
import { ErrorNode, GeneralNode } from './node';

const nodes = {
  COMMENT: (range: Range, text: string) => new GeneralNode('COMMENT', range, text),
  SPACE: (range: Range, text: string, count: number) => new SpaceNode(range, text, count),
  PARENTHESIS_OPEN: (range: Range, text: string) => new GeneralNode('PARENTHESIS_OPEN', range, text),
  PARENTHESIS_CLOSE: (range: Range, text: string) => new GeneralNode('PARENTHESIS_CLOSE', range, text),
  COMMA: (range: Range) => new GeneralNode('COMMA', range, ','),
  SYMBOL: (range: Range, text: string) => new GeneralNode('SYMBOL', range, text),
  LINEBREAK: (range: Range, text: string, count: number) => new LineBreakNode(range, text, count),
  IDENTITY: (range: Range, text: string) => new GeneralNode('IDENTITY', range, text),
  STRING: (range: Range, text: string, marker: QuotationMarker) => new StringNode(range, text, marker),
  INTEGER: (range: Range, text: string, value: number) => new IntegerNode(range, text, value),
  FLOAT: (range: Range, text: string, value: number) => new FloatNode(range, text, value),
  DATE: (range: Range, text: string, value: Date) => new DateNode(range, text, value),
  DATETIME: (range: Range, text: string, value: Date) => new DateTimeNode(range, text, value),
  ARROW: (range: Range) => new GeneralNode('ARROW', range, '->'),
  STATEMENT: (range: Range, text: string, indent: number) => new StatementNode(range, text, indent),
  GROUP: (range: Range, text: string) => new GroupNode(range, text),
  ERROR: (range: Range, text: string, reason: string) => new ErrorNode(range, text, reason),
};

export { nodes };
