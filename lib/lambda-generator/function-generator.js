const BSON = require('bson');
const simpleCsv = require('./simple-csv');

function generateTypeConversion (paramName, paramType) {
  if (typeof paramType === 'object') {
    // For when BSON types are passed directly
    paramType = paramType.name;
  }
  if (!paramType) {
    throw new TypeError('don\'t know what to do with this object');
  }
  if (BSON[paramType]) {
    return `BSON.${paramType}(query.${paramName})`;
  } else {
    switch (paramType) {
      case 'String':
        return `query.${paramName}`;
      default:
        // Don't really now what to do with that. Let's assume
        // the type has a constructor that takes a string
        // and that MongoDB knows what to do with it
        return ` new ${paramType}(query.${paramName})`;
    }
  }
}

module.exports = {
  generate: ({ query, type, variables }, paramTypes, database, collection, service = 'lambdash-mongodb-atlas-service', format = 'json') => {
    const method = type === 'aggregation' ? 'aggregate' : 'find';
    let paramParser = 'const params = query';
    let helperFunctions = '';
    let setBodyArg = 'JSON.stringify(documents)';
    let setHeaderCall = `
    response.setHeader(
      'Content-Type',
      'application/json'
    );
    `;
    if (format === 'csv') {
      setHeaderCall = `
      response.setHeader(
        'Content-Type',
        'application/csv'
      );
      `;
      helperFunctions += simpleCsv.toString();
      setBodyArg = 'simpleCsv(documents)';
    }
    if (paramTypes) {
      paramParser = `const params = {${Object.keys(paramTypes).map(par => `${par}: ${generateTypeConversion(par, paramTypes[par])}`).join(', ')}};`;
    }

    const lambdaFunction = `function(payload, response) {

      ${helperFunctions}

      const { query } = payload;
      ${paramParser}
      const { ${variables.join(', ')} } = params;
      
      ${setHeaderCall};

      const atlas = context.services.get('${service}');
      const db = atlas.db('${database}');
      const documents = await db.collection('${collection}').${method}(${query}).toArray();
      response.setBody(${setBodyArg});
      response.setStatusCode(200);
      return { msg: 'done' };
    }
    `;
    return lambdaFunction;
  }
};
