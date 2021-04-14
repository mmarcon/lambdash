const BSON = require('bson');

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
  generate: ({ query, type, variables }, paramTypes, database, collection, service = 'lambdash-mongodb-atlas-service') => {
    const method = type === 'aggregation' ? 'aggregate' : 'find';
    let paramParser = 'const params = query';
    if (paramTypes) {
      paramParser = `const params = {${Object.keys(paramTypes).map(par => `${par}: ${generateTypeConversion(par, paramTypes[par])}`).join(', ')}};`;
    }
    const lambdaFunction = `function(payload, response) {
      const { query } = payload;
      ${paramParser}
      const { ${variables.join(', ')} } = params;

      response.setHeader(
        'Content-Type',
        'application/json'
      );
      const atlas = context.services.get('${service}');
      const db = atlas.db('${database}');
      const documents = await db.collection('${collection}').${method}(${query}).toArray();
      response.setBody(JSON.stringify(documents));
      response.setStatusCode(200);
      return { msg: 'done' };
    }
    `;
    return lambdaFunction;
  }
};
