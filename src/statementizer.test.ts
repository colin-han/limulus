import { statementize } from './statementizer';
import { tokenise } from './tokenizer';

describe('Statementizer', () => {
  test('should detect parent-child relationship correctly', () => {
    const doc = `
name
    test
`;

    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(2:1)-(4:1)
  ELEMENTS:
    IDENTITY[name]@(2:1)-(2:5)
  CHILDREN:
    STATEMENT[indent=4]@(3:1)-(4:1)
      ELEMENTS:
        IDENTITY[test]@(3:5)-(3:9)`);
  });

  test('should detect sibling relationship correctly', () => {
    const doc = `
name
    test
    test2
`;

    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(2:1)-(5:1)
  ELEMENTS:
    IDENTITY[name]@(2:1)-(2:5)
  CHILDREN:
    STATEMENT[indent=4]@(3:1)-(4:1)
      ELEMENTS:
        IDENTITY[test]@(3:5)-(3:9)
    STATEMENT[indent=4]@(4:1)-(5:1)
      ELEMENTS:
        IDENTITY[test2]@(4:5)-(4:10)`);
  });
  test('should multiple root element correctly', () => {
    const doc = `
name
    test
name2
    test2
`;

    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(2);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(2:1)-(4:1)
  ELEMENTS:
    IDENTITY[name]@(2:1)-(2:5)
  CHILDREN:
    STATEMENT[indent=4]@(3:1)-(4:1)
      ELEMENTS:
        IDENTITY[test]@(3:5)-(3:9)
STATEMENT[indent=0]@(4:1)-(6:1)
  ELEMENTS:
    IDENTITY[name2]@(4:1)-(4:6)
  CHILDREN:
    STATEMENT[indent=4]@(5:1)-(6:1)
      ELEMENTS:
        IDENTITY[test2]@(5:5)-(5:10)`);
  });
  test('should detech comments correctly', () => {
    const doc = `
name
    test
    // test2
`;

    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(2:1)-(5:1)
  ELEMENTS:
    IDENTITY[name]@(2:1)-(2:5)
  CHILDREN:
    STATEMENT[indent=4]@(3:1)-(5:1)
      ELEMENTS:
        IDENTITY[test]@(3:5)-(3:9)`);
  });
});

describe('complex test cases', () => {
  test('should parse mind-mark correctly', () => {
    const doc = `
name @colin &8d
    test
`;

    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(2:1)-(4:1)
  ELEMENTS:
    IDENTITY[name]@(2:1)-(2:5)
    SYMBOL[@]@(2:6)-(2:7)
    IDENTITY[colin]@(2:7)-(2:12)
    SYMBOL[&]@(2:13)-(2:14)
    INTEGER[8]@(2:14)-(2:15)
    IDENTITY[d]@(2:15)-(2:16)
  CHILDREN:
    STATEMENT[indent=4]@(3:1)-(4:1)
      ELEMENTS:
        IDENTITY[test]@(3:5)-(3:9)`);
  });

  test('test group', () => {
    const doc = `name (test)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:11)
  ELEMENTS:
    IDENTITY[name]@(1:1)-(1:5)
    GROUP@(1:7)-(1:11)
      ELEMENTS:
        IDENTITY[test]@(1:7)-(1:11)`);
  });
});
