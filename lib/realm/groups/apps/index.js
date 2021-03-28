const {
  defaultBaseUrl
} = require('../..');

module.exports = (fetch, {
  baseUrl = defaultBaseUrl,
  logger
} = {}) => {
  return {
    getApps: ({
      access_token, // eslint-disable-line camelcase
      groupId
    } = {}, endpoint = 'groups/{groupId}/apps') => {
      const url = `${baseUrl}/${endpoint.replace('{groupId}', groupId)}`;
      logger.debug('Requesting %s', url);
      return fetch(url, {
        method: 'get',
        headers: {
          Authorization: `Bearer ${access_token}` // eslint-disable-line camelcase
        }
      })
        .then(res => res.json())
        .then(apps => apps.map(app => {
          app.appId = app._id;
          delete app._id;
          return app;
        }));
    },
    createApp: ({
      access_token, // eslint-disable-line camelcase
      groupId,
      name
    } = {}, endpoint = 'groups/{groupId}/apps') => {
      const url = `${baseUrl}/${endpoint.replace('{groupId}', groupId)}`;
      logger.debug('Requesting %s', url);
      return fetch(url, {
        method: 'post',
        body: JSON.stringify({ name }),
        headers: {
          Authorization: `Bearer ${access_token}` // eslint-disable-line camelcase
        }
      })
        .then(res => res.json());
    },
    getAppDefinition: ({
      access_token, // eslint-disable-line camelcase
      groupId,
      appId
    } = {}, endpoint = 'groups/{groupId}/apps/{appId}') => {
      const url = `${baseUrl}/${endpoint.replace('{groupId}', groupId).replace('{appId}', appId)}`;
      logger.debug('Requesting %s', url);
      return fetch(url, {
        method: 'get',
        headers: {
          Authorization: `Bearer ${access_token}` // eslint-disable-line camelcase
        }
      }).then(res => res.json());
    }
  };
};
