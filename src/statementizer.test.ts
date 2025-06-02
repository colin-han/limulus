import { statementize } from './statementizer';
import { StatementNode } from './statements';
import { tokenise } from './tokenizer';

describe('Statementizer', () => {
  test('should detect parent-child relationship correctly', () => {
    const doc = `
name
    test
`;

    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    const statement1 = statements[0] as StatementNode;
    expect(statement1).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 2,
        startColumn: 1,
        endRow: 4,
        endColumn: 1,
      },
    });
    expect(statement1.children).toHaveLength(1);
    expect(statement1.children[0]).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 3,
        startColumn: 1,
        endRow: 4,
        endColumn: 1,
      },
    });
  });

  test('should detect sibling relationship correctly', () => {
    const doc = `
name
    test
    test2
`;

    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    const statement1 = statements[0] as StatementNode;
    expect(statement1).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 2,
        startColumn: 1,
        endRow: 5,
        endColumn: 1,
      },
    });
    expect(statement1.children).toHaveLength(2);
    expect(statement1.children[0]).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 3,
        startColumn: 1,
        endRow: 4,
        endColumn: 1,
      },
    });
    expect(statement1.children[1]).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 4,
        startColumn: 1,
        endRow: 5,
        endColumn: 1,
      },
    });
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
    expect(statements[0]).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 2,
        startColumn: 1,
        endRow: 4,
        endColumn: 1,
      },
    });
    expect(statements[1]).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 4,
        startColumn: 1,
        endRow: 6,
        endColumn: 1,
      },
    });
    expect((statements[1] as StatementNode).children).toHaveLength(1);
    expect((statements[1] as StatementNode).children[0]).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 5,
        startColumn: 1,
        endRow: 6,
        endColumn: 1,
      },
    });
  });
  test('should detech comments correctly', () => {
    const doc = `
name
    test
    // test2
`;

    const statements = statementize(tokenise(doc));
    expect(statements).toHaveLength(1);
    const statement1 = statements[0] as StatementNode;
    expect(statement1).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 2,
        startColumn: 1,
        endRow: 5,
        endColumn: 1,
      },
    });
    expect(statement1.children).toHaveLength(1);
    expect(statement1.children[0]).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 3,
        startColumn: 1,
        endRow: 5,
        endColumn: 1,
      },
    });
    expect((statement1.children[0] as StatementNode).nodes).toContainEqual({
      type: 'COMMENT',
      text: '    // test2',
      range: {
        startRow: 4,
        startColumn: 1,
        endRow: 4,
        endColumn: 13,
      },
    });
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
    const statement1 = statements[0] as StatementNode;
    expect(statement1).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 2,
        startColumn: 1,
        endRow: 4,
        endColumn: 1,
      },
    });
    expect(statement1.elements[0]).toMatchObject({
      type: 'IDENTITY',
      text: 'name',
      range: {
        startRow: 2,
        startColumn: 1,
        endRow: 2,
        endColumn: 5,
      },
    });
    expect(statement1.elements[1]).toMatchObject({
      type: 'SYMBOL',
      text: '@',
      range: {
        startRow: 2,
        startColumn: 6,
        endRow: 2,
        endColumn: 7,
      },
    });
    expect(statement1.elements[2]).toMatchObject({
      type: 'IDENTITY',
      text: 'colin',
      range: {
        startRow: 2,
        startColumn: 7,
        endRow: 2,
        endColumn: 12,
      },
    });
    expect(statement1.elements[3]).toMatchObject({ type: 'SYMBOL', text: '&' });
    expect(statement1.elements[4]).toMatchObject({ type: 'INTEGER', text: '8' });
    expect(statement1.elements[5]).toMatchObject({ type: 'IDENTITY', text: 'd' });
    expect(statement1.children).toHaveLength(1);
    expect(statement1.children[0]).toMatchObject({
      type: 'STATEMENT',
      range: {
        startRow: 3,
        startColumn: 1,
        endRow: 4,
        endColumn: 1,
      },
    });
  });
});
