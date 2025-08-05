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

    expect(tokens.map((t) => t.toString())).toEqual([
      'IDENTITY[otherToken]@(1:1)-(1:11)',
      'SPACE[size=1]@(1:11)-(1:12)',
      "STRING['abc\n  def\n  foo bar']@(1:12)-(3:11)",
      'SPACE[size=1]@(3:11)-(3:12)',
      'IDENTITY[token2]@(3:12)-(3:18)',
    ]);
  });

  test('should tokenize correctly string with line break', () => {
    const doc = `
  \`test
  multi-line\`
  otherToken`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'LINEBREAK[count=1]@(1:1)-(2:1)',
      'SPACE[size=2]@(2:1)-(2:3)',
      'STRING[`test\n  multi-line`]@(2:3)-(3:14)',
      'LINEBREAK[count=1]@(3:14)-(4:1)',
      'SPACE[size=2]@(4:1)-(4:3)',
      'IDENTITY[otherToken]@(4:3)-(4:13)',
    ]);
  });
});

describe('Number tokenizer', () => {
  test('should tokenize float correctly', () => {
    const doc = `12.3 123_456.789 123e4 123.456_789e+1 123.456_789e-1 0.1 .2 .2e-2 1_2`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'FLOAT[12.3]@(1:1)-(1:5)',
      'SPACE[size=1]@(1:5)-(1:6)',
      'FLOAT[123456.789]@(1:6)-(1:17)',
      'SPACE[size=1]@(1:17)-(1:18)',
      'FLOAT[1230000]@(1:18)-(1:23)',
      'SPACE[size=1]@(1:23)-(1:24)',
      'FLOAT[1234.56789]@(1:24)-(1:38)',
      'SPACE[size=1]@(1:38)-(1:39)',
      'FLOAT[12.3456789]@(1:39)-(1:53)',
      'SPACE[size=1]@(1:53)-(1:54)',
      'FLOAT[0.1]@(1:54)-(1:57)',
      'SPACE[size=1]@(1:57)-(1:58)',
      'FLOAT[0.2]@(1:58)-(1:60)',
      'SPACE[size=1]@(1:60)-(1:61)',
      'FLOAT[0.002]@(1:61)-(1:66)',
      'SPACE[size=1]@(1:66)-(1:67)',
      'INTEGER[12]@(1:67)-(1:70)',
    ]);
  });

  test('should tokenize correctly number format', () => {
    const doc = `123_456 123.456 123e4 123 123_456.789`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'INTEGER[123456]@(1:1)-(1:8)',
      'SPACE[size=1]@(1:8)-(1:9)',
      'FLOAT[123.456]@(1:9)-(1:16)',
      'SPACE[size=1]@(1:16)-(1:17)',
      'FLOAT[1230000]@(1:17)-(1:22)',
      'SPACE[size=1]@(1:22)-(1:23)',
      'INTEGER[123]@(1:23)-(1:26)',
      'SPACE[size=1]@(1:26)-(1:27)',
      'FLOAT[123456.789]@(1:27)-(1:38)',
    ]);
  });
});

describe('Date tokenizer', () => {
  test('should tokenize correctly', () => {
    const doc = `2025-06-01 2024-1-1 2024-1-1 1:1:1`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'DATE[2025-06-01]@(1:1)-(1:11)',
      'SPACE[size=1]@(1:11)-(1:12)',
      'DATE[2024-1-1]@(1:12)-(1:20)',
      'SPACE[size=1]@(1:20)-(1:21)',
      'DATETIME[2024-1-1 1:1:1]@(1:21)-(1:35)',
    ]);
  });
});

