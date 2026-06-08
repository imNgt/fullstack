export enum TokenType {
  CLASS = "CLASS",
  PUBLIC = "PUBLIC",
  STATIC = "STATIC",
  VOID = "VOID",
  MAIN = "MAIN",
  INT = "INT",
  STRING = "STRING",
  BOOLEAN = "BOOLEAN",
  DOUBLE = "DOUBLE",
  FLOAT = "FLOAT",
  LONG = "LONG",
  CHAR = "CHAR",
  IF = "IF",
  ELSE = "ELSE",
  WHILE = "WHILE",
  FOR = "FOR",
  RETURN = "RETURN",
  FINAL = "FINAL",
  IDENTIFIER = "IDENTIFIER",
  INTEGER_LITERAL = "INTEGER_LITERAL",
  STRING_LITERAL = "STRING_LITERAL",
  BOOLEAN_LITERAL = "BOOLEAN_LITERAL",
  ASSIGN = "ASSIGN",
  PLUS = "PLUS",
  MINUS = "MINUS",
  MULTIPLY = "MULTIPLY",
  DIVIDE = "DIVIDE",
  MOD = "MOD",
  PLUS_PLUS = "PLUS_PLUS",
  MINUS_MINUS = "MINUS_MINUS",
  EQUAL = "EQUAL",
  NOT_EQUAL = "NOT_EQUAL",
  LESS_THAN = "LESS_THAN",
  GREATER_THAN = "GREATER_THAN",
  LESS_EQUAL = "LESS_EQUAL",
  GREATER_EQUAL = "GREATER_EQUAL",
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACE = "LBRACE",
  RBRACE = "RBRACE",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  SEMICOLON = "SEMICOLON",
  COMMA = "COMMA",
  DOT = "DOT",
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class Lexer {
  private source: string;
  private position: number;
  private _currentChar: string;
  private line: number;
  private column: number;

  constructor(source: string) {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this._currentChar = source[0] || "";
  }

  private get currentChar(): string {
    return this._currentChar;
  }

  private set currentChar(value: string) {
    this._currentChar = value;
  }

  private advance(): void {
    this.position++;
    this.column++;
    if (this.position >= this.source.length) {
      this.currentChar = "";
    } else {
      this.currentChar = this.source[this.position];
    }
  }

  private skipWhitespace(): void {
    while (this.currentChar !== "" && /\s/.test(this.currentChar)) {
      if (this.currentChar === "\n") {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }
  }

  private skipComment(): void {
    const currentChar = this.currentChar;
    const peekChar = this.peek();

    if (currentChar === "/" && peekChar === "/") {
      while (this.currentChar !== "" && this.currentChar !== "\n") {
        this.advance();
      }
    } else if (currentChar === "/" && peekChar === "*") {
      this.advance();
      this.advance();
      while (this.currentChar !== "") {
        const c = this.currentChar;
        const p = this.peek();
        if (c === "*" && p === "/") {
          this.advance();
          this.advance();
          break;
        }
        if (c === "\n") {
          this.line++;
          this.column = 1;
        }
        this.advance();
      }
    }
  }

  private peek(): string {
    return this.source[this.position + 1] || "";
  }

  private isLetter(): boolean {
    return /[a-zA-Z_]/.test(this.currentChar);
  }

  private isDigit(): boolean {
    return /[0-9]/.test(this.currentChar);
  }

  private readIdentifier(): string {
    let result = "";
    const currentChar = this.currentChar;
    if (currentChar !== "" && (this.isLetter() || this.isDigit())) {
      result += currentChar;
      this.advance();
      while (this.currentChar !== "" && (this.isLetter() || this.isDigit())) {
        result += this.currentChar;
        this.advance();
      }
    }
    return result;
  }

  private readNumber(): string {
    let result = "";
    const currentChar = this.currentChar;
    if (currentChar !== "" && this.isDigit()) {
      result += currentChar;
      this.advance();
      while (this.currentChar !== "" && this.isDigit()) {
        result += this.currentChar;
        this.advance();
      }
    }
    const charAfterNumber = this.currentChar;
    if (charAfterNumber === "." && this.isDigit()) {
      result += ".";
      this.advance();
      while (this.currentChar !== "" && this.isDigit()) {
        result += this.currentChar;
        this.advance();
      }
    }
    return result;
  }

  private readString(): string {
    let result = "";
    this.advance();
    while (this.currentChar !== "" && this.currentChar !== '"') {
      if (this.currentChar === "\\") {
        this.advance();
        const c = this.currentChar as string;
        if (c === "n") result += "\n";
        else if (c === "t") result += "\t";
        else if (c === "\\") result += "\\";
        else if (c === '"') result += '"';
        else result += c;
      } else {
        result += this.currentChar;
      }
      this.advance();
    }
    this.advance();
    return result;
  }

  nextToken(): Token {
    const tokenLine = this.line;
    const tokenColumn = this.column;

    while (this.currentChar !== "") {
      if (/[\s]/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      if (this.currentChar === "/") {
        this.skipComment();
        continue;
      }

      if (this.isLetter()) {
        const identifier = this.readIdentifier();
        const keywordMap: Record<string, TokenType> = {
          class: TokenType.CLASS,
          public: TokenType.PUBLIC,
          static: TokenType.STATIC,
          void: TokenType.VOID,
          int: TokenType.INT,
          String: TokenType.STRING,
          boolean: TokenType.BOOLEAN,
          double: TokenType.DOUBLE,
          float: TokenType.FLOAT,
          long: TokenType.LONG,
          char: TokenType.CHAR,
          if: TokenType.IF,
          else: TokenType.ELSE,
          while: TokenType.WHILE,
          for: TokenType.FOR,
          return: TokenType.RETURN,
          final: TokenType.FINAL,
          true: TokenType.BOOLEAN_LITERAL,
          false: TokenType.BOOLEAN_LITERAL,
        };
        return {
          type: keywordMap[identifier] || TokenType.IDENTIFIER,
          value: identifier,
          line: tokenLine,
          column: tokenColumn,
        };
      }

      if (this.isDigit()) {
        return {
          type: TokenType.INTEGER_LITERAL,
          value: this.readNumber(),
          line: tokenLine,
          column: tokenColumn,
        };
      }

      if (this.currentChar === '"') {
        return {
          type: TokenType.STRING_LITERAL,
          value: this.readString(),
          line: tokenLine,
          column: tokenColumn,
        };
      }

      switch (this.currentChar) {
        case "=": {
          this.advance();
          const c = this.currentChar as string;
          if (c === "=") {
            this.advance();
            return {
              type: TokenType.EQUAL,
              value: "==",
              line: tokenLine,
              column: tokenColumn,
            };
          }
          return {
            type: TokenType.ASSIGN,
            value: "=",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "!": {
          this.advance();
          const c = this.currentChar as string;
          if (c === "=") {
            this.advance();
            return {
              type: TokenType.NOT_EQUAL,
              value: "!=",
              line: tokenLine,
              column: tokenColumn,
            };
          }
          return {
            type: TokenType.NOT,
            value: "!",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "<": {
          this.advance();
          const c = this.currentChar as string;
          if (c === "=") {
            this.advance();
            return {
              type: TokenType.LESS_EQUAL,
              value: "<=",
              line: tokenLine,
              column: tokenColumn,
            };
          }
          return {
            type: TokenType.LESS_THAN,
            value: "<",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case ">": {
          this.advance();
          const c = this.currentChar as string;
          if (c === "=") {
            this.advance();
            return {
              type: TokenType.GREATER_EQUAL,
              value: ">=",
              line: tokenLine,
              column: tokenColumn,
            };
          }
          return {
            type: TokenType.GREATER_THAN,
            value: ">",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "+": {
          this.advance();
          const c = this.currentChar as string;
          if (c === "+") {
            this.advance();
            return {
              type: TokenType.PLUS_PLUS,
              value: "++",
              line: tokenLine,
              column: tokenColumn,
            };
          }
          return {
            type: TokenType.PLUS,
            value: "+",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "-": {
          this.advance();
          const c = this.currentChar as string;
          if (c === "-") {
            this.advance();
            return {
              type: TokenType.MINUS_MINUS,
              value: "--",
              line: tokenLine,
              column: tokenColumn,
            };
          }
          return {
            type: TokenType.MINUS,
            value: "-",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "*": {
          this.advance();
          return {
            type: TokenType.MULTIPLY,
            value: "*",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "/": {
          this.advance();
          return {
            type: TokenType.DIVIDE,
            value: "/",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "%": {
          this.advance();
          return {
            type: TokenType.MOD,
            value: "%",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "&": {
          this.advance();
          const c = this.currentChar as string;
          if (c === "&") {
            this.advance();
            return {
              type: TokenType.AND,
              value: "&&",
              line: tokenLine,
              column: tokenColumn,
            };
          }
          return {
            type: TokenType.IDENTIFIER,
            value: "&",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "|": {
          this.advance();
          const c = this.currentChar as string;
          if (c === "|") {
            this.advance();
            return {
              type: TokenType.OR,
              value: "||",
              line: tokenLine,
              column: tokenColumn,
            };
          }
          return {
            type: TokenType.IDENTIFIER,
            value: "|",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "(": {
          this.advance();
          return {
            type: TokenType.LPAREN,
            value: "(",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case ")": {
          this.advance();
          return {
            type: TokenType.RPAREN,
            value: ")",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "{": {
          this.advance();
          return {
            type: TokenType.LBRACE,
            value: "{",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "}": {
          this.advance();
          return {
            type: TokenType.RBRACE,
            value: "}",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "[": {
          this.advance();
          return {
            type: TokenType.LBRACKET,
            value: "[",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case "]": {
          this.advance();
          return {
            type: TokenType.RBRACKET,
            value: "]",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case ";": {
          this.advance();
          return {
            type: TokenType.SEMICOLON,
            value: ";",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case ",": {
          this.advance();
          return {
            type: TokenType.COMMA,
            value: ",",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        case ".": {
          this.advance();
          return {
            type: TokenType.DOT,
            value: ".",
            line: tokenLine,
            column: tokenColumn,
          };
        }

        default: {
          const unknown = this.currentChar;
          this.advance();
          throw new Error(
            `未知字符: ${unknown} 在第 ${tokenLine} 行, 第 ${tokenColumn} 列`,
          );
        }
      }
    }

    return {
      type: TokenType.EOF,
      value: "",
      line: tokenLine,
      column: tokenColumn,
    };
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    let token = this.nextToken();
    while (token.type !== TokenType.EOF) {
      tokens.push(token);
      token = this.nextToken();
    }
    tokens.push(token);
    return tokens;
  }
}

export type ASTNode =
  | ClassNode
  | MethodNode
  | VariableDeclNode
  | AssignmentNode
  | ExpressionNode
  | StatementNode
  | IfNode
  | WhileNode
  | ForNode
  | ReturnNode
  | PrintNode;

export class ClassNode {
  type = "CLASS" as const;
  name: string;
  methods: MethodNode[];

  constructor(name: string, methods: MethodNode[]) {
    this.name = name;
    this.methods = methods;
  }
}

export class MethodNode {
  type = "METHOD" as const;
  name: string;
  parameters: { type: string; name: string }[];
  body: StatementNode[];

  constructor(
    name: string,
    parameters: { type: string; name: string }[],
    body: StatementNode[],
  ) {
    this.name = name;
    this.parameters = parameters;
    this.body = body;
  }
}

export class VariableDeclNode {
  type = "VARIABLE_DECL" as const;
  typeName: string;
  name: string;
  value?: ExpressionNode;
  isFinal: boolean;

  constructor(
    typeName: string,
    name: string,
    value?: ExpressionNode,
    isFinal = false,
  ) {
    this.typeName = typeName;
    this.name = name;
    this.value = value;
    this.isFinal = isFinal;
  }
}

export class AssignmentNode {
  type = "ASSIGNMENT" as const;
  name: string;
  value: ExpressionNode;

  constructor(name: string, value: ExpressionNode) {
    this.name = name;
    this.value = value;
  }
}

export class ExpressionNode {
  type: "BINARY_EXPR" | "UNARY_EXPR" | "LITERAL" | "IDENTIFIER" | "METHOD_CALL";
  left?: ExpressionNode;
  right?: ExpressionNode;
  operator?: string;
  value?: string;
  name?: string;
  args?: ExpressionNode[];

  constructor(
    type:
      | "BINARY_EXPR"
      | "UNARY_EXPR"
      | "LITERAL"
      | "IDENTIFIER"
      | "METHOD_CALL",
  ) {
    this.type = type;
  }
}

export type StatementNode =
  | VariableDeclNode
  | AssignmentNode
  | IfNode
  | WhileNode
  | ForNode
  | PrintNode
  | ReturnNode
  | ExpressionNode;

export class IfNode {
  type = "IF" as const;
  condition: ExpressionNode;
  thenBranch: StatementNode[];
  elseBranch?: StatementNode[];

  constructor(
    condition: ExpressionNode,
    thenBranch: StatementNode[],
    elseBranch?: StatementNode[],
  ) {
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }
}

export class WhileNode {
  type = "WHILE" as const;
  condition: ExpressionNode;
  body: StatementNode[];

  constructor(condition: ExpressionNode, body: StatementNode[]) {
    this.condition = condition;
    this.body = body;
  }
}

export class ForNode {
  type = "FOR" as const;
  init?: VariableDeclNode | AssignmentNode;
  condition?: ExpressionNode;
  update?: ExpressionNode;
  body: StatementNode[];

  constructor(
    init: VariableDeclNode | AssignmentNode | undefined,
    condition: ExpressionNode | undefined,
    update: ExpressionNode | undefined,
    body: StatementNode[],
  ) {
    this.init = init;
    this.condition = condition;
    this.update = update;
    this.body = body;
  }
}

export class PrintNode {
  type = "PRINT" as const;
  expression: ExpressionNode;

  constructor(expression: ExpressionNode) {
    this.expression = expression;
  }
}

export class ReturnNode {
  type = "RETURN" as const;
  value?: ExpressionNode;

  constructor(value?: ExpressionNode) {
    this.value = value;
  }
}

export class Parser {
  private tokens: Token[];
  private position: number;
  private currentToken: Token;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.position = 0;
    this.currentToken = tokens[0];
  }

  private eat(type: TokenType): Token {
    if (this.currentToken.type === type) {
      const token = this.currentToken;
      this.advance();
      return token;
    }
    throw new Error(
      `期望 ${type}，但得到 ${this.currentToken.type} 在第 ${this.currentToken.line} 行`,
    );
  }

  private advance(): void {
    this.position++;
    if (this.position < this.tokens.length) {
      this.currentToken = this.tokens[this.position];
    }
  }

  private peek(): Token {
    return (
      this.tokens[this.position + 1] || {
        type: TokenType.EOF,
        value: "",
        line: 0,
        column: 0,
      }
    );
  }

  parse(): ClassNode {
    return this.parseClass();
  }

  private parseClass(): ClassNode {
    this.eat(TokenType.PUBLIC);
    this.eat(TokenType.CLASS);
    const className = this.eat(TokenType.IDENTIFIER).value;
    this.eat(TokenType.LBRACE);

    const methods: MethodNode[] = [];
    while (this.currentToken.type === TokenType.PUBLIC) {
      methods.push(this.parseMethod());
    }

    this.eat(TokenType.RBRACE);
    return new ClassNode(className, methods);
  }

  private parseMethod(): MethodNode {
    this.eat(TokenType.PUBLIC);
    this.eat(TokenType.STATIC);
    this.eat(TokenType.VOID);
    const methodName = this.eat(TokenType.IDENTIFIER).value;

    this.eat(TokenType.LPAREN);
    const parameters: { type: string; name: string }[] = [];
    if (this.currentToken.type === TokenType.STRING) {
      this.eat(TokenType.STRING);
      this.eat(TokenType.LBRACKET);
      this.eat(TokenType.RBRACKET);
      const paramName = this.eat(TokenType.IDENTIFIER).value;
      parameters.push({ type: "String[]", name: paramName });
    }
    this.eat(TokenType.RPAREN);

    this.eat(TokenType.LBRACE);
    const body = this.parseStatements();
    this.eat(TokenType.RBRACE);

    return new MethodNode(methodName, parameters, body);
  }

  private parseStatements(): StatementNode[] {
    const statements: StatementNode[] = [];
    while (
      this.currentToken.type !== TokenType.RBRACE &&
      this.currentToken.type !== TokenType.EOF
    ) {
      statements.push(this.parseStatement());
    }
    return statements;
  }

  private parseStatement(): StatementNode {
    const tokenType = this.currentToken.type;

    if (
      tokenType === TokenType.FINAL ||
      tokenType === TokenType.INT ||
      tokenType === TokenType.STRING ||
      tokenType === TokenType.BOOLEAN ||
      tokenType === TokenType.DOUBLE ||
      tokenType === TokenType.FLOAT ||
      tokenType === TokenType.LONG ||
      tokenType === TokenType.CHAR
    ) {
      return this.parseVariableDecl();
    }

    if (tokenType === TokenType.IDENTIFIER) {
      const nextType = this.peek().type;
      if (nextType === TokenType.ASSIGN) {
        return this.parseAssignment();
      } else if (
        nextType === TokenType.PLUS_PLUS ||
        nextType === TokenType.MINUS_MINUS
      ) {
        return this.parseIncrement();
      }
      return this.parseExpression();
    }

    if (tokenType === TokenType.IF) {
      return this.parseIf();
    }

    if (tokenType === TokenType.WHILE) {
      return this.parseWhile();
    }

    if (tokenType === TokenType.FOR) {
      return this.parseFor();
    }

    if (tokenType === TokenType.RETURN) {
      return this.parseReturn();
    }

    if (tokenType === TokenType.SEMICOLON) {
      this.eat(TokenType.SEMICOLON);
      const expr = new ExpressionNode("LITERAL");
      expr.value = "";
      return expr;
    }

    return this.parseExpression();
  }

  private parseVariableDecl(): VariableDeclNode {
    const isFinal = this.currentToken.type === TokenType.FINAL;
    if (isFinal) this.eat(TokenType.FINAL);

    const typeName = this.eat(this.currentToken.type).value;
    const name = this.eat(TokenType.IDENTIFIER).value;

    let value: ExpressionNode | undefined;
    if (this.currentToken.type === TokenType.ASSIGN) {
      this.eat(TokenType.ASSIGN);
      value = this.parseExpression();
    }

    this.eat(TokenType.SEMICOLON);
    return new VariableDeclNode(typeName, name, value, isFinal);
  }

  private parseAssignment(): AssignmentNode {
    const name = this.eat(TokenType.IDENTIFIER).value;
    this.eat(TokenType.ASSIGN);
    const value = this.parseExpression();
    this.eat(TokenType.SEMICOLON);
    return new AssignmentNode(name, value);
  }

  private parseIncrement(): ExpressionNode {
    const name = this.eat(TokenType.IDENTIFIER).value;
    const operator = this.eat(this.currentToken.type).value;
    this.eat(TokenType.SEMICOLON);

    const expr = new ExpressionNode("IDENTIFIER");
    expr.name = name;

    const unary = new ExpressionNode("UNARY_EXPR");
    unary.operator = operator;
    unary.right = expr;

    return unary;
  }

  private parseIf(): IfNode {
    this.eat(TokenType.IF);
    this.eat(TokenType.LPAREN);
    const condition = this.parseExpression();
    this.eat(TokenType.RPAREN);
    this.eat(TokenType.LBRACE);
    const thenBranch = this.parseStatements();
    this.eat(TokenType.RBRACE);

    let elseBranch: StatementNode[] | undefined;
    if (this.currentToken.type === TokenType.ELSE) {
      this.eat(TokenType.ELSE);
      const peekType = this.currentToken.type;
      if (peekType === (TokenType.IF as TokenType)) {
        elseBranch = [this.parseIf()];
      } else {
        this.eat(TokenType.LBRACE);
        elseBranch = this.parseStatements();
        this.eat(TokenType.RBRACE);
      }
    }

    return new IfNode(condition, thenBranch, elseBranch);
  }

  private parseWhile(): WhileNode {
    this.eat(TokenType.WHILE);
    this.eat(TokenType.LPAREN);
    const condition = this.parseExpression();
    this.eat(TokenType.RPAREN);
    this.eat(TokenType.LBRACE);
    const body = this.parseStatements();
    this.eat(TokenType.RBRACE);

    return new WhileNode(condition, body);
  }

  private parseFor(): ForNode {
    this.eat(TokenType.FOR);
    this.eat(TokenType.LPAREN);

    let init: VariableDeclNode | AssignmentNode | undefined;
    if (this.currentToken.type === TokenType.INT) {
      init = this.parseVariableDeclNoSemicolon();
    } else if (this.currentToken.type === TokenType.IDENTIFIER) {
      init = this.parseAssignmentNoSemicolon();
    }
    this.eat(TokenType.SEMICOLON);

    let condition: ExpressionNode | undefined;
    if (this.currentToken.type !== TokenType.SEMICOLON) {
      condition = this.parseExpression();
    }
    this.eat(TokenType.SEMICOLON);

    let update: ExpressionNode | undefined;
    if (this.currentToken.type !== TokenType.RPAREN) {
      update = this.parseExpression();
    }
    this.eat(TokenType.RPAREN);

    this.eat(TokenType.LBRACE);
    const body = this.parseStatements();
    this.eat(TokenType.RBRACE);

    return new ForNode(init, condition, update, body);
  }

  private parseVariableDeclNoSemicolon(): VariableDeclNode {
    const typeName = this.eat(this.currentToken.type).value;
    const name = this.eat(TokenType.IDENTIFIER).value;

    let value: ExpressionNode | undefined;
    if (this.currentToken.type === TokenType.ASSIGN) {
      this.eat(TokenType.ASSIGN);
      value = this.parseExpression();
    }

    return new VariableDeclNode(typeName, name, value);
  }

  private parseAssignmentNoSemicolon(): AssignmentNode {
    const name = this.eat(TokenType.IDENTIFIER).value;
    this.eat(TokenType.ASSIGN);
    const value = this.parseExpression();
    return new AssignmentNode(name, value);
  }

  private parseReturn(): ReturnNode {
    this.eat(TokenType.RETURN);
    let value: ExpressionNode | undefined;
    if (this.currentToken.type !== TokenType.SEMICOLON) {
      value = this.parseExpression();
    }
    this.eat(TokenType.SEMICOLON);
    return new ReturnNode(value);
  }

  private parseExpression(): ExpressionNode {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): ExpressionNode {
    let left = this.parseLogicalAnd();
    while (this.currentToken.type === TokenType.OR) {
      const operator = this.eat(TokenType.OR).value;
      const right = this.parseLogicalAnd();
      const expr = new ExpressionNode("BINARY_EXPR");
      expr.left = left;
      expr.operator = operator;
      expr.right = right;
      left = expr;
    }
    return left;
  }

  private parseLogicalAnd(): ExpressionNode {
    let left = this.parseEquality();
    while (this.currentToken.type === TokenType.AND) {
      const operator = this.eat(TokenType.AND).value;
      const right = this.parseEquality();
      const expr = new ExpressionNode("BINARY_EXPR");
      expr.left = left;
      expr.operator = operator;
      expr.right = right;
      left = expr;
    }
    return left;
  }

  private parseEquality(): ExpressionNode {
    let left = this.parseRelational();
    while (
      this.currentToken.type === TokenType.EQUAL ||
      this.currentToken.type === TokenType.NOT_EQUAL
    ) {
      const operator = this.eat(this.currentToken.type).value;
      const right = this.parseRelational();
      const expr = new ExpressionNode("BINARY_EXPR");
      expr.left = left;
      expr.operator = operator;
      expr.right = right;
      left = expr;
    }
    return left;
  }

  private parseRelational(): ExpressionNode {
    let left = this.parseAdditive();
    while (
      [
        TokenType.LESS_THAN,
        TokenType.GREATER_THAN,
        TokenType.LESS_EQUAL,
        TokenType.GREATER_EQUAL,
      ].includes(this.currentToken.type)
    ) {
      const operator = this.eat(this.currentToken.type).value;
      const right = this.parseAdditive();
      const expr = new ExpressionNode("BINARY_EXPR");
      expr.left = left;
      expr.operator = operator;
      expr.right = right;
      left = expr;
    }
    return left;
  }

  private parseAdditive(): ExpressionNode {
    let left = this.parseMultiplicative();
    while (
      this.currentToken.type === TokenType.PLUS ||
      this.currentToken.type === TokenType.MINUS
    ) {
      const operator = this.eat(this.currentToken.type).value;
      const right = this.parseMultiplicative();
      const expr = new ExpressionNode("BINARY_EXPR");
      expr.left = left;
      expr.operator = operator;
      expr.right = right;
      left = expr;
    }
    return left;
  }

  private parseMultiplicative(): ExpressionNode {
    let left = this.parseUnary();
    while (
      [TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MOD].includes(
        this.currentToken.type,
      )
    ) {
      const operator = this.eat(this.currentToken.type).value;
      const right = this.parseUnary();
      const expr = new ExpressionNode("BINARY_EXPR");
      expr.left = left;
      expr.operator = operator;
      expr.right = right;
      left = expr;
    }
    return left;
  }

  private parseUnary(): ExpressionNode {
    if (
      this.currentToken.type === TokenType.NOT ||
      this.currentToken.type === TokenType.MINUS
    ) {
      const operator = this.eat(this.currentToken.type).value;
      const expr = new ExpressionNode("UNARY_EXPR");
      expr.operator = operator;
      expr.right = this.parseUnary();
      return expr;
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionNode {
    const tokenType = this.currentToken.type;

    if (tokenType === TokenType.LPAREN) {
      this.eat(TokenType.LPAREN);
      const expr = this.parseExpression();
      this.eat(TokenType.RPAREN);
      return expr;
    }

    if (tokenType === TokenType.IDENTIFIER) {
      let name = this.eat(TokenType.IDENTIFIER).value;

      while (this.currentToken.type === TokenType.DOT) {
        this.eat(TokenType.DOT);
        name += "." + this.eat(TokenType.IDENTIFIER).value;
      }

      const nextToken = this.currentToken;

      if (nextToken.type === TokenType.LPAREN) {
        this.eat(TokenType.LPAREN);
        const args: ExpressionNode[] = [];
        if (this.currentToken.type !== TokenType.RPAREN) {
          args.push(this.parseExpression());
          while (this.currentToken.type === TokenType.COMMA) {
            this.eat(TokenType.COMMA);
            args.push(this.parseExpression());
          }
        }
        this.eat(TokenType.RPAREN);

        const call = new ExpressionNode("METHOD_CALL");
        call.name = name;
        call.args = args;
        return call;
      }

      const expr = new ExpressionNode("IDENTIFIER");
      expr.name = name;
      return expr;
    }

    if (
      tokenType === TokenType.INTEGER_LITERAL ||
      tokenType === TokenType.STRING_LITERAL ||
      tokenType === TokenType.BOOLEAN_LITERAL
    ) {
      const literal = new ExpressionNode("LITERAL");
      literal.value = this.eat(tokenType).value;
      return literal;
    }

    throw new Error(`未知的表达式类型: ${tokenType}`);
  }
}

export class CodeGenerator {
  private code: string[] = [];
  private indent = 0;

  generate(ast: ClassNode): { jsCode: string } {
    this.code = [];
    this.indent = 0;

    this.visitClass(ast);

    return { jsCode: this.code.join("\n") };
  }

  private visitClass(node: ClassNode): void {
    node.methods.forEach((method) => {
      if (method.name === "main") {
        this.visitMethod(method);
      }
    });
  }

  private visitMethod(node: MethodNode): void {
    node.body.forEach((stmt) => this.visitStatement(stmt));
  }

  private visitStatement(node: StatementNode): void {
    switch (node.type) {
      case "VARIABLE_DECL":
        this.visitVariableDecl(node);
        break;
      case "ASSIGNMENT":
        this.visitAssignment(node);
        break;
      case "IF":
        this.visitIf(node);
        break;
      case "WHILE":
        this.visitWhile(node);
        break;
      case "FOR":
        this.visitFor(node);
        break;
      case "PRINT":
        this.visitPrint(node);
        break;
      case "RETURN":
        this.visitReturn(node);
        break;
      case "BINARY_EXPR":
      case "UNARY_EXPR":
      case "IDENTIFIER":
      case "METHOD_CALL":
      case "LITERAL":
        this.visitExpression(node);
        this.write(";");
        break;
    }
  }

  private visitVariableDecl(node: VariableDeclNode): void {
    const keyword = node.isFinal ? "const" : "let";
    let line = `${keyword} ${node.name}`;
    if (node.value) {
      line += ` = ${this.generateExpression(node.value)}`;
    }
    this.write(line + ";");
  }

  private visitAssignment(node: AssignmentNode): void {
    const line = `${node.name} = ${this.generateExpression(node.value)}`;
    this.write(line + ";");
  }

  private visitIf(node: IfNode): void {
    this.write(`if (${this.generateExpression(node.condition)}) {`);
    this.indent++;
    node.thenBranch.forEach((stmt) => this.visitStatement(stmt));
    this.indent--;
    this.write("}");

    if (node.elseBranch) {
      this.write("else {");
      this.indent++;
      node.elseBranch.forEach((stmt) => this.visitStatement(stmt));
      this.indent--;
      this.write("}");
    }
  }

  private visitWhile(node: WhileNode): void {
    this.write(`while (${this.generateExpression(node.condition)}) {`);
    this.indent++;
    node.body.forEach((stmt) => this.visitStatement(stmt));
    this.indent--;
    this.write("}");
  }

  private visitFor(node: ForNode): void {
    let initStr = "";
    if (node.init) {
      if (node.init.type === "VARIABLE_DECL") {
        const keyword = node.init.isFinal ? "const" : "let";
        initStr = `${keyword} ${node.init.name}`;
        if (node.init.value) {
          initStr += ` = ${this.generateExpression(node.init.value)}`;
        }
      } else {
        initStr = `${node.init.name} = ${this.generateExpression(node.init.value)}`;
      }
    }

    let conditionStr = "";
    if (node.condition) {
      conditionStr = this.generateExpression(node.condition);
    }

    let updateStr = "";
    if (node.update) {
      updateStr = this.generateExpression(node.update);
    }

    this.write(`for (${initStr}; ${conditionStr}; ${updateStr}) {`);
    this.indent++;
    node.body.forEach((stmt) => this.visitStatement(stmt));
    this.indent--;
    this.write("}");
  }

  private visitPrint(node: PrintNode): void {
    const exprStr = this.generateExpression(node.expression);
    this.write(`console.log(${exprStr});`);
  }

  private visitReturn(node: ReturnNode): void {
    if (node.value) {
      this.write(`return ${this.generateExpression(node.value)};`);
    } else {
      this.write("return;");
    }
  }

  private visitExpression(node: ExpressionNode): void {
    this.write(this.generateExpression(node));
  }

  private generateExpression(node: ExpressionNode): string {
    switch (node.type) {
      case "LITERAL": {
        const val = node.value;
        if (val === "true" || val === "false") {
          return val;
        }
        if (val !== undefined && /^[0-9.]+$/.test(val)) {
          return val;
        }
        return `"${val || ""}"`;
      }

      case "IDENTIFIER":
        return node.name || "";

      case "BINARY_EXPR": {
        const left = this.generateExpression(node.left!);
        const right = this.generateExpression(node.right!);
        return `(${left} ${node.operator} ${right})`;
      }

      case "UNARY_EXPR": {
        const operand = this.generateExpression(node.right!);
        return `${node.operator}${operand}`;
      }

      case "METHOD_CALL": {
        const args =
          node.args?.map((arg) => this.generateExpression(arg)).join(", ") ||
          "";
        if (node.name === "System.out.println") {
          return `console.log(${args})`;
        }
        return `${node.name}(${args})`;
      }

      default:
        return "";
    }
  }

  private write(line: string): void {
    if (line.trim()) {
      this.code.push("  ".repeat(this.indent) + line);
    }
  }
}

export class JavaCompiler {
  static compile(javaCode: string): { jsCode: string; error?: string } {
    try {
      const lexer = new Lexer(javaCode);
      const tokens = lexer.tokenize();

      const parser = new Parser(tokens);
      const ast = parser.parse();

      const generator = new CodeGenerator();
      const { jsCode } = generator.generate(ast);

      return { jsCode };
    } catch (error) {
      return {
        jsCode: "",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  static execute(javaCode: string): string {
    const { jsCode, error } = this.compile(javaCode);

    if (error) {
      return `编译错误: ${error}`;
    }

    const outputs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      outputs.push(args.map((arg) => String(arg)).join(" "));
    };
    try {
      const func = new Function(jsCode);
      func();
      console.log = originalLog;

      if (outputs.length === 0) {
        return "程序执行成功，但没有输出。\n\n提示：使用 System.out.println() 输出内容";
      }

      return outputs.join("\n") + "\n\n程序执行成功！";
    } catch (execError) {
      console.log = originalLog;
      return `执行错误: ${execError instanceof Error ? execError.message : String(execError)}`;
    }
  }
}
