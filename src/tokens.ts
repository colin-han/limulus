import { Range } from "./range";

export type TokenType =
    | 'COMMENT'
    | 'SPACE'
    | 'PARENTHESIS_OPEN'
    | 'PARENTHESIS_CLOSE'
    | 'COMMA'
    | 'SYMBOL'
    | 'LINEBREAK'
    | 'IDENTITY'
    | 'STRING'
    | 'INTEGER'
    | 'FLOAT'
    | 'DATE'
    | 'DATETIME'
    | 'ARROW'
    | 'ERROR';

export type QuotationMarker = '"' | "'" | "`" | '"""';

export interface Token<TType extends TokenType = TokenType> {
    readonly type: TType;
    readonly range: Range;
    readonly text: string;
}

export abstract class BaseToken<TType extends TokenType = TokenType> implements Token<TType> {
    constructor(
        public readonly type: TType,
        public readonly range: Range,
        public readonly text: string
    ) { }
}

export class ErrorNode extends BaseToken<"ERROR"> {
    constructor(range: Range, text: string, public readonly reason: string) {
        super("ERROR", range, text);
    }
}

export class CommentNode extends BaseToken<"COMMENT"> {
    constructor(range: Range, text: string) {
        super("COMMENT", range, text);
    }
}

export class ParenthesisOpenNode extends BaseToken<"PARENTHESIS_OPEN"> {
    constructor(range: Range, text: string) {
        super("PARENTHESIS_OPEN", range, text);
    }
}

export class ParenthesisCloseNode extends BaseToken<"PARENTHESIS_CLOSE"> {
    constructor(range: Range, text: string) {
        super("PARENTHESIS_CLOSE", range, text);
    }
}

export class CommaNode extends BaseToken<"COMMA"> {
    constructor(range: Range) {
        super("COMMA", range, ",");
    }
}

export class SymbolNode extends BaseToken<"SYMBOL"> {
    constructor(range: Range, text: string) {
        super("SYMBOL", range, text);
    }
}

export class LineBreakNode extends BaseToken<"LINEBREAK"> {
    constructor(range: Range, text: string, public readonly count: number) {
        super("LINEBREAK", range, text);
    }
}

export class SpaceNode extends BaseToken<"SPACE"> {
    constructor(range: Range, text: string, public readonly size: number) {
        super("SPACE", range, text);
    }
}

export class IdentityNode extends BaseToken<"IDENTITY"> {
    constructor(
        range: Range,
        text: string
    ) {
        super("IDENTITY", range, text);
    }
}

export class StringNode extends BaseToken<"STRING"> {
    constructor(
        range: Range,
        text: string,
        public readonly quot: QuotationMarker,
    ) {
        super("STRING", range, text);
    }
}

export abstract class NumberNode<TType extends "INTEGER" | "FLOAT"> extends BaseToken<TType> {
    constructor(
        type: TType,
        range: Range,
        text: string,
        public readonly value: number
    ) {
        super(type, range, text);
    }
}

export class IntegerNode extends NumberNode<"INTEGER"> {
    constructor(range: Range, text: string, value: number) {
        super("INTEGER", range, text, value);
    }
}
export class FloatNode extends NumberNode<"FLOAT"> {
    constructor(range: Range, text: string, value: number) {
        super("FLOAT", range, text, value);
    }
}

export class DateNode extends BaseToken<'DATE'> {
    constructor(range: Range, text: string, public readonly value: Date) {
        super("DATE", range, text);
    }
}

export class DateTimeNode extends BaseToken<'DATETIME'> {
    constructor(range: Range, text: string, public readonly value: Date) {
        super("DATETIME", range, text);
    }
}

export class ArrowNode extends BaseToken<'ARROW'> {
    constructor(range: Range) {
        super("ARROW", range, "->");
    }
}