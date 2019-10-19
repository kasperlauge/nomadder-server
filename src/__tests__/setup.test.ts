import { setup } from '../index';
test('Setup', () => {
  expect(setup({ endpoint: 'test' })).toBe(true);
});
