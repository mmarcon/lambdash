const test = require('tape');
const simpleCsv = require('../../lib/lambda-generator/simple-csv');

test('generate simple CSVs', t => {
  t.test('CSVs for strings', t => {
    t.plan(1);
    const csv = simpleCsv('foo');
    t.strictEqual(csv, 'foo', 'a string is just a string');
  });
  t.test('CSVs for numbers', t => {
    t.plan(1);
    const csv = simpleCsv(1);
    t.strictEqual(csv, '1', 'a number becomes a string');
  });
  t.test('CSVs for booleans', t => {
    t.plan(1);
    const csv = simpleCsv(false);
    t.strictEqual(csv, 'false', 'a boolean becomes a string');
  });
  t.test('CSVs for objects', t => {
    t.plan(1);
    const csv = simpleCsv({ foo: 'bar', a: 12 });
    t.strictEqual(csv, 'foo,a\n"bar","12"', 'an object becomes a csv');
  });
  t.test('CSVs for objects, strings have new lines', t => {
    t.plan(1);
    const csv = simpleCsv({ foo: 'bar\nmonkey', a: 12 });
    t.strictEqual(csv, 'foo,a\n"bar\nmonkey","12"', 'an object becomes a csv');
  });
  t.test('CSVs for nested objects', t => {
    t.plan(1);
    const csv = simpleCsv({ foo: 'bar\nmonkey', a: 12, xyz: { h: 12, k: 'baaa' } });
    t.strictEqual(csv, 'foo,a,xyz\n"bar\nmonkey","12",{\\"h\\":12,\\"k\\":\\"baaa\\"}', 'an object becomes a csv');
  });
  t.test('CSVs for arrays of nested objects', t => {
    t.plan(1);
    const csv = simpleCsv([{ foo: 'bar\nmonkey', a: 12, xyz: { h: 12, k: 'baaa' } }, { foo: 'bar\nmonkey', a: 13, xyz: { h: 12, k: 'baaa' } }]);
    t.strictEqual(csv, 'foo,a,xyz\n"bar\nmonkey","12",{\\"h\\":12,\\"k\\":\\"baaa\\"}\n"bar\nmonkey","13",{\\"h\\":12,\\"k\\":\\"baaa\\"}', 'an object becomes a csv');
  });
});