describe('Percentage tokenizer', () => {
  test('should tokenize basic percentages correctly', () => {
    const doc = `50% 100% 0%`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'PERCENTAGE[50%]@(1:1)-(1:4)',
      'SPACE[size=1]@(1:4)-(1:5)',
      'PERCENTAGE[100%]@(1:5)-(1:9)',
      'SPACE[size=1]@(1:9)-(1:10)',
      'PERCENTAGE[0%]@(1:10)-(1:12)',
    ]);
  });

  test('should tokenize decimal percentages correctly', () => {
    const doc = `12.5% 0.1% 99.99%`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'PERCENTAGE[12.5%]@(1:1)-(1:6)',
      'SPACE[size=1]@(1:6)-(1:7)',
      'PERCENTAGE[0.1%]@(1:7)-(1:11)',
      'SPACE[size=1]@(1:11)-(1:12)',
      'PERCENTAGE[99.99%]@(1:12)-(1:18)',
    ]);
  });

  test('should tokenize percentages starting with decimal point', () => {
    const doc = `.5% .25% .999%`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'PERCENTAGE[.5%]@(1:1)-(1:4)',
      'SPACE[size=1]@(1:4)-(1:5)',
      'PERCENTAGE[.25%]@(1:5)-(1:9)',
      'SPACE[size=1]@(1:9)-(1:10)',
      'PERCENTAGE[.999%]@(1:10)-(1:15)',
    ]);
  });

  test('should tokenize edge case percentages', () => {
    const doc = `% .% 123.% 100.0%`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'PERCENTAGE[%]@(1:1)-(1:2)',
      'SPACE[size=1]@(1:2)-(1:3)',
      'PERCENTAGE[.%]@(1:3)-(1:5)',
      'SPACE[size=1]@(1:5)-(1:6)',
      'PERCENTAGE[123.%]@(1:6)-(1:11)',
      'SPACE[size=1]@(1:11)-(1:12)',
      'PERCENTAGE[100.0%]@(1:12)-(1:18)',
    ]);
  });

  test('should handle percentages with underscores', () => {
    const doc = `1_000% 12_34.5_6%`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'PERCENTAGE[1_000%]@(1:1)-(1:7)',
      'SPACE[size=1]@(1:7)-(1:8)',
      'PERCENTAGE[12_34.5_6%]@(1:8)-(1:18)',
    ]);
  });

  test('should differentiate percentage from separate tokens', () => {
    const doc = `50 % test% func(25%)`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'INTEGER[50]@(1:1)-(1:3)',
      'SPACE[size=1]@(1:3)-(1:4)',
      'PERCENTAGE[%]@(1:4)-(1:5)',
      'SPACE[size=1]@(1:5)-(1:6)',
      'IDENTITY[test]@(1:6)-(1:10)',
      'PERCENTAGE[%]@(1:10)-(1:11)',
      'SPACE[size=1]@(1:11)-(1:12)',
      'IDENTITY[func]@(1:12)-(1:16)',
      'PARENTHESIS_OPEN[(]@(1:16)-(1:17)',
      'PERCENTAGE[25%]@(1:17)-(1:20)',
      'PARENTHESIS_CLOSE[)]@(1:20)-(1:21)',
    ]);
  });

  test('should handle percentages in complex expressions', () => {
    const doc = `rate: 12.5%, discount: 10%`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'IDENTITY[rate]@(1:1)-(1:5)',
      'SYMBOL[:]@(1:5)-(1:6)',
      'SPACE[size=1]@(1:6)-(1:7)',
      'PERCENTAGE[12.5%]@(1:7)-(1:12)',
      'COMMA[,]@(1:12)-(1:13)',
      'SPACE[size=1]@(1:13)-(1:14)',
      'IDENTITY[discount]@(1:14)-(1:22)',
      'SYMBOL[:]@(1:22)-(1:23)',
      'SPACE[size=1]@(1:23)-(1:24)',
      'PERCENTAGE[10%]@(1:24)-(1:27)',
    ]);
  });
});

describe('Comments', () => {
  test('should tokenize correctly', () => {
    const doc = `// test`;
    const tokens = [...tokenise(doc)];

    expect(tokens).toHaveLength(1);
    expect(tokens[0].toString()).toBe('COMMENT[// test]@(1:1)-(1:8)');
  });

  test('should parse as string if // in string', () => {
    const doc = `"abc//def"`;
    const tokens = [...tokenise(doc)];

    expect(tokens).toHaveLength(1);
    expect(tokens[0].toString()).toBe('STRING["abc//def"]@(1:1)-(1:11)');
  });

  test('should parse as comments if // following string', () => {
    const doc = `"abc"//def`;
    const tokens = [...tokenise(doc)];

    expect(tokens).toHaveLength(2);
    expect(tokens.map((t) => t.toString())).toEqual(['STRING["abc"]@(1:1)-(1:6)', 'COMMENT[//def]@(1:6)-(1:11)']);
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
    expect(tokens[0].toString()).toBe('COMMENT[// test ]@(1:1)-(1:9)');
  });

  test('should parse the leading space of comment as a part of the comment', () => {
    const doc = ` // test`;
    const tokens = [...tokenise(doc)];

    expect(tokens).toHaveLength(1);
    expect(tokens[0].toString()).toBe('COMMENT[ // test]@(1:1)-(1:9)');
  });

  test('should parse the leading space of comment as a part of the comment 2', () => {
    const doc = `name // test `;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual(['IDENTITY[name]@(1:1)-(1:5)', 'COMMENT[ // test ]@(1:5)-(1:14)']);
  });
});

