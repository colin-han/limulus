import { ArrowNode, CommaNode, CommentNode, DateNode, DateTimeNode, ErrorNode, FloatNode, IdentityNode, IntegerNode, LineBreakNode, ParenthesisCloseNode, ParenthesisOpenNode, QuotationMarker, SpaceNode, StringNode, SymbolNode, Token } from "./tokens";
import { Range } from "./range";

const tokenRegexes = [
    { type: 'COMMENT', regex: '\\/\\/[^\\n]*' },
    { type: 'DATE', regex: '(?<d_year>\\d{4})-(?<d_month>\\d{1,2})-(?<d_day>\\d{1,2})' },
    { type: 'DATETIME', regex: '(?<year>\\d{4})-(?<month>\\d{1,2})-(?<day>\\d{1,2}) (?<hour>\\d{1,2}):(?<minute>\\d{1,2})(?::(?<second>\\d{1,2}))?' },
    { type: 'IDENTITY', regex: '\\w[\\w\\d_]*' },
    { type: 'STRING', regex: '(?<quote>[\'`"])(?:(?:\\\\.)|[^\\\\])*?\\k<quote>' },
    { type: 'INTEGER', regex: '[+-]?\\d[\\d_]*' },
    { type: 'FLOAT', regex: '[+-]?\\d[\\d_]+\\.[\\d_]*|\\.\\d[\\d_]*|[+-]?\\d[\\d_](?:[eE][+-]?[\\d_]+)?' },
    { type: 'NEWLINE', regex: '\\n+' },
    { type: 'SPACE', regex: '[ \\t]+' },
    { type: 'SYMBOL', regex: '[!@#$%^&~?.\\\\]+' },
    { type: 'PARENTHESIS_OPEN', regex: '[\\(\\[\\{]' },
    { type: 'PARENTHESIS_CLOSE', regex: '[\\)\\]\\}]' },
    { type: 'COMMA', regex: ',' },
    { type: 'ARROW', regex: '->' },
]

const regStr = tokenRegexes.map(k => `(?<${k.type}>${k.regex})`).join("|");

class TokeniseContext {
    readonly code: string;
    readonly reg: RegExp;

    row = 1;
    rowStartPos = 0;
    lastPos = 0;
    private nextToken: RegExpExecArray | null = null;

    constructor(code: string, reg: RegExp) {
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
        return new Range(
            this.row,
            this.lastPos - this.rowStartPos + 1,
            this.row,
            pos - this.rowStartPos + 1
        );
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
        return new Range(this.row, next.index - this.rowStartPos + 1, this.row, next.index + next[0].length - this.rowStartPos + 1);
    }

    getCodeOf(next: RegExpExecArray) {
        return next[0];
    }

    newLine(lineCount: number) {
        this.row += lineCount;
        this.rowStartPos += lineCount;
    }
}

export function* tokenise(code: string): Generator<Token> {
    // /(?<COMMENT>\/\/[^\n]*)|(?<DATE>(?<d_year>\d{4})-(?<d_month>\d{1,2})-(?<d_day>\d{1,2}))|(?<DATETIME>(?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2}) (?<hour>\d{1,2}):(?<minute>\d{1,2})(?::(?<second>\d{1,2}))?)|(?<IDENTITY>\w[\w\d_]*)|(?<STRING>(['`"])(?:(?:\.)|[^\\])*?\1)|(?<INTEGER>[+-]?\d[\d_]*)|(?<FLOAT>[+-]?\d[\d_]+\.[\d_]*|\.\d[\d_]*|[+-]?\d[\d_](?:[eE][+-]?[\d_]+)?)|(?<NEWLINE>\n+)|(?<SPACE>[ \t]+)|(?<SYMBOL>[!@#$%^&~?.\\]+)|(?<PARENTHESIS_OPEN>[\(\[\{])|(?<PARENTHESIS_CLOSE>[\)\]\}])|(?<COMMA>,)|(?<ARROW>->)/gm
    const reg = new RegExp(regStr, "mg");
    const context = new TokeniseContext(code, reg);

    let next: RegExpExecArray | null;
    while ((next = context.getNextToken()) != null) {
        const current = next[0];

        const currentLen = current.length;

        if (next.index != context.lastPos) {
            if (!next.groups?.SPACE && !next.groups?.NEWLINE) {
                yield new ErrorNode(
                    context.getRangeTo(next.index + currentLen),
                    context.getCodeTo(next.index + currentLen),
                    "Unexpected token"
                );
                continue;
            }

            yield new ErrorNode(
                context.getRangeTo(next.index),
                context.getCodeTo(next.index),
                "Unexpected token"
            );
        }

        if (next.groups?.SPACE) {
            yield new SpaceNode(context.getRangeOf(next), current, currentLen);
        } else if (next.groups?.STRING) {
            yield new StringNode(context.getRangeOf(next, true), current, current[0] as QuotationMarker);
        } else if (next.groups?.INTEGER) {
            yield new IntegerNode(context.getRangeOf(next), current, parseInt(current));
        } else if (next.groups?.FLOAT) {
            yield new FloatNode(context.getRangeOf(next), current, parseFloat(current));
        } else if (next.groups?.COMMENT) {
            yield new CommentNode(context.getRangeOf(next), current);
        } else if (next.groups?.NEWLINE) {
            yield new LineBreakNode(context.getRangeOf(next, true), current, currentLen);
            // context.newLine(currentLen);
        } else if (next.groups?.SYMBOL) {
            yield new SymbolNode(context.getRangeOf(next), current);
        } else if (next.groups?.PARENTHESIS_OPEN) {
            yield new ParenthesisOpenNode(context.getRangeOf(next), current);
        } else if (next.groups?.PARENTHESIS_CLOSE) {
            yield new ParenthesisCloseNode(context.getRangeOf(next), current);
        } else if (next.groups?.COMMA) {
            yield new CommaNode(context.getRangeOf(next));
        } else if (next.groups?.ARROW) {
            yield new ArrowNode(context.getRangeOf(next));
        } else if (next.groups?.DATE) {
            yield new DateNode(context.getRangeOf(next), current, new Date(current));
        } else if (next.groups?.DATETIME) {
            yield new DateTimeNode(context.getRangeOf(next), current, new Date(current));
        } else {
            yield new IdentityNode(context.getRangeOf(next), current);
        }
    }
}

