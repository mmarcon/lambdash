# lambdash - Lamb - dash

![Lamb-dash](resources/lamb-.png)

## Not production ready!

This code is highly experimental and covers mostly the happy path, there is almost no testing and no good logic for error handling.

---

This module uses the MongoDB Atlas and Realm APIs to create HTTP endpoints for MongoDB queries.

The module exposes an API that can be used in other tools (e.g. the MongoDB Shell) to help users quickly create a
serverless backend based on MongoDB queries and aggregation.

## How to use Lambdash

Install it from npm with

```
$ npm install mdb-lambdash
```

### API

#### Create an instance of Lambdash

`clusterConnectionString` is not used for anything connection related. Lambdash internally uses the
MongoDB Atlas API to fetch information about all the cluster in your Atlas organization and try to find
the one that corresponds to the `clusterConnectionString` based on `hostname:port`.

That is the cluster that will be used by default as a data source when setting up the Realm infrastructure
for your queries.

```javascript
const Lambdash = require('lambdash');

const lambdash = new Lambdash({ clusterConnectionString: 'mongodb+srv://some.url?options' });

```
HGOWJQSI:5fa73ef7-56b2-48bb-a99f-0fe5ef09bca7
#### Login

```javascript
await lambdash.login({username: 'ABCDEFGH', apiKey: '7b8d3018-dfb3-4ea4-8713-eb6d23438f1d'});
```

When you call this method, Lambdash will set up the client to talk to the Atlas Public API and
login with the Realm Admin API to fetch the auth tokens.
#### Create a query lambda

```javascript
await lambdash.createLambdaFromCommand({
  command: `db.collToUse.aggregate([{$match: {foo: {$gt: bar}}}]).lambda({name: 'queryLambdaName', paramTypes: {bar: 'Int32'}, secret: '321littleMonkeysJumpingOnTheBed'})`,
  database: 'databaseToUse'
});
```

This will parse `command` into an AST and extract the right information from the `lambda()` method and the collection name from the command.
The query or aggregation will also be parsed and the variables extracted to become query parameters.

Then, based on the information that was extracted, it will generate a Real function that will be turned into a webhook after doing all the
necessary Realm plumbing (App setup and HTTP and Atlas services creation).

If `secret` is not specified, Lambdash will generate a random one to secure the endpoint.

There is also another method:

```javascript
await lambdash.createLambda('queryLambdaName', {
  secret: '321littleMonkeysJumpingOnTheBed',
  queryOrAggregation: '[{$match: {foo: {$gt: bar}}}]',
  paramTypes: { bar: 'Int32' },
  database: 'databaseToUse',
  collection: 'collToUse'
});
```
This works similar as the above, except that all the parameters are passed expicitly and the AST is only generated for `queryOrAggregation`
to extract the variables that will become query parameters when the query lambda is generated. **This method is less battle-tested than the one above.**

####

Credits:
 * **Icon: ** Lamb by Symbolon from the Noun Project