require('dotenv').config();
const fetch = require('node-fetch');
const logger = require('pino')({ level: 'debug' });
const process = require('process');
const { login, groupIds } = require('./lib/auth')(fetch, { logger: logger.child({ module: 'auth' }) });
const { getApps, createApp } = require('./lib/groups/apps')(fetch, { logger: logger.child({ module: 'groups' }) });
const { getServices, createService } = require('./lib/groups/apps/services')(fetch, { logger: logger.child({ module: 'services' }) });
const { getIncomingWebhooks, createIncomingWebhook } = require('./lib/groups/apps/services/incoming_webooks')(fetch, { logger: logger.child({ module: 'incoming_webhooks' }) });

(async function () {
  const newAppName = 'test-realm-node';
  const newServiceName = 'test-realm-node-service';

  const user = await login(process.env);
  const groups = await groupIds(user);

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
    const createServiceResponse = await createService({ ...user, groupId: groups[0], appId: apps.find(({ name }) => name === newAppName)?.appId, name: newServiceName });
    logger.info(createServiceResponse);
    // Get services again
    services = await getServices({ ...user, groupId: groups[0], appId: apps.find(({ name }) => name === newAppName)?.appId });
    logger.info(services.map(({ name }) => name));
  } else {
    logger.info('Service already exists, no need to create it');
  }

  // Get incoming webhooks for a service
  const incomingWebhooks = await getIncomingWebhooks({
    ...user,
    groupId: groups[0],
    appId: apps.find(({ name }) => name === newAppName)?.appId,
    serviceId: services.find(({ name }) => name === newServiceName)?.serviceId
  });
  logger.info(incomingWebhooks);

  const createIncomingWebhookResponse = await createIncomingWebhook({
    ...user,
    groupId: groups[0],
    appId: apps.find(({ name }) => name === newAppName)?.appId,
    serviceId: services.find(({ name }) => name === newServiceName)?.serviceId,
    name: 'test-realm-node-webhook-00',
    options: {
      secret: '432monkeysJumpingOnTheBed'
    },
    functionSource: function (payload, response) {
      response.setHeader(
        'Content-Type',
        'application/json'
      );
      response.setBody(JSON.stringify({ it: 'works!' }));
      response.setStatusCode(200);
      return { msg: 'done' };
    }
  });
  logger.info(createIncomingWebhookResponse);
})();
