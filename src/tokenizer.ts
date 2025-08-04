import {
  ArrowNode,
  CommaNode,
  CommentNode,
  DateNode,
  DateTimeNode,
  FloatNode,
  IdentityNode,
  IntegerNode,
  LineBreakNode,
  ParenthesisCloseNode,
  ParenthesisOpenNode,
  QuotationMarker,
  SpaceNode,
  StringNode,
  SymbolNode,
} from './tokens';
import { ErrorNode } from './node';
import { Node } from './node';
import { Range } from './range';

const tokenRegexes = [
  { type: 'COMMENT', regex: '[ \t]*\\/\\/[^\\n]*' },
  // DATETIME must be placed before DATE and SPACE
  {
    type: 'DATETIME',
    regex:
      '(?<y>\\d{4})-(?<mon>\\d{1,2})-(?<d>\\d{1,2}) (?<h>\\d{1,2}):(?<m>\\d{1,2})(?::(?<s>\\d{1,2})(?:\\.(?<ms>\\d{1,3}))?)?',
  },
  {
    type: 'DATE',
    regex: '(?<d_y>\\d{4})-(?<d_m>\\d{1,2})-(?<d_d>\\d{1,2})',
  },
  { type: 'IDENTITY', regex: '[A-Za-z_][\\w]*' },
  {
    type: 'STRING',
    regex: '(?<quote>[\'`"])(?:(?:\\\\.)|[^\\\\])*?\\k<quote>',
  },
  {
    type: 'FLOAT',
    regex: '[+-]?(?:\\d[\\d_]*\\.\\d[\\d_]*|\\d[\\d_]*\\.|\\.\\d[\\d_]*|\\d[\\d_]*)(?:[eE][+-]?\\d[\\d_]*)?',
  },
  { type: 'NEWLINE', regex: '\\n+' },
  { type: 'SPACE', regex: '[ \\t]+' },
  { type: 'SYMBOL', regex: '[!@#$%^&~?.\\\\]+' },
  { type: 'PARENTHESIS_OPEN', regex: '[\\(\\[\\{]' },
  { type: 'PARENTHESIS_CLOSE', regex: '[\\)\\]\\}]' },
  { type: 'COMMA', regex: ',' },
  { type: 'ARROW', regex: '->' },
];

const regStr = tokenRegexes.map((k) => `(?<${k.type}>${k.regex})`).join('|');

class TokeniseContext {
  readonly code: string;
  readonly reg: RegExp;

  row = 1;
  rowStartPos = 0;
  lastPos = 0;
  private nextToken: RegExpExecArray | null = null;

  constructor(code: string, reg: RegExp) {
    // 这样可以简化后续的换行处理。但是我不能在这里对制表符进行同样的处理，否则
    // 会破坏range中的column和实际内容的位置的对应关系。
    this.code = code.replace(/\r\n/g, '\n');
    this.reg = reg;
  }

  getNextToken(): RegExpExecArray | null {
    if (this.nextToken !== null) {
      this.lastPos = this.nextToken.index + this.nextToken[0].length;
    }
    this.nextToken = this.reg.exec(this.code);
    return this.nextToken;
  }

  getRangeTo(pos: number): Range {
    return new Range(this.row, this.lastPos - this.rowStartPos + 1, this.row, pos - this.rowStartPos + 1);
  }

  getCodeTo(pos: number): string {
    return this.code.slice(this.lastPos, pos);
  }

  getRangeOf(next: RegExpExecArray, multiline: boolean = false) {
    if (multiline) {
      const current = next[0];
      const currentLen = current.length;
      const lines = current.split(/\n/g);
      const startRow = this.row;
      const startColumn = this.lastPos - this.rowStartPos + 1;
      let endRow = this.row;
      let endColumn = startColumn + currentLen;
      if (lines) {
        endRow += lines.length - 1;
        const endLen = lines[lines.length - 1].length;
        endColumn = endLen + 1;
        this.row = endRow;
        this.rowStartPos = next.index + currentLen - endLen;
      }
      return new Range(startRow, startColumn, endRow, endColumn);
    }
    return new Range(
      this.row,
      next.index - this.rowStartPos + 1,
      this.row,
      next.index + next[0].length - this.rowStartPos + 1
    );
  }

  getCodeOf(next: RegExpExecArray) {
    return next[0];
  }
}

export function* tokenise(code: string): Generator<Node> {
  const reg = new RegExp(regStr, 'mg');
  const context = new TokeniseContext(code, reg);

  let next: RegExpExecArray | null;
  while ((next = context.getNextToken()) != null) {
    const current = context.getCodeOf(next);
    const currentLen = current.length;

    if (next.index != context.lastPos) {
      if (!next.groups!.SPACE && !next.groups!.NEWLINE) {
        yield new ErrorNode(
          context.getRangeTo(next.index + currentLen),
          context.getCodeTo(next.index + currentLen),
          'Unexpected token'
        );
        continue;
      }

      yield new ErrorNode(context.getRangeTo(next.index), context.getCodeTo(next.index), 'Unexpected token');
    }

    if (next.groups!.SPACE) {
      yield new SpaceNode(context.getRangeOf(next), current, currentLen);
    } else if (next.groups!.STRING) {
      yield new StringNode(context.getRangeOf(next, true), current, current[0] as QuotationMarker);
    } else if (next.groups!.FLOAT) {
      if (current.includes('.') || current.includes('e')) {
        yield new FloatNode(context.getRangeOf(next), current, parseFloat(current.replace(/_/g, '')));
      } else {
        yield new IntegerNode(context.getRangeOf(next), current, parseInt(current.replace(/_/g, '')));
      }
    } else if (next.groups!.COMMENT) {
      yield new CommentNode(context.getRangeOf(next), current);
    } else if (next.groups!.NEWLINE) {
      yield new LineBreakNode(context.getRangeOf(next, true), current, currentLen);
    } else if (next.groups!.SYMBOL) {
      yield new SymbolNode(context.getRangeOf(next), current);
    } else if (next.groups!.PARENTHESIS_OPEN) {
      yield new ParenthesisOpenNode(context.getRangeOf(next), current);
    } else if (next.groups!.PARENTHESIS_CLOSE) {
      yield new ParenthesisCloseNode(context.getRangeOf(next), current);
    } else if (next.groups!.COMMA) {
      yield new CommaNode(context.getRangeOf(next));
    } else if (next.groups!.ARROW) {
      yield new ArrowNode(context.getRangeOf(next));
    } else if (next.groups!.DATE) {
      yield new DateNode(context.getRangeOf(next), current, new Date(current));
    } else if (next.groups!.DATETIME) {
      yield new DateTimeNode(context.getRangeOf(next), current, new Date(current));
    } else {
      yield new IdentityNode(context.getRangeOf(next), current);
    }
  }
}
