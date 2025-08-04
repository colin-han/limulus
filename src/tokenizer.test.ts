import { tokenise } from './tokenizer';
import { StringNode } from './tokens';

describe('Basic tokenizer', () => {
  test('should tokenize as expected', () => {
    const doc = `
    name
      test
    `;

    const tokens = [...tokenise(doc)];
    expect(tokens).toMatchSnapshot();
  });
});

describe('String tokenizer', () => {
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
});

describe('Number tokenizer', () => {
  test('should tokenize float correctly', () => {
    const doc = `12.3 123_456.789 123e4 123.456_789e+1 123.456_789e-1 0.1 .2 .2e-2 1_2`;
    const values = [12.3, 123_456.789, 123e4, 123.456_789e+1, 123.456_789e-1, 0.1, 0.2, 0.2e-2, 1_2];

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
});

describe('Date tokenizer', () => {
  test('should tokenize correctly', () => {
    const doc = `2025-06-01 2024-1-1 2024-1-1 1:1:1`;

    const tokens = [...tokenise(doc)];
    expect(tokens[0]).toMatchObject({
      type: 'DATE',
      text: '2025-06-01',
      value: new Date('2025-06-01'),
    });
    expect(tokens[1]).toMatchObject({ type: 'SPACE' });
    expect(tokens[2]).toMatchObject({
      type: 'DATE',
      text: '2024-1-1',
      value: new Date('2024-1-1'),
    });
    expect(tokens[3]).toMatchObject({ type: 'SPACE' });
    expect(tokens[4]).toMatchObject({
      type: 'DATETIME',
      text: '2024-1-1 1:1:1',
      value: new Date('2024-1-1 1:1:1'),
    });
  });
});

describe('Comments', () => {
  test('should tokenize correctly', () => {
    const doc = `// test`;

    const tokens = [...tokenise(doc)];
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ type: 'COMMENT', text: '// test' });
  });

  test('should parse as string if // in string', () => {
    const doc = `"abc//def"`;

    const tokens = [...tokenise(doc)];
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ type: 'STRING', text: '"abc//def"', quot: '"' });
  });

  test('should parse as comments if // following string', () => {
    const doc = `"abc"//def`;

    const tokens = [...tokenise(doc)];
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toMatchObject({ type: 'STRING', text: '"abc"', quot: '"' });
    expect(tokens[1]).toMatchObject({ type: 'COMMENT', text: '//def' });
  });

  test('should ignore brackets in comments', () => {
    const doc = `.propName ( // }abc(
    value)`;

    const tokens = [...tokenise(doc)];
    expect(tokens[0]).toMatchObject({ type: 'SYMBOL', text: '.' });
    expect(tokens[1]).toMatchObject({ type: 'IDENTITY', text: 'propName' });
    expect(tokens[2]).toMatchObject({ type: 'SPACE' });
    expect(tokens[3]).toMatchObject({ type: 'PARENTHESIS_OPEN' });
    expect(tokens[4]).toMatchObject({ type: 'COMMENT', text: ' // }abc(' });
    expect(tokens[5]).toMatchObject({ type: 'LINEBREAK' });
    expect(tokens[6]).toMatchObject({ type: 'SPACE' });
    expect(tokens[7]).toMatchObject({ type: 'IDENTITY', text: 'value' });
    expect(tokens[8]).toMatchObject({ type: 'PARENTHESIS_CLOSE' });
  });

  test('should parse the trailing space of comment as a part of the comment', () => {
    const doc = `// test `;

    const tokens = [...tokenise(doc)];
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ type: 'COMMENT', text: '// test ' });
  });

  test('should parse the leading space of comment as a part of the comment', () => {
    const doc = ` // test`;

    const tokens = [...tokenise(doc)];
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ type: 'COMMENT', text: ' // test' });
  });

  test('should parse the leading space of comment as a part of the comment 2', () => {
    const doc = `name // test `;

    const tokens = [...tokenise(doc)];
    expect(tokens).toHaveLength(2);
    expect(tokens[1]).toMatchObject({ type: 'COMMENT', text: ' // test ' });
  });
});

describe('Error case', () => {
  test('should detect as error', () => {
    const doc = `|1 | 1`;

    const tokens = [...tokenise(doc)];
    expect(tokens[0]).toMatchObject({ type: 'ERROR', text: '|1', reason: 'Unexpected token' });
    expect(tokens[1]).toMatchObject({ type: 'SPACE' });
    expect(tokens[2]).toMatchObject({ type: 'ERROR', text: '|', reason: 'Unexpected token' });
    expect(tokens[3]).toMatchObject({ type: 'SPACE' });
    expect(tokens[4]).toMatchObject({ type: 'INTEGER', text: '1', value: 1 });
  });
});

describe('Space and LineBreak properties', () => {
  test('should correctly calculate space size', () => {
    const doc = '   test    more';

    const tokens = [...tokenise(doc)];
    expect(tokens[0]).toMatchObject({
      type: 'SPACE',
      text: '   ',
      size: 3,
    });
    expect(tokens[2]).toMatchObject({
      type: 'SPACE',
      text: '    ',
      size: 4,
    });
  });

  test('should correctly calculate linebreak count', () => {
    const doc = 'line1\nline2\n\n\nline3';

    const tokens = [...tokenise(doc)];
    expect(tokens[1]).toMatchObject({
      type: 'LINEBREAK',
      text: '\n',
      count: 1,
    });
    expect(tokens[3]).toMatchObject({
      type: 'LINEBREAK',
      text: '\n\n\n',
      count: 3,
    });
  });

  test('should handle mixed whitespace correctly', () => {
    const doc = '  \t  test\n\n  ';

    const tokens = [...tokenise(doc)];
    expect(tokens[0]).toMatchObject({
      type: 'SPACE',
      text: '  \t  ',
      size: 5,
    });
    expect(tokens[2]).toMatchObject({
      type: 'LINEBREAK',
      text: '\n\n',
      count: 2,
    });
    expect(tokens[3]).toMatchObject({
      type: 'SPACE',
      text: '  ',
      size: 2,
    });
  });
});

describe('Complex tokenizer', () => {
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
});
