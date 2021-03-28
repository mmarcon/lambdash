const {
  defaultAtlasBaseUrl
} = require('..');

module.exports = (fetch, {
  baseUrl = defaultAtlasBaseUrl,
  logger
} = {}) => {
  return {
    getClusters: ({
      groupId
    } = {}, endpoint = 'groups/{groupId}/clusters') => {
      const url = `${baseUrl}/${endpoint.replace('{groupId}', groupId)}`;
      logger.debug('Requesting %s', url);
      return fetch(url, {
        method: 'get'
      })
        .then(res => res.json())
        .then(clustersInfo => clustersInfo?.results);
    }
  };
};
