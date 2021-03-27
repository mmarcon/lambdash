require('dotenv').config();
const fetch = require('node-fetch');
const logger = require('pino')({ level: 'debug' });
const process = require('process');
const { login, groupIds } = require('./lib/auth')(fetch, { logger: logger.child({ module: 'auth' }) });
const { getApps } = require('./lib/groups/apps')(fetch, { logger: logger.child({ module: 'groups' }) });
const { getServices } = require('./lib/groups/apps/services')(fetch, { logger: logger.child({ module: 'services' }) });
const { getIncomingWebhooks } = require('./lib/groups/apps/services/incoming_webooks')(fetch, { logger: logger.child({ module: 'incoming_webhooks' }) });

(async function () {
  const user = await login(process.env);
  const groups = await groupIds(user);
  const apps = await getApps({ ...user, groupId: groups[0] });
  const services = await getServices({ ...user, groupId: groups[0], appId: apps.find(({ name }) => name === 'iot-fun')?.appId });
  const incomingWebhooks = await getIncomingWebhooks({
    ...user,
    groupId: groups[0],
    appId: apps.find(({ name }) => name === 'iot-fun')?.appId,
    serviceId: services.find(({ name }) => name === 'alexa')?.serviceId
  });
  logger.info(incomingWebhooks);
})();
