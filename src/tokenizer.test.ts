import { tokenise } from './tokenizer';
import { StringNode } from './tokens';

test('should tokenize as expected', () => {
    const doc = `
    name
      test
    `;

    const tokens = [...tokenise(doc)];
    expect(tokens).toMatchSnapshot();
});

test('should correctly to tokenize the string', () => {
    const doc = `"abc
  def"`;

    const tokens = [...tokenise(doc)];
    const token = tokens[0] as StringNode;
    expect(token.type).toBe('STRING');
    expect(token.quot).toBe('"');
    expect(token.range).toMatchObject({
        startRow: 1,
        endRow: 2,
        startColumn: 1,
        endColumn: 7,
    });
});

test('should tokenise correctly string with other token', () => {
    const doc = `otherToken 'abc
  def
  foo bar' token2`;

    const tokens = [...tokenise(doc)];
    expect(tokens[0]).toMatchObject({
        type: 'IDENTITY',
        text: 'otherToken',
    });
    expect(tokens[1]).toMatchObject({ type: 'SPACE' });
    expect(tokens[2]).toMatchObject({
        type: 'STRING',
        quot: "'",
        range: {
            startRow: 1,
            startColumn: 12,
            endRow: 3,
            endColumn: 11,
        },
    });
    expect(tokens[3]).toMatchObject({ type: 'SPACE' });
    expect(tokens[4]).toMatchObject({ type: 'IDENTITY' });
});

test('should tokenize correctly string with line break', () => {
    const doc = `
  \`test
  multi-line\`
  otherToken`;

    const tokens = [...tokenise(doc)];
    expect(tokens[0]).toMatchObject({ type: 'LINEBREAK' });
    expect(tokens[1]).toMatchObject({ type: 'SPACE' });
    expect(tokens[2]).toMatchObject({
        type: 'STRING',
        quot: '`',
        range: { startRow: 2, startColumn: 3, endRow: 3, endColumn: 14 },
    });
    expect(tokens[3]).toMatchObject({ type: 'LINEBREAK' });
    expect(tokens[4]).toMatchObject({ type: 'SPACE' });
});

test('should tokenize float correctly', () => {
    const doc = `12.3 123_456.789 123e4 123.456_789e+1 123.456_789e-1 0.1 .2 .2e-2 1_2`;
    const values = [
        12.3, 123_456.789, 123e4, 123.456_789e+1, 123.456_789e-1, 0.1, 0.2,
        0.2e-2, 1_2,
    ];

    const tokens = [...tokenise(doc)];
    expect(tokens[0]).toMatchObject({
        type: 'FLOAT',
        text: '12.3',
        value: values[0],
    });
    expect(tokens[1]).toMatchObject({ type: 'SPACE' });
    expect(tokens[2]).toMatchObject({
        type: 'FLOAT',
        text: '123_456.789',
        value: values[1],
    });
    expect(tokens[3]).toMatchObject({ type: 'SPACE' });
    expect(tokens[4]).toMatchObject({
        type: 'FLOAT',
        text: '123e4',
        value: values[2],
    });
    expect(tokens[5]).toMatchObject({ type: 'SPACE' });
    expect(tokens[6]).toMatchObject({
        type: 'FLOAT',
        text: '123.456_789e+1',
        value: values[3],
    });
    expect(tokens[7]).toMatchObject({ type: 'SPACE' });
    expect(tokens[8]).toMatchObject({
        type: 'FLOAT',
        text: '123.456_789e-1',
        value: values[4],
    });
    expect(tokens[9]).toMatchObject({ type: 'SPACE' });
    expect(tokens[10]).toMatchObject({
        type: 'FLOAT',
        text: '0.1',
        value: values[5],
    });
    expect(tokens[11]).toMatchObject({ type: 'SPACE' });
    expect(tokens[12]).toMatchObject({
        type: 'FLOAT',
        text: '.2',
        value: values[6],
    });
    expect(tokens[13]).toMatchObject({ type: 'SPACE' });
    expect(tokens[14]).toMatchObject({
        type: 'FLOAT',
        text: '.2e-2',
        value: values[7],
    });
    expect(tokens[15]).toMatchObject({ type: 'SPACE' });
    expect(tokens[16]).toMatchObject({
        type: 'INTEGER',
        text: '1_2',
        value: values[8],
    });
});

