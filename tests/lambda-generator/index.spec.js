const test = require('tape');
const { generateLambdaFromCommand } = require('../../lib/lambda-generator');

test('generate lambda function from command', t => {
  t.test('get a lambda function from a query command', t => {
    t.plan(5);
    const lambdaFunction = generateLambdaFromCommand({
      command: 'db.movies.find({year: {$gte: from, $lte: to}}).lambda({paramTypes: {from: "Int32", to: "Int32"}})',
      database: 'movies',
      service: 'foo-service'
    });
    t.strictEqual(lambdaFunction.options.paramTypes.from, 'Int32', 'puts params in the right place (1)');
    t.strictEqual(lambdaFunction.options.paramTypes.to, 'Int32', 'puts params in the right place (2)');
    t.deepEqual(lambdaFunction.variables, ['from', 'to'], 'puts variables in the right place (2)');
    t.ok(lambdaFunction.fn.includes('const params = {from: BSON.Int32(query.from), to: BSON.Int32(query.to)};'), 'function body includes param parsing');
    t.ok(lambdaFunction.fn.includes('.get(\'foo-service\')'), 'function body includes getting Atlas service');
  });
});
