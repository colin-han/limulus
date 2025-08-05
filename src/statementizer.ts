import { Node } from './node';
import { Range } from './range';
import { StatementNode, FunctionNode } from './statements';
import { nodes } from './nodes';

type State = 'NEWLINE' | 'STATEMENT' | 'FUNCTION';

interface ComplexElement {
  range: Range;
  text: string;
  nodes: Node[];
}

class StatementizerContext {
  readonly rootStatement = nodes.STATEMENT(new Range(1, 1, 1, 1), '', -1);
  readonly statementStack: StatementNode[] = [this.rootStatement as StatementNode];
  readonly functionStack: FunctionNode[] = [];

  currentStatement: StatementNode = this.rootStatement as StatementNode;
  currentFunction: FunctionNode | null = null;
  state: State = 'NEWLINE';

  addTokenToStatements(token: Node) {
    this.statementStack.forEach((statement) => {
      statement.nodes.push(token);
    });
  }

  addElementToCurrentStatement(element: Node) {
    this.currentStatement.elements.push(element);
    this.addTokenToStatements(element);
  }

  completeCurrentStatement() {
    this.completeComplexElement(this.currentStatement);
    this.statementStack.pop();
    this.currentStatement = this.statementStack[this.statementStack.length - 1];
  }

  private completeComplexElement(element: ComplexElement) {
    if (element.nodes.length > 0) {
      element.range = new Range(
        element.nodes[0].range.startRow,
        element.nodes[0].range.startColumn,
        element.nodes[element.nodes.length - 1].range.endRow,
        element.nodes[element.nodes.length - 1].range.endColumn
      );
      element.text = element.nodes.map((node) => node.text).join('');
    }
  }

  completeAllStatements() {
    this.validateAndCompleteFunctions();
    while (this.currentStatement.indent >= 0) {
      this.completeCurrentStatement();
    }
  }

  private validateAndCompleteFunctions() {
    while (this.functionStack.length > 0) {
      this.currentFunction = this.functionStack[this.functionStack.length - 1];

      // Complete the function range with all its content
      this.completeComplexElement(this.currentFunction);

      // Convert the incomplete function to an error node
      const errorNode = nodes.ERROR(
        this.currentFunction.range,
        this.currentFunction.text,
        'Missing closing parenthesis'
      );

      // Replace the function in its parent container with the error node
      if (this.functionStack.length === 1) {
        // This is a top-level function, replace it in statement elements
        const index = this.currentStatement.elements.indexOf(this.currentFunction);
        if (index !== -1) {
          this.currentStatement.elements[index] = errorNode;
        }
      } else {
        // This is a nested function, replace it in parent function parameters
        const parentFunction = this.functionStack[this.functionStack.length - 2];
        const index = parentFunction.parameters.indexOf(this.currentFunction);
        if (index !== -1) {
          parentFunction.parameters[index] = errorNode;
        }
      }

      this.functionStack.pop();
    }
    this.currentFunction = null;
  }

  startNewStatement(token: Node, indent: number) {
    const newStatement = nodes.STATEMENT(token.range, '', indent) as StatementNode;
    this.currentStatement.children.push(newStatement);
    this.statementStack.push(newStatement);
    this.currentStatement = newStatement;

    if (token.type === 'SPACE') {
      this.addTokenToStatements(token);
    } else {
      this.addTokenToStatements(token);
      if (token.type !== 'COMMENT' && token.type !== 'LINEBREAK' && token.type !== 'IDENTITY') {
        this.addElementToCurrentStatement(token);
      }
    }
  }

  startNewFunction(nameToken: Node, openParenToken: Node) {
    const newFunction = nodes.FUNCTION(nameToken.range, '', nameToken) as FunctionNode;

    if (this.currentFunction) {
      this.currentFunction.parameters.push(newFunction);
      this.addTokenToFunctions(newFunction);
    } else {
      this.currentStatement.elements.push(newFunction);
      this.addTokenToStatements(newFunction);
    }

    this.functionStack.push(newFunction);
    this.currentFunction = newFunction;
    this.currentFunction.nodes.push(nameToken);
    this.currentFunction.nodes.push(openParenToken);
    this.addTokenToStatements(openParenToken);
  }

  completeCurrentFunction(token: Node): State {
    this.currentFunction!.nodes.push(token);
    this.completeComplexElement(this.currentFunction!);
    this.functionStack.pop();

    if (this.functionStack.length === 0) {
      this.currentFunction = null;
      this.addTokenToStatements(token);
      return 'STATEMENT';
    } else {
      this.currentFunction = this.functionStack[this.functionStack.length - 1];
      this.addTokenToFunctions(token);
      return 'FUNCTION';
    }
  }

