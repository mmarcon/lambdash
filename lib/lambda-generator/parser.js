const acorn = require('acorn');
const walk = require('acorn-walk');

const DECLARATION = '__LAMBDASH_PARSER_WRAPPER__';

const wrap = (query) => `const ${DECLARATION} = ${query}`;

module.exports = {
  parse: (queryOrAggregation) => {
    const ast = acorn.parse(wrap(queryOrAggregation), { ecmaVersion: 2020 });
    const variables = [];
    let type = 'unknown';
    walk.simple(ast, {
      VariableDeclarator (node) {
        if (node?.id?.name === DECLARATION) {
          type = node?.init?.type === 'ArrayExpression' ? 'aggregation' : 'query';
        }
      },
      Property (node) {
        if (node?.value?.type === 'Identifier') {
          variables.push(node?.value?.name);
        }
      }
    });
    return { query: queryOrAggregation, type, variables };
  }
};
