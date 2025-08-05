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
});

describe('FunctionNode tests', () => {
  test('should parse simple function call', () => {
    const doc = `func(arg)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:10)
  ELEMENTS:
    FUNCTION[func]@(1:1)-(1:10)
      PARAMETERS:
        IDENTITY[arg]@(1:6)-(1:9)`);
  });

  test('should parse function with multiple parameters', () => {
    const doc = `func(arg1, arg2, 123)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:22)
  ELEMENTS:
    FUNCTION[func]@(1:1)-(1:22)
      PARAMETERS:
        IDENTITY[arg1]@(1:6)-(1:10)
        IDENTITY[arg2]@(1:12)-(1:16)
        INTEGER[123]@(1:18)-(1:21)`);
  });

  test('should parse function with different parameter types', () => {
    const doc = `func("string", 123, 45.67, 2023-01-01, identity)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:44)
  ELEMENTS:
    FUNCTION[func]@(1:1)-(1:44)
      PARAMETERS:
        STRING["string"]@(1:6)-(1:9)
        INTEGER[123]@(1:11)-(1:14)
        FLOAT[45.67]@(1:16)-(1:21)
        DATE[2023-01-01]@(1:23)-(1:33)
        IDENTITY[identity]@(1:35)-(1:43)`);
  });

  test('should parse nested function calls', () => {
    const doc = `outer(inner(arg), param)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:25)
  ELEMENTS:
    FUNCTION[outer]@(1:1)-(1:25)
      PARAMETERS:
        FUNCTION[inner]@(1:7)-(1:17)
          PARAMETERS:
            IDENTITY[arg]@(1:13)-(1:16)
        IDENTITY[param]@(1:19)-(1:24)`);
  });

  test('should parse function correctly and handle subsequent tokens', () => {
    const doc = `func(arg) standalone`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:21)
  ELEMENTS:
    FUNCTION[func]@(1:1)-(1:10)
      PARAMETERS:
        IDENTITY[arg]@(1:6)-(1:9)
    IDENTITY[standalone]@(1:11)-(1:21)`);
  });

  test('should handle empty function parameters', () => {
    const doc = `func()`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:7)
  ELEMENTS:
    FUNCTION[func]@(1:1)-(1:7)`);
  });

  test('should support new line in function parameters', () => {
    const doc = `func(
    arg
)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(3:2)
  ELEMENTS:
    FUNCTION[func]@(1:1)-(3:2)
      PARAMETERS:
        IDENTITY[arg]@(2:5)-(2:8)`);
  });

  test('should support more complex parsing about function parameters', () => {
    const doc = `func(arg1, 'arg2 there has fakeFunc(
    arg3)', arg3)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(2:18)
  ELEMENTS:
    FUNCTION[func]@(1:1)-(2:18)
      PARAMETERS:
        IDENTITY[arg1]@(1:6)-(1:10)
        STRING['arg2 there has fakeFunc(\n    arg3)']@(1:12)-(2:11)
        IDENTITY[arg3]@(2:13)-(2:17)`);
  });

  test('should report error if function parameters are not closed', () => {
    const doc = `func(arg1, arg2, arg3`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:22)
  ELEMENTS:
    ERROR[func(arg1, arg2, ]@(1:1)-(1:18):Missing closing parenthesis
    IDENTITY[arg3]@(1:18)-(1:22)`);
  });

  test('should report error if brackets are not following a identity', () => {
    const doc = `1(a, b, c)
    "test"(a, b, c)
    +(a, b, c)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(3:14)
  ELEMENTS:
    INTEGER[1]@(1:1)-(1:2)
    ERROR[(]@(1:2)-(1:3):Unexpected token
    IDENTITY[a]@(1:3)-(1:4)
    IDENTITY[b]@(1:6)-(1:7)
    IDENTITY[c]@(1:9)-(1:10)
  CHILDREN:
    STATEMENT[indent=4]@(2:1)-(3:1)
      ELEMENTS:
        STRING["test"]@(2:5)-(2:7)
        ERROR[(]@(2:7)-(2:8):Unexpected token
        IDENTITY[a]@(2:8)-(2:9)
        IDENTITY[b]@(2:11)-(2:12)
        IDENTITY[c]@(2:14)-(2:15)
    STATEMENT[indent=4]@(3:1)-(3:14)
      ELEMENTS:
        SYMBOL[+]@(3:5)-(3:6)
        ERROR[(]@(3:6)-(3:7):Unexpected token
        IDENTITY[a]@(3:7)-(3:8)
        IDENTITY[b]@(3:10)-(3:11)
        IDENTITY[c]@(3:13)-(3:14)`);
  });

  test('should parse functions with percentage parameters', () => {
    const doc = `calculateTax(price, 8.5%)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:26)
  ELEMENTS:
    FUNCTION[calculateTax]@(1:1)-(1:26)
      PARAMETERS:
        IDENTITY[price]@(1:14)-(1:19)
        PERCENTAGE[8.5%]@(1:21)-(1:25)`);
  });

  test('should parse complex expressions with percentages', () => {
    const doc = `applyDiscount(100, 15%) + calculateTip(.5%)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:44)
  ELEMENTS:
    FUNCTION[applyDiscount]@(1:1)-(1:24)
      PARAMETERS:
        INTEGER[100]@(1:15)-(1:18)
        PERCENTAGE[15%]@(1:20)-(1:23)
    SYMBOL[+]@(1:25)-(1:26)
    FUNCTION[calculateTip]@(1:27)-(1:44)
      PARAMETERS:
        PERCENTAGE[.5%]@(1:40)-(1:43)`);
  });

  test('should handle nested functions with percentages', () => {
    const doc = `outer(inner(50%), 25%)`;
    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    expect(statements.map((s) => s.toString()).join('\n')).toBe(`STATEMENT[indent=0]@(1:1)-(1:23)
  ELEMENTS:
    FUNCTION[outer]@(1:1)-(1:23)
      PARAMETERS:
        FUNCTION[inner]@(1:7)-(1:17)
          PARAMETERS:
            PERCENTAGE[50%]@(1:13)-(1:16)
        PERCENTAGE[25%]@(1:19)-(1:22)`);
  });
});