  addTokenToFunctions(token: Node) {
    this.functionStack.forEach((func) => {
      func.nodes.push(token);
    });
    this.addTokenToStatements(token);
  }

  addElementToCurrentFunction(element: Node) {
    this.currentFunction!.parameters.push(element);
    this.addTokenToFunctions(element);
  }
}

export function statementize(tokens: Generator<Node>): Node[] {
  const context = new StatementizerContext();
  let pendingIdentity: Node | null = null;

  for (const token of tokens) {
    switch (context.state) {
      case 'NEWLINE':
        switch (token.type) {
          case 'LINEBREAK':
            context.addTokenToStatements(token);
            break;
          case 'SPACE': {
            context.state = 'STATEMENT';
            const indent = token.text.length;
            while (indent <= context.currentStatement.indent) {
              context.completeCurrentStatement();
            }
            context.startNewStatement(token, indent);
            break;
          }
          case 'COMMENT':
            context.addTokenToStatements(token);
            break;
          default:
            context.state = 'STATEMENT';
            while (context.currentStatement.indent >= 0) {
              context.completeCurrentStatement();
            }
            context.startNewStatement(token, 0);
            if (token.type === 'IDENTITY') {
              pendingIdentity = token;
            }
            break;
        }
        break;

      case 'STATEMENT':
        switch (token.type) {
          case 'LINEBREAK':
            if (pendingIdentity) {
              context.addElementToCurrentStatement(pendingIdentity);
              pendingIdentity = null;
            }
            context.state = 'NEWLINE';
            context.addTokenToStatements(token);
            break;
          case 'SPACE':
            context.addTokenToStatements(token);
            break;
          case 'COMMENT':
            context.addTokenToStatements(token);
            break;
          case 'PARENTHESIS_OPEN':
            if (pendingIdentity && pendingIdentity.type === 'IDENTITY') {
              context.state = 'FUNCTION';
              context.startNewFunction(pendingIdentity, token);
              pendingIdentity = null;
            } else {
              // Create error for non-identity followed by parenthesis
              let errorText = token.text;
              let errorRange = token.range;

              if (pendingIdentity) {
                errorText = pendingIdentity.text + token.text;
                errorRange = new Range(
                  pendingIdentity.range.startRow,
                  pendingIdentity.range.startColumn,
                  token.range.endRow,
                  token.range.endColumn
                );
              }

              const errorNode = nodes.ERROR(errorRange, errorText, 'Unexpected token');
              context.addElementToCurrentStatement(errorNode);
              pendingIdentity = null;
            }
            break;
          case 'PARENTHESIS_CLOSE':
          case 'COMMA':
            context.addTokenToStatements(nodes.ERROR(token.range, token.text, 'Unexpected token in statement'));
            break;
          case 'IDENTITY':
            if (pendingIdentity) {
              context.addElementToCurrentStatement(pendingIdentity);
            }
            pendingIdentity = token;
            break;
          default:
            if (pendingIdentity) {
              context.addElementToCurrentStatement(pendingIdentity);
              pendingIdentity = null;
            }
            context.addElementToCurrentStatement(token);
            break;
        }
        break;

      case 'FUNCTION':
        switch (token.type) {
          case 'PARENTHESIS_CLOSE':
            if (pendingIdentity) {
              context.addElementToCurrentFunction(pendingIdentity);
              pendingIdentity = null;
            }
            context.state = context.completeCurrentFunction(token);
            break;
          case 'COMMA':
            if (pendingIdentity) {
              context.addElementToCurrentFunction(pendingIdentity);
              pendingIdentity = null;
            }
            context.addTokenToFunctions(token);
            break;
          case 'SPACE':
          case 'COMMENT':
          case 'LINEBREAK':
            context.addTokenToFunctions(token);
            break;
          case 'IDENTITY':
            if (pendingIdentity) {
              context.addElementToCurrentFunction(pendingIdentity);
            }
            pendingIdentity = token;
            break;
          case 'PARENTHESIS_OPEN':
            if (pendingIdentity && pendingIdentity.type === 'IDENTITY') {
              context.startNewFunction(pendingIdentity, token);
              pendingIdentity = null;
            } else {
              context.addTokenToFunctions(nodes.ERROR(token.range, token.text, 'Unexpected opening parenthesis'));
            }
            break;
          default:
            if (pendingIdentity) {
              context.addElementToCurrentFunction(pendingIdentity);
              pendingIdentity = null;
            }
            context.addElementToCurrentFunction(token);
            break;
        }
        break;
    }
  }

  if (pendingIdentity) {
    context.addElementToCurrentStatement(pendingIdentity);
  }
  context.completeAllStatements();

  return context.rootStatement.children;
}
