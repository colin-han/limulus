import { Range } from './range';

test('toString', () => {
  const range = new Range(1, 1, 2, 2);
  expect(range.toString()).toBe('(1:1)-(2:2)');
  expect(range.start.toString()).toBe('1:1');
  expect(range.end.toString()).toBe('2:2');
});
