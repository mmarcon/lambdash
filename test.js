const assert = require('assert');
const BSON = require('bson');
const { Lambdash } = require('.');

let paramsToQuery = null;
paramsToQuery = Lambdash.paramsToQuery({ foo: 'Int32' }, ['foo']);
assert.strictEqual(paramsToQuery, 'foo=<Int32>');
paramsToQuery = Lambdash.paramsToQuery({}, ['bar']);
assert.strictEqual(paramsToQuery, 'bar=<String>');
paramsToQuery = Lambdash.paramsToQuery({ xyz: BSON.Long }, ['xyz']);
assert.strictEqual(paramsToQuery, 'xyz=<Long>');
paramsToQuery = Lambdash.paramsToQuery({ xyz: BSON.Long }, ['xyz', 'hkj']);
assert.ok(paramsToQuery.includes('hkj=<String>'));
assert.ok(paramsToQuery.includes('xyz=<Long>'));
assert.ok(paramsToQuery.includes('&'));
