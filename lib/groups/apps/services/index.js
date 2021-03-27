const {
  defaultBaseUrl
} = require('../../..');

module.exports = (fetch, {
  baseUrl = defaultBaseUrl,
  logger
} = {}) => {
  return {
    getServices: ({
      access_token, // eslint-disable-line camelcase
      groupId,
      appId
    } = {}, endpoint = 'groups/{groupId}/apps/{appId}/services') => {
      const url = `${baseUrl}/${endpoint
        .replace('{groupId}', groupId)
        .replace('{appId}', appId)}`;
      logger.debug('Requesting %s', url);
      return fetch(url, {
        method: 'get',
        headers: {
          Authorization: `Bearer ${access_token}` // eslint-disable-line camelcase
        }
      })
        .then(res => res.json())
        .then(services => services.map(service => {
          service.serviceId = service._id;
          delete service._id;
          return service;
        }));
    },
    createService: ({
      access_token, // eslint-disable-line camelcase
      groupId,
      appId,
      name,
      type = 'http'
    } = {}, endpoint = 'groups/{groupId}/apps/{appId}/services') => {
      const url = `${baseUrl}/${endpoint
        .replace('{groupId}', groupId)
        .replace('{appId}', appId)}`;
      return fetch(url, {
        method: 'post',
        headers: {
          Authorization: `Bearer ${access_token}` // eslint-disable-line camelcase
        },
        body: JSON.stringify({ name, type })
      }).then(res => res.json());
    }
  };
};
