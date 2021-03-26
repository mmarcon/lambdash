require('dotenv').config();
const fetch = require('node-fetch');
const logger = require('pino')({ level: 'debug' });
const process = require('process');
const { login, profile, groupIds } = require('./lib/auth')(fetch, { logger: logger.child({ module: 'auth' }) });
// const { groups } = require('./lib/groups')(fetch, { logger: logger.child({ module: 'groups' }) });

(async function () {
  const user = await login(process.env);
  const userProfile = await groupIds(user);
  // const groupsInfo = await groups(user);
  console.log(userProfile);
})();
