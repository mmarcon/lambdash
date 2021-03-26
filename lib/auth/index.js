const { defaultBaseUrl } = require('..');

module.exports = (fetch, { baseUrl = defaultBaseUrl, logger } = {}) => {
  return {
    providers: (endpoint = 'auth/providers') => {
      const url = `${baseUrl}/${endpoint}`;
      logger.debug('Requesting %s', url);
      return fetch(url, { method: 'get' }).then(res => res.json());
    },
    login: ({ provider = 'mongodb-cloud', username, apiKey } = {}, endpoint = 'auth/providers/{provider}/login') => {
      const url = `${baseUrl}/${endpoint.replace('{provider}', provider)}`;
      logger.debug('Requesting %s', url);
      return fetch(url, { method: 'post', body: JSON.stringify({ username, apiKey }) }).then(res => res.json());
    },
    profile: ({ access_token } = {}, endpoint = 'auth/profile') => { // eslint-disable-line camelcase
      const url = `${baseUrl}/${endpoint}`;
      logger.debug('Requesting %s', url);
      return fetch(url, { method: 'get', headers: { Authorization: `Bearer ${access_token}` } }).then(res => res.json()); // eslint-disable-line camelcase
    },
    /**
     * Mostly just a helper method that fetched the profile and only returns
     * groupId (projectIds) instead of the whole profile.
     *
     * @returns {Set} a set of groupIds this user belongs to
     */
    groupIds: ({ access_token } = {}, endpoint = 'auth/profile') => { // eslint-disable-line camelcase
      const url = `${baseUrl}/${endpoint}`;
      logger.debug('Requesting %s', url);
      return fetch(url, { method: 'get', headers: { Authorization: `Bearer ${access_token}` } }) // eslint-disable-line camelcase
        .then(res => res.json())
        .then(profile => new Set(profile?.roles
          ?.filter(role => !!role.group_id)
          .map(role => role.group_id)));
    }
  };
};
