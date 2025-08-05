import { tokenise } from './tokenizer';
import { statementize } from './statementizer';
import { Node } from './node';
import {
  TextCollectorVisitor,
  NodeCounterVisitor,
  MindMapBuilderVisitor,
  ErrorCollectorVisitor,
} from './examples/visitors';

describe('Visitor Pattern Tests', () => {
  describe('TextCollectorVisitor', () => {
    test('should collect all text from simple tokens', () => {
      const doc = 'hello world 123';
      const tokens = [...tokenise(doc)];
      const visitor = new TextCollectorVisitor();

      const result = tokens.map((token) => token.accept(visitor)).join('');
      expect(result).toBe('hello world 123');
    });

    test('should collect text from statements', () => {
      const doc = `main
        task1
        task2`;
      const statements = statementize(tokenise(doc));
      const visitor = new TextCollectorVisitor();

      const result = statements.map((stmt) => stmt.accept(visitor)).join('');
      expect(result).toContain('main');
      expect(result).toContain('task1');
      expect(result).toContain('task2');
    });

    test('should collect text from functions', () => {
      const doc = 'calculate(price, 8.5%)';
      const statements = statementize(tokenise(doc));
      const visitor = new TextCollectorVisitor();

      const result = statements[0].accept(visitor);
      expect(result).toContain('calculate');
      expect(result).toContain('price');
      expect(result).toContain('8.5%');
    });
  });

  describe('NodeCounterVisitor', () => {
    test('should count different node types', () => {
      const doc = 'hello world 123 45.67';
      const tokens = [...tokenise(doc)];
      const visitor = new NodeCounterVisitor();

      const totalCounts: Record<string, number> = {};
      for (const token of tokens) {
        const counts = token.accept(visitor);
        for (const [type, count] of Object.entries(counts)) {
          totalCounts[type] = (totalCounts[type] || 0) + count;
        }
      }

      expect(totalCounts['IDENTITY']).toBe(2); // hello, world
      expect(totalCounts['INTEGER']).toBe(1); // 123
      expect(totalCounts['FLOAT']).toBe(1); // 45.67
      expect(totalCounts['SPACE']).toBe(3); // 3 spaces
    });

    test('should count nodes in statements', () => {
      const doc = `main
        task1`;
      const statements = statementize(tokenise(doc));
      const visitor = new NodeCounterVisitor();

      const counts = statements[0].accept(visitor);
      expect(counts['STATEMENT']).toBe(2); // main statement + task1 statement
      expect(counts['IDENTITY']).toBe(2); // main, task1
    });

    test('should count function nodes', () => {
      const doc = 'func(a, b, 50%)';
      const statements = statementize(tokenise(doc));
      const visitor = new NodeCounterVisitor();

      const counts = statements[0].accept(visitor);
      expect(counts['FUNCTION']).toBe(1);
      expect(counts['IDENTITY']).toBe(3); // func, a, b（只计算一次）
      expect(counts['PERCENTAGE']).toBe(1); // 50% (只计算一次)
    });
  });

  describe('MindMapBuilderVisitor', () => {
    test('should build mind map from simple statement', () => {
      const doc = 'main_topic';
      const statements = statementize(tokenise(doc));
      const visitor = new MindMapBuilderVisitor();

      const mindMap = statements[0].accept(visitor);
      expect(mindMap).toHaveLength(1);
      expect(mindMap[0].title).toBe('main_topic');
      expect(mindMap[0].metadata?.type).toBe('statement');
    });

    test('should build hierarchical mind map', () => {
      const doc = `project
        frontend
        backend
          database
          api`;
      const statements = statementize(tokenise(doc));
      const visitor = new MindMapBuilderVisitor();

      const mindMap = statements[0].accept(visitor);
      expect(mindMap).toHaveLength(1);

      const root = mindMap[0];
      expect(root.title).toBe('project');
      expect(root.children).toHaveLength(2); // frontend, backend

      const backend = root.children[1];
      expect(backend.title).toBe('backend');
      expect(backend.children).toHaveLength(2); // database, api
    });

    test('should handle function calls in mind map', () => {
      const doc = 'calculate(price, 15%)';
      const statements = statementize(tokenise(doc));
      const visitor = new MindMapBuilderVisitor();

      const mindMap = statements[0].accept(visitor);
      expect(mindMap).toHaveLength(1);

      const root = mindMap[0];
      expect(root.children).toHaveLength(1); // function call

      const functionNode = root.children[0];
      expect(functionNode.title).toBe('calculate()');
      expect(functionNode.metadata?.type).toBe('function');
      expect(functionNode.children).toHaveLength(2); // price, 15%

      expect(functionNode.children[0].title).toBe('price');
      expect(functionNode.children[1].title).toBe('15%');
      expect(functionNode.children[1].metadata?.type).toBe('percentage');
    });

    test('should handle different data types with appropriate styles', () => {
      const doc = 'data("text", 123, 45.67, 25%, 2025-01-01)';
      const statements = statementize(tokenise(doc));
      const visitor = new MindMapBuilderVisitor();

      const mindMap = statements[0].accept(visitor);
      const functionNode = mindMap[0].children[0];

      expect(functionNode.children).toHaveLength(5);

      // String parameter
      const stringParam = functionNode.children[0];
      expect(stringParam.metadata?.type).toBe('string');
      expect(stringParam.metadata?.style?.color).toBe('green');

      // Number parameters
      const intParam = functionNode.children[1];
      expect(intParam.metadata?.type).toBe('number');
      expect(intParam.metadata?.style?.color).toBe('blue');

      const floatParam = functionNode.children[2];
      expect(floatParam.metadata?.type).toBe('number');
      expect(floatParam.metadata?.style?.color).toBe('blue');

      // Percentage parameter
      const percentParam = functionNode.children[3];
      expect(percentParam.metadata?.type).toBe('percentage');
      expect(percentParam.metadata?.style?.color).toBe('orange');

      // Date parameter
      const dateParam = functionNode.children[4];
      expect(dateParam.metadata?.type).toBe('date');
      expect(dateParam.metadata?.style?.color).toBe('purple');
    });
  });

  describe('ErrorCollectorVisitor', () => {
    test('should collect no errors from valid code', () => {
      const doc = 'func(a, b)';
      const statements = statementize(tokenise(doc));
      const visitor = new ErrorCollectorVisitor();

      const errors = statements[0].accept(visitor);
      expect(errors).toHaveLength(0);
    });

    test('should collect errors from invalid code', () => {
      const doc = '1(invalid) + another(error)';
      const statements = statementize(tokenise(doc));
      const visitor = new ErrorCollectorVisitor();

      const errors = statements[0].accept(visitor);
      expect(errors.length).toBeGreaterThan(0); // Should find error nodes

      for (const error of errors) {
        expect(error.type).toBe('ERROR');
        expect(error.reason).toBeTruthy();
      }
    });

    test('should collect tokenizer errors', () => {
      const doc = 'valid |invalid| more';
      const statements = statementize(tokenise(doc));
      const visitor = new ErrorCollectorVisitor();

      const errors = statements[0].accept(visitor);
      expect(errors.length).toBeGreaterThan(0);

      const errorMessages = errors.map((e) => e.reason);
      expect(errorMessages.some((msg) => msg.includes('Unexpected token'))).toBe(true);
    });
  });

  describe('Visitor accept method', () => {
    test('should properly dispatch to visitor methods', () => {
      const visitor = new NodeCounterVisitor();
      const mockVisit = jest.spyOn(visitor, 'visit');

      const doc = 'test';
      const tokens = [...tokenise(doc)];

      tokens[0].accept(visitor); // IDENTITY token

      expect(mockVisit).toHaveBeenCalledWith(tokens[0]);
    });

    test('should work with custom visitor implementations', () => {
      // Custom visitor that transforms node text to uppercase
      class UppercaseVisitor extends TextCollectorVisitor {
        protected override visitTerminal(node: Node): string {
          return node.text.toUpperCase();
        }
      }

      const doc = 'hello world';
      const tokens = [...tokenise(doc)];
      const visitor = new UppercaseVisitor();

      const result = tokens.map((token) => token.accept(visitor)).join('');
      expect(result).toBe('HELLO WORLD');
    });
  });
});
