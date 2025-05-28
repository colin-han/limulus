
export class Range {
    constructor(
        public readonly startRow: number,
        public readonly startColumn: number,
        public readonly endRow: number,
        public readonly endColumn: number
    ) { }
    get start() {
        return new Position(this.startRow, this.startColumn);
    }
    get end() {
        return new Position(this.endRow, this.endColumn);
    }
    toString() {
        return `(${this.start.toString()})-(${this.end.toString()})`;
    }
}
export class Position {
    constructor(
        public readonly row: number,
        public readonly column: number
    ) { }

    toString() {
        return `(${this.row}:${this.column})`;
    }
}