test('should tokenize correctly number format', () => {
    const doc = `123_456 123.456 123e4 123 123_456.789`;

    const tokens = [...tokenise(doc)];
    expect(tokens[0]).toMatchObject({
        type: 'INTEGER',
        text: '123_456',
        value: 123456,
    });
    expect(tokens[1]).toMatchObject({ type: 'SPACE' });
    expect(tokens[2]).toMatchObject({
        type: 'FLOAT',
        text: '123.456',
        value: 123.456,
    });
    expect(tokens[3]).toMatchObject({ type: 'SPACE' });
    expect(tokens[4]).toMatchObject({
        type: 'FLOAT',
        text: '123e4',
        value: 123e4,
    });
    expect(tokens[5]).toMatchObject({ type: 'SPACE' });
    expect(tokens[6]).toMatchObject({
        type: 'INTEGER',
        text: '123',
        value: 123,
    });
    expect(tokens[7]).toMatchObject({ type: 'SPACE' });
    expect(tokens[8]).toMatchObject({
        type: 'FLOAT',
        text: '123_456.789',
        value: 123456.789,
    });
});

test('should parse directive correctly', () => {
    const doc = `@unknown(param1, param2)`;

    const tokens = [...tokenise(doc)];
    expect(tokens).toHaveLength(8);
    expect(tokens[0]).toMatchObject({ type: 'SYMBOL', text: '@' });
    expect(tokens[1]).toMatchObject({ type: 'IDENTITY', text: 'unknown' });
    expect(tokens[2]).toMatchObject({ type: 'PARENTHESIS_OPEN', text: '(' });
    expect(tokens[3]).toMatchObject({ type: 'IDENTITY', text: 'param1' });
    expect(tokens[4]).toMatchObject({ type: 'COMMA', text: ',' });
    expect(tokens[5]).toMatchObject({ type: 'SPACE', text: ' ' });
    expect(tokens[6]).toMatchObject({ type: 'IDENTITY', text: 'param2' });
    expect(tokens[7]).toMatchObject({ type: 'PARENTHESIS_CLOSE', text: ')' });
});

test('should support arrow token', () => {
    const doc = 'String a -> b';

    const tokens = [...tokenise(doc)];
    expect(tokens[0]).toMatchObject({ type: 'IDENTITY', text: 'String' });
    expect(tokens[1]).toMatchObject({ type: 'SPACE' });
    expect(tokens[2]).toMatchObject({ type: 'IDENTITY', text: 'a' });
    expect(tokens[3]).toMatchObject({ type: 'SPACE' });
    expect(tokens[4]).toMatchObject({ type: 'ARROW' });
    expect(tokens[5]).toMatchObject({ type: 'SPACE' });
    expect(tokens[6]).toMatchObject({ type: 'IDENTITY', text: 'b' });
});

test('should support property syntex for ESML', () => {
    const doc = `Dataset ds1
    String f1
      .length 20`;

    const tokens = [...tokenise(doc)];
    expect(tokens).toHaveLength(14);
    expect(tokens[0]).toMatchObject({ type: 'IDENTITY', text: 'Dataset' });
    expect(tokens[1]).toMatchObject({ type: 'SPACE' });
    expect(tokens[2]).toMatchObject({ type: 'IDENTITY', text: 'ds1' });
    expect(tokens[3]).toMatchObject({ type: 'LINEBREAK' });
    expect(tokens[4]).toMatchObject({ type: 'SPACE' });
    expect(tokens[5]).toMatchObject({ type: 'IDENTITY', text: 'String' });
    expect(tokens[6]).toMatchObject({ type: 'SPACE' });
    expect(tokens[7]).toMatchObject({ type: 'IDENTITY', text: 'f1' });
    expect(tokens[8]).toMatchObject({ type: 'LINEBREAK' });
    expect(tokens[9]).toMatchObject({ type: 'SPACE' });
    expect(tokens[10]).toMatchObject({ type: 'SYMBOL', text: '.' });
    expect(tokens[11]).toMatchObject({ type: 'IDENTITY', text: 'length' });
    expect(tokens[12]).toMatchObject({ type: 'SPACE' });
    expect(tokens[13]).toMatchObject({ type: 'INTEGER', text: '20' });
});