describe('Error case', () => {
  test('should detect as error', () => {
    const doc = `|1 | 1`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'ERROR[|1]@(1:1)-(1:3):Unexpected token',
      'SPACE[size=1]@(1:3)-(1:4)',
      'ERROR[|]@(1:4)-(1:5):Unexpected token',
      'SPACE[size=1]@(1:5)-(1:6)',
      'INTEGER[1]@(1:6)-(1:7)',
    ]);
  });
});

describe('Space and LineBreak properties', () => {
  test('should correctly calculate space size', () => {
    const doc = '   test    more';
    const tokens = [...tokenise(doc)];

    expect(tokens[0].toString()).toBe('SPACE[size=3]@(1:1)-(1:4)');
    expect(tokens[2].toString()).toBe('SPACE[size=4]@(1:8)-(1:12)');
  });

  test('should correctly calculate linebreak count', () => {
    const doc = 'line1\nline2\n\n\nline3';
    const tokens = [...tokenise(doc)];

    expect(tokens[1].toString()).toBe('LINEBREAK[count=1]@(1:6)-(2:1)');
    expect(tokens[3].toString()).toBe('LINEBREAK[count=3]@(2:6)-(5:1)');
  });

  test('should handle mixed whitespace correctly', () => {
    const doc = '  \t  test\n\n  ';
    const tokens = [...tokenise(doc)];

    expect(tokens[0].toString()).toBe('SPACE[size=5]@(1:1)-(1:6)');
    expect(tokens[2].toString()).toBe('LINEBREAK[count=2]@(1:10)-(3:1)');
    expect(tokens[3].toString()).toBe('SPACE[size=2]@(3:1)-(3:3)');
  });
});

describe('Complex tokenizer', () => {
  test('should parse directive correctly', () => {
    const doc = `@unknown(param1, param2)`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'SYMBOL[@]@(1:1)-(1:2)',
      'IDENTITY[unknown]@(1:2)-(1:9)',
      'PARENTHESIS_OPEN[(]@(1:9)-(1:10)',
      'IDENTITY[param1]@(1:10)-(1:16)',
      'COMMA[,]@(1:16)-(1:17)',
      'SPACE[size=1]@(1:17)-(1:18)',
      'IDENTITY[param2]@(1:18)-(1:24)',
      'PARENTHESIS_CLOSE[)]@(1:24)-(1:25)',
    ]);
  });

  test('should support arrow token', () => {
    const doc = 'String a -> b';
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'IDENTITY[String]@(1:1)-(1:7)',
      'SPACE[size=1]@(1:7)-(1:8)',
      'IDENTITY[a]@(1:8)-(1:9)',
      'SPACE[size=1]@(1:9)-(1:10)',
      'ARROW[->]@(1:10)-(1:12)',
      'SPACE[size=1]@(1:12)-(1:13)',
      'IDENTITY[b]@(1:13)-(1:14)',
    ]);
  });

  test('should support property syntex for ESML', () => {
    const doc = `Dataset ds1
    String f1
      .length 20`;
    const tokens = [...tokenise(doc)];

    expect(tokens.map((t) => t.toString())).toEqual([
      'IDENTITY[Dataset]@(1:1)-(1:8)',
      'SPACE[size=1]@(1:8)-(1:9)',
      'IDENTITY[ds1]@(1:9)-(1:12)',
      'LINEBREAK[count=1]@(1:12)-(2:1)',
      'SPACE[size=4]@(2:1)-(2:5)',
      'IDENTITY[String]@(2:5)-(2:11)',
      'SPACE[size=1]@(2:11)-(2:12)',
      'IDENTITY[f1]@(2:12)-(2:14)',
      'LINEBREAK[count=1]@(2:14)-(3:1)',
      'SPACE[size=6]@(3:1)-(3:7)',
      'SYMBOL[.]@(3:7)-(3:8)',
      'IDENTITY[length]@(3:8)-(3:14)',
      'SPACE[size=1]@(3:14)-(3:15)',
      'INTEGER[20]@(3:15)-(3:17)',
    ]);
  });
});
