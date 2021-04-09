const { parse } = require('./parser');
const { generate } = require('./function-generator');

module.exports = {
  generateLambda: ({ queryOrAggregation, paramTypes, database, collection, service }) => {
    const parsed = parse(queryOrAggregation);
    return generate(parsed, paramTypes || null, database, collection, service);
  }
};
