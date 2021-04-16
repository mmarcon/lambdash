const { parse, parseFromCommand } = require('./parser');
const { generate } = require('./function-generator');

module.exports = {
  generateLambda: ({ queryOrAggregation, paramTypes, database, collection, service }) => {
    const parsed = parse(queryOrAggregation);
    return { fn: generate(parsed, paramTypes || null, database, collection, service), variables: parsed.variables, database, collection };
  },
  generateLambdaFromCommand: ({ command, database, service }) => {
    const parsed = parseFromCommand(command);
    return { fn: generate(parsed, parsed.options.paramTypes, database, parsed.collection, service, parsed.options?.format), variables: parsed.variables, options: parsed.options, database, collection: parsed.collection };
  }
};
