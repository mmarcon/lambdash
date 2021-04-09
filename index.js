require('dotenv').config();
const process = require('process');

// The Atlas API uses digest auth so we need a special client for it
const DigestFetch = require('digest-fetch');
const digestFetch = new DigestFetch(process.env.username, process.env.apiKey);
const fetch = require('node-fetch');
const logger = require('pino')({ level: 'debug' });
const BSON = require('bson');
const { login, groupIds } = require('./lib/realm/auth')(fetch, { logger: logger.child({ module: 'auth' }) });
const { getApps, createApp } = require('./lib/realm/groups/apps')(fetch, { logger: logger.child({ module: 'groups' }) });
const { getServices, createHttpService, createAtlasService } = require('./lib/realm/groups/apps/services')(fetch, { logger: logger.child({ module: 'services' }) });
const IncomingWebhooks = require('./lib/realm/groups/apps/services/incoming_webooks');
const { getIncomingWebhooks, createIncomingWebhook } = IncomingWebhooks(fetch, { logger: logger.child({ module: 'incoming_webhooks' }) });
const { getClusters } = require('./lib/atlas/clusters')(digestFetch.fetch.bind(digestFetch), { logger: logger.child({ module: 'atlas.clusters' }) });
const { getGroups } = require('./lib/atlas/groups')(digestFetch.fetch.bind(digestFetch), { logger: logger.child({ module: 'atlas.groups' }) });
const { generateLambda } = require('./lib/lambda-generator');

(async function () {
  const newAppName = 'test-realm-node';
  const newServiceName = 'test-realm-node-service';
  const atlasServiceName = 'mongodb-atlas-service';

  const user = await login(process.env);
  const groups = await groupIds(user);

  // Get groups/projects
  const groupsInfo = await getGroups({});
  logger.info(groupsInfo);

  // Get clusters
  const clusters = await getClusters({ ...user, groupId: groups[0] });
  logger.info(clusters.map(c => c.name));

  // Get apps
  let apps = await getApps({ ...user, groupId: groups[0] });
  logger.info(apps.map(({ name }) => name));

  if (!apps.find(({ name }) => name === newAppName)) {
    logger.info('App does not exist. We will create it');
    // Create a new app
    const appCreateResponse = await createApp({ ...user, groupId: groups[0], name: newAppName });
    logger.info(appCreateResponse);
    // Get apps again
    apps = await getApps({ ...user, groupId: groups[0] });
    logger.info(apps.map(({ name }) => name));
  } else {
    logger.info('App already exists, no need to create it');
  }

  // Get services for new app
  let services = await getServices({ ...user, groupId: groups[0], appId: apps.find(({ name }) => name === newAppName)?.appId });
  logger.info(services.map(({ name }) => name));

  if (!services.find(({ name }) => name === newServiceName)) {
    logger.info('Service does not exist. We will create it');
    // Create a new service
    const createServiceResponse = await createHttpService({ ...user, groupId: groups[0], appId: apps.find(({ name }) => name === newAppName)?.appId, name: newServiceName });
    logger.info(createServiceResponse);
    // Get services again
    services = await getServices({ ...user, groupId: groups[0], appId: apps.find(({ name }) => name === newAppName)?.appId });
    logger.info(services.map(({ name }) => name));
  } else {
    logger.info('Service already exists, no need to create it');
  }

  if (!services.find(({ name }) => name === atlasServiceName)) {
    logger.info('Atlas service does not exist. We will create it');
    // Create a new service
    const createServiceResponse = await createAtlasService({
      ...user,
      groupId: groups[0],
      appId: apps.find(({ name }) => name === newAppName)?.appId,
      name: atlasServiceName,
      clusterName: clusters[0].name
    });
    logger.info(createServiceResponse);
    // Get services again
    services = await getServices({ ...user, groupId: groups[0], appId: apps.find(({ name }) => name === newAppName)?.appId });
    logger.info(services.map(({ name }) => name));
  } else {
    logger.info('Atlas service already exists, no need to create it');
  }

  // Get incoming webhooks for a service
  const incomingWebhooks = await getIncomingWebhooks({
    ...user,
    groupId: groups[0],
    appId: apps.find(({ name }) => name === newAppName)?.appId,
    serviceId: services.find(({ name }) => name === newServiceName)?.serviceId
  });
  logger.info(incomingWebhooks);

  // Generate a "lambda" function given a query or aggregation on a collection
  const lambda = generateLambda({
    queryOrAggregation: `[
    {
      $match: {
        year: {
          $gte: from,
          $lte: to
        }
      }
    },
    {
      $unwind: {
        path: '$genres'
      }
    },
    {
      $group: {
        _id: '$genres',
        total: {
          $sum: 1
        }
      }
    },
    {
      $project: {
        genre: '$_id',
        _id: 0,
        total: 1
      }
    },
    {
      $sort: {
        total: -1
      }
    }
  ]`,
    paramTypes: {
      from: BSON.Int32,
      to: BSON.Int32
    },
    database: 'sample_mflix',
    collection: 'movies',
    service: atlasServiceName
  });

  const createIncomingWebhookResponse = await createIncomingWebhook({
    ...user,
    groupId: groups[0],
    appId: apps.find(({ name }) => name === newAppName)?.appId,
    serviceId: services.find(({ name }) => name === newServiceName)?.serviceId,
    name: 'moviesByGenre3',
    secret: '432monkeysJumpingOnTheBed',
    httpMethod: IncomingWebhooks.HTTPMethod.GET,
    validationMethod: IncomingWebhooks.ValidationMethod.REQUIRE_SECRET,
    functionSource: lambda
  });
  logger.info(createIncomingWebhookResponse);
})();
