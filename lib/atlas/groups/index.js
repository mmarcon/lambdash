const {
  defaultAtlasBaseUrl
} = require('..');

module.exports = (fetch, {
  baseUrl = defaultAtlasBaseUrl,
  logger
} = {}) => {
  return {
    getGroups: (_, endpoint = 'groups') => {
      const url = `${baseUrl}/${endpoint}`;
      logger.debug('Requesting %s', url);
      return fetch(url, {
        method: 'get'
      })
        .then(res => res.json())
        .then(groupsInfo => groupsInfo.results);
    }
  };
};
