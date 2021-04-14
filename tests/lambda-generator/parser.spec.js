const test = require('tape');
const { parseFromCommand } = require('../../lib/lambda-generator/parser');

test('parse mdb commands into lambda-ready queries', t => {
  t.test('simple query', t => {
    t.plan(4);
    const parsed = parseFromCommand('db.myCollection.find({foo: 123})');
    t.strictEqual(parsed.query, '{foo: 123}', 'keeps query body intact');
    t.strictEqual(parsed.type, 'query', 'parses query correctly');
    t.strictEqual(parsed.variables.length, 0, 'no variables');
    t.strictEqual(parsed.collection, 'myCollection', 'finds collection name');
  });
  t.test('simple aggregation', t => {
    t.plan(4);
    const parsed = parseFromCommand('db.myCollection.aggregate([{$match: {year: {$gte: 1982}}}])');
    t.strictEqual(parsed.query, '[{$match: {year: {$gte: 1982}}}]', 'keeps aggregation body intact');
    t.strictEqual(parsed.type, 'aggregation', 'parses aggregation correctly');
    t.strictEqual(parsed.variables.length, 0, 'no variables');
    t.strictEqual(parsed.collection, 'myCollection', 'finds collection name');
  });
  t.test('query with variables', t => {
    t.plan(5);
    const parsed = parseFromCommand('db.myCollection.find({foo: bar})');
    t.strictEqual(parsed.query, '{foo: bar}', 'keeps query body intact');
    t.strictEqual(parsed.type, 'query', 'parses query correctly');
    t.strictEqual(parsed.variables.length, 1, 'one variable');
    t.strictEqual(parsed.variables[0], 'bar', 'detects right variable');
    t.strictEqual(parsed.collection, 'myCollection', 'finds collection name');
  });
  t.test('aggregation with variables', t => {
    t.plan(6);
    const parsed = parseFromCommand('db.myCollection.aggregate([{$match: {year: {$gte: from, $lte: to}}}])');
    t.strictEqual(parsed.query, '[{$match: {year: {$gte: from, $lte: to}}}]', 'keeps aggregation body intact');
    t.strictEqual(parsed.type, 'aggregation', 'parses aggregation correctly');
    t.strictEqual(parsed.variables.length, 2, 'two variables');
    t.strictEqual(parsed.variables[0], 'from', 'detects right variable (1)');
    t.strictEqual(parsed.variables[1], 'to', 'detects right variable (2)');
    t.strictEqual(parsed.collection, 'myCollection', 'finds collection name');
  });
  t.test('query with variable and options', t => {
    t.plan(8);
    const parsed = parseFromCommand('db.movies.find({year: {$gte: from, $lte: to}}).lambda({paramTypes: {from: "Int32", to: "Int32"}})');
    t.strictEqual(parsed.query, '{year: {$gte: from, $lte: to}}', 'keeps query body intact');
    t.strictEqual(parsed.type, 'query', 'parses query correctly');
    t.strictEqual(parsed.variables.length, 2, 'two variables');
    t.strictEqual(parsed.variables[0], 'from', 'detects right variable (1)');
    t.strictEqual(parsed.variables[1], 'to', 'detects right variable (2)');
    t.strictEqual(parsed.options.paramTypes.from, 'Int32', 'parses right param type (1)');
    t.strictEqual(parsed.options.paramTypes.to, 'Int32', 'parses right param type (2)');
    t.strictEqual(parsed.collection, 'movies', 'finds collection name');
  });
  t.test('aggregation with variables and options', t => {
    t.plan(8);
    const parsed = parseFromCommand('db.myCollection.aggregate([{$match: {year: {$gte: from, $lte: to}}}]).lambda({paramTypes: {from: "Int32", to: "Int32"}})');
    t.strictEqual(parsed.query, '[{$match: {year: {$gte: from, $lte: to}}}]', 'keeps aggregation body intact');
    t.strictEqual(parsed.type, 'aggregation', 'parses aggregation correctly');
    t.strictEqual(parsed.variables.length, 2, 'two variables');
    t.strictEqual(parsed.variables[0], 'from', 'detects right variable (1)');
    t.strictEqual(parsed.variables[1], 'to', 'detects right variable (2)');
    t.strictEqual(parsed.options.paramTypes.from, 'Int32', 'parses right param type (1)');
    t.strictEqual(parsed.options.paramTypes.to, 'Int32', 'parses right param type (2)');
    t.strictEqual(parsed.collection, 'myCollection', 'finds collection name');
  });
  t.test('aggregation with nested variables and options', t => {
    t.plan(7);
    const parsed = parseFromCommand('db.myCollection.aggregate([{$match: {year: {$gte: from, $lte: to}, genres: {$in: [foo, bar]}}}]).lambda({paramTypes: {from: "Int32", to: "Int32"}})');
    t.strictEqual(parsed.query, '[{$match: {year: {$gte: from, $lte: to}, genres: {$in: [foo, bar]}}}]', 'keeps aggregation body intact');
    t.strictEqual(parsed.type, 'aggregation', 'parses aggregation correctly');
    t.strictEqual(parsed.variables.length, 4, 'two variables');
    t.deepEqual(parsed.variables, ['from', 'to', 'foo', 'bar'], 'detects right variables');
    t.strictEqual(parsed.options.paramTypes.from, 'Int32', 'parses right param type (1)');
    t.strictEqual(parsed.options.paramTypes.to, 'Int32', 'parses right param type (2)');
    t.strictEqual(parsed.collection, 'myCollection', 'finds collection name');
  });
});
