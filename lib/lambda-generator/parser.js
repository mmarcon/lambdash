const acorn = require('acorn');
const walk = require('acorn-walk');
const JSON5 = require('json5');

const DECLARATION = '__LAMBDASH_PARSER_WRAPPER__';

const wrap = (query) => `const ${DECLARATION} = ${query}`;

const parse = (queryOrAggregation) => {
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
};

const parseFromCommand = (command) => {
  const ast = acorn.parse(command, { ecmaVersion: 2020 });
  let collection = ''; let parsedQueryOrAggregation = null;
  let options = null;
  walk.simple(ast, {
    MemberExpression (node) {
      if (node?.object?.type === 'Identifier' && node?.object?.name === 'db') {
        if (node?.property?.type === 'Identifier') {
          collection = node?.property?.name;
        } else if (node?.property?.type === 'Literal') {
          collection = node?.property?.value;
        }
      }
    },
    CallExpression (node) {
      if (node?.callee?.property?.name === 'getCollection' &&
        node?.arguments?.[0]?.type === 'Literal') {
        collection = node?.arguments?.[0]?.value;
      } else if (/find|aggregate/.test(node?.callee?.property?.name)) {
        parsedQueryOrAggregation = parse(command.substring(node?.arguments?.[0]?.start, node?.arguments?.[0]?.end));
      }
      if (node?.callee?.property?.name === 'lambda' &&
        node?.arguments?.[0]?.type === 'ObjectExpression') {
        // Parse with JSON5 so it's tolerant with objects that are defined in JS without quotes
        options = JSON5.parse(command.substring(node?.arguments?.[0]?.start, node?.arguments?.[0]?.end));
      }
    }
  });
  return { ...parsedQueryOrAggregation, collection, options };
};

module.exports = {
  parse,
  parseFromCommand
};
