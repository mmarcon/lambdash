const test = require('tape');
const BSON = require('bson');
const { Lambdash } = require('..');

test('determineParams', t => {
  t.plan(11);
  let params = null;
  params = Lambdash.determineParams({ foo: 'Int32' }, ['foo']);
  t.strictEqual(params.paramsQueryString, 'foo=<Int32>', 'calculates query string (params = vars)');
  t.strictEqual(params.params.foo, 'Int32', 'determines params (params = vars)');
  params = Lambdash.determineParams({}, ['bar']);
  t.strictEqual(params.paramsQueryString, 'bar=<String>', 'calculates query string (no params)');
  t.strictEqual(params.params.bar, 'String', 'determines params (no params)');
  params = Lambdash.determineParams({ xyz: BSON.Long }, ['xyz']);
  t.strictEqual(params.paramsQueryString, 'xyz=<Long>', 'calculates query string (params = vars, uses BSON type)');
  t.strictEqual(params.params.xyz, 'Long', 'determines params (params = vars, uses BSON type)');
  params = Lambdash.determineParams({ xyz: BSON.Long }, ['xyz', 'hkj']);
  t.ok(params.paramsQueryString.includes('hkj=<String>'), 'calculates query string (params != vars, uses BSON type)');
  t.ok(params.paramsQueryString.includes('xyz=<Long>'), 'calculates query string (params != vars, uses BSON type)');
  t.ok(params.paramsQueryString.includes('&'), 'calculates query string (params != vars, uses BSON type) and joins them with &');
  t.strictEqual(params.params.xyz, 'Long', 'determines params (params != vars, uses BSON type)');
  t.strictEqual(params.params.hkj, 'String', 'determines params (params != vars, uses BSON type, param with no type defaults to String)');
});
