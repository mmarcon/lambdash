const { defaultBaseUrl } = require('..');

module.exports = (fetch, { baseUrl = defaultBaseUrl, logger } = {}) => {
  return {
    groups: ({ access_token } = {}, endpoint = 'groups') => { // eslint-disable-line camelcase
      const url = `${baseUrl}/${endpoint}`;
      logger.debug('Requesting %s', url);
      return fetch(url, { method: 'get' }).then(res => res.json());
    }
  };
};
