import { normalizeHex, safeColor, withAlpha } from '../src/utils/color';
import { createId } from '../src/utils/id';

test('walidacja koloru HEX', () => {
  expect(normalizeHex('A855F7')).toBe('#a855f7');
  expect(normalizeHex('#fff')).toBe('#fff');
  expect(normalizeHex('#00ff22ff')).toBe('#00ff22ff');
  expect(normalizeHex('#12')).toBeNull();
  expect(normalizeHex('zielony')).toBeNull();
  expect(safeColor('xyz', '#000')).toBe('#000');
  expect(withAlpha('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)');
});

test('identyfikatory są unikalne', () => {
  const ids = new Set(Array.from({ length: 2000 }, createId));
  expect(ids.size).toBe(2000);
});
