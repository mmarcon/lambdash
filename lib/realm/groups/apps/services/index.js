const {
  defaultBaseUrl,
  checkStatus
} = require('../../..');

const ReadPreference = {
  PRIMARY: 'primary',
  PRIMARY_PREFERRED: 'primaryPreferred',
  SECONDARY: 'secondary',
  SECONDARY_PREFERRED: 'secondaryPreferred',
  NEAREST: 'nearest'
};

function Services (fetch, {
  baseUrl = defaultBaseUrl,
  logger
} = {}) {
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
        .then(checkStatus)
        .then(res => res.json())
        .then(services => services.map(service => {
          service.serviceId = service._id;
          delete service._id;
          return service;
        }));
    },
    createHttpService: ({
      access_token, // eslint-disable-line camelcase
      groupId,
      appId,
      name
    } = {}, endpoint = 'groups/{groupId}/apps/{appId}/services') => {
      const url = `${baseUrl}/${endpoint
        .replace('{groupId}', groupId)
        .replace('{appId}', appId)}`;
      return fetch(url, {
        method: 'post',
        headers: {
          Authorization: `Bearer ${access_token}` // eslint-disable-line camelcase
        },
        body: JSON.stringify({ name, type: 'http' })
      })
        .then(checkStatus)
        .then(res => res.json())
        .then(service => {
          service.serviceId = service._id;
          delete service._id;
          return service;
        });
    },
    createAtlasService: ({
      access_token, // eslint-disable-line camelcase
      groupId,
      appId,
      name,
      clusterName,
      readPreference = ReadPreference.PRIMARY_PREFERRED,
      wireProtocolEnabled = false,
      sync = {}
    } = {}, endpoint = 'groups/{groupId}/apps/{appId}/services') => {
      const url = `${baseUrl}/${endpoint
        .replace('{groupId}', groupId)
        .replace('{appId}', appId)}`;

      return fetch(url, {
        method: 'post',
        headers: {
          Authorization: `Bearer ${access_token}` // eslint-disable-line camelcase
        },
        body: JSON.stringify({ name, type: 'mongodb-atlas', config: { clusterName, readPreference, wireProtocolEnabled, sync } })
      })
        .then(checkStatus)
        .then(res => res.json())
        .then(service => {
          service.serviceId = service._id;
          delete service._id;
          return service;
        });
    }
  };
}

Services.ReadPreference = ReadPreference;

module.exports = Services;
