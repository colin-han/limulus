import { ErrorNode, Node, NodeType } from './node';
import { Range } from './range';
import { GroupNode, StatementNode } from './statements';

type State = 'NEWLINE' | 'STATEMENT' | 'GROUP';
interface ComplexElement {
  range: Range;
  text: string;
  nodes: Node[];
}

class StatementizerContext {
  readonly rootStatement = new StatementNode(new Range(1, 1, 1, 1), '', -1);
  readonly statementStack: StatementNode[] = [this.rootStatement];
  readonly groupStack: GroupNode[] = [];

  currentStatement: StatementNode = this.rootStatement;
  currentGroup: GroupNode | null = null;
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
    element.range = new Range(
      element.nodes[0].range.startRow,
      element.nodes[0].range.startColumn,
      element.nodes[element.nodes.length - 1].range.endRow,
      element.nodes[element.nodes.length - 1].range.endColumn
    );
    element.text = element.nodes.map((node) => node.text).join('');
  }

  completeAllStatements() {
    this.validateAndCompleteGroups();
    while (this.currentStatement.indent >= 0) {
      this.completeCurrentStatement();
    }
  }

  private validateAndCompleteGroups() {
    while (this.groupStack.length > 0) {
      this.currentGroup = this.groupStack[this.groupStack.length - 1];
      this.currentGroup.nodes[0] = new ErrorNode(
        this.currentGroup.nodes[0].range,
        this.currentGroup.nodes[0].text,
        'Missing closing parenthesis'
      );
      this.groupStack.pop();
    }
  }

  startNewStatement(token: Node, indent: number) {
    const newStatement = new StatementNode(token.range, '', indent);
    this.currentStatement.children.push(newStatement);
    this.statementStack.push(newStatement);
    this.currentStatement = newStatement;
    if (token.type === 'SPACE') {
      this.addTokenToStatements(token);
    } else {
      this.addElementToCurrentStatement(token);
    }
  }

  startNewGroup(token: Node) {
    const newGroup = new GroupNode(token.range, '');
    if (!this.currentGroup) {
      this.currentStatement.elements.push(newGroup);
    } else {
      this.currentGroup!.elements.push(newGroup);
    }
    this.groupStack.push(newGroup);
    this.currentGroup = newGroup;
    this.addTokenToStatements(token);
  }

  completeCurrentGroup(token: Node): boolean {
    this.completeComplexElement(this.currentGroup!);
    this.groupStack.pop();
    if (this.groupStack.length === 0) {
      this.currentGroup = null;
      return true;
    } else {
      this.currentGroup = this.groupStack[this.groupStack.length - 1];
    }
    this.addTokenToStatements(token);
    return false;
  }

  addTokenToGroups(token: Node<NodeType>) {
    this.groupStack.forEach((group) => {
      group.nodes.push(token);
    });
    this.addTokenToStatements(token);
  }

  addElementToCurrentGroup(element: Node) {
    this.currentGroup!.elements.push(element);
    this.addTokenToGroups(element);
  }
}

export function statementize(tokens: Generator<Node>): Node[] {
  const context = new StatementizerContext();
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
          case 'PARENTHESIS_OPEN':
            context.state = 'GROUP';
            context.startNewGroup(token);
            break;
          default:
            context.state = 'STATEMENT';
            context.completeAllStatements();
            context.startNewStatement(token, 0);
            break;
        }
        break;
      case 'STATEMENT':
        switch (token.type) {
          case 'LINEBREAK':
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
            context.state = 'GROUP';
            context.startNewGroup(token);
            break;
          case 'PARENTHESIS_CLOSE':
          case 'COMMA':
            context.addTokenToStatements(new ErrorNode(token.range, token.text, 'Unexpected closing parenthesis'));
            break;
          default:
            context.addElementToCurrentStatement(token);
            break;
        }
        break;
      case 'GROUP':
        switch (token.type) {
          case 'PARENTHESIS_CLOSE':
            if (context.completeCurrentGroup(token)) {
              context.state = 'STATEMENT';
            }
            break;
          case 'SPACE':
          case 'COMMENT':
          case 'LINEBREAK':
            context.addTokenToGroups(token);
            break;
          default:
            context.addElementToCurrentGroup(token);
            break;
        }
        break;
    }
  }

  context.completeAllStatements();

  return context.rootStatement.children;
}
