module.exports = {
  generate: ({ query, type, variables }, paramTypes, database, collection, service = 'lambdash-mongodb-atlas-service') => {
    const method = type === 'aggregation' ? 'aggregate' : 'find';
    let paramParser = 'const params = query';
    if (paramTypes) {
      paramParser = `const params = {${Object.keys(paramTypes).map(par => `${par}: BSON.${(typeof paramTypes[par] === 'string') ? paramTypes[par] : paramTypes[par].name}(query.${par})`).join(', ')}};`;
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
