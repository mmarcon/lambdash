const { parse, parseFromCommand } = require('./parser');
const { generate } = require('./function-generator');

module.exports = {
  generateLambda: ({ queryOrAggregation, paramTypes, database, collection, service }) => {
    const parsed = parse(queryOrAggregation);
    return { fn: generate(parsed, paramTypes || null, database, collection, service), variables: parsed.variables };
  },
  generateLambdaFromCommand: ({ command, paramTypes, database, service }) => {
    const parsed = parseFromCommand(command);
    return { fn: generate(parsed, paramTypes || null, database, parsed.collection, service), variables: parsed.variables };
  }
};
