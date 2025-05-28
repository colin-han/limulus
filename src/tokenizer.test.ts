import { tokenise } from "./tokenizer";
import { StringNode } from "./tokens";

test("should tokenize as expected", () => {
  const doc = `
    name
      test
    `;

  const tokens = [...tokenise(doc)];
  expect(tokens).toMatchSnapshot();
})

test("should correctly to tokenize the string", () => {
  const doc = `"abc
  def"`;

  const tokens = [...tokenise(doc)];
  const token = tokens[0] as StringNode;
  expect(token.type).toBe("STRING");
  expect(token.quot).toBe('"');
  expect(token.range).toMatchObject({ startRow: 1, endRow: 2, startColumn: 1, endColumn: 7 });
})

test("should tokenise correctly string with other token", () => {
  const doc = `otherToken 'abc
  def
  foo bar' token2`;

  const tokens = [...tokenise(doc)];
  const token1 = tokens[0];
  expect(token1.type).toBe("IDENTITY");
  expect(token1.text).toBe("otherToken");
  const token2 = tokens[1];
  expect(token2.type).toBe("SPACE");
  const token3 = tokens[2];
  expect(token3.type).toBe("STRING");
  expect((token3 as StringNode).quot).toBe("'");
  expect(token3.range).toMatchObject({ startRow: 1, startColumn: 12, endRow: 3, endColumn: 11 });
  const token5 = tokens[4];
  expect(token5).toMatchObject({ type: "IDENTITY" });
})

test("should tokenize correctly string with line break", () => {
  const doc = `
  \`test
  multi-line\`
  otherToken`;

  const tokens = [...tokenise(doc)];
  expect(tokens[0]).toMatchObject({ type: "LINEBREAK" });
  expect(tokens[1]).toMatchObject({ type: "SPACE" });
  expect(tokens[2]).toMatchObject({
    type: "STRING",
    quot: '`',
    range: { startRow: 2, startColumn: 3, endRow: 3, endColumn: 14 }
  })
})

test("should parse directive correctly", () => {
  const doc = `@unknown(param1, param2)`;

  const tokens = [...tokenise(doc)];
  expect(tokens).toHaveLength(8);
  expect(tokens[0]).toMatchObject({ type: "SYMBOL", text: "@" });
  expect(tokens[1]).toMatchObject({ type: "IDENTITY", text: "unknown" });
  expect(tokens[2]).toMatchObject({ type: "PARENTHESIS_OPEN", text: "(" });
  expect(tokens[3]).toMatchObject({ type: "IDENTITY", text: "param1" });
  expect(tokens[4]).toMatchObject({ type: "COMMA", text: "," });
  expect(tokens[5]).toMatchObject({ type: "SPACE", text: " " });
  expect(tokens[6]).toMatchObject({ type: "IDENTITY", text: "param2" });
  expect(tokens[7]).toMatchObject({ type: "PARENTHESIS_CLOSE", text: ")" });
})