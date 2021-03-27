const {
  defaultBaseUrl
} = require('../../../..');

module.exports = (fetch, {
  baseUrl = defaultBaseUrl,
  logger
} = {}) => {
  return {
    getIncomingWebhooks: ({
      access_token, // eslint-disable-line camelcase
      groupId,
      appId,
      serviceId
    } = {}, endpoint = 'groups/{groupId}/apps/{appId}/services/{serviceId}/incoming_webhooks') => {
      const url = `${baseUrl}/${endpoint
        .replace('{groupId}', groupId)
        .replace('{appId}', appId)
        .replace('{serviceId}', serviceId)}`;
      logger.debug('Requesting %s', url);
      return fetch(url, {
        method: 'get',
        headers: {
          Authorization: `Bearer ${access_token}` // eslint-disable-line camelcase
        }
      })
        .then(res => res.json())
        .then(webhooks => webhooks.map(wh => {
          wh.incomingWebhookId = wh._id;
          delete wh._id;
          return wh;
        }));
    },
    createIncomingWebhook: ({
      access_token, // eslint-disable-line camelcase
      groupId,
      appId,
      serviceId,
      name,
      functionSource,
      respondResult = true,
      options = {}
    } = {}, endpoint = 'groups/{groupId}/apps/{appId}/services/{serviceId}/incoming_webhooks') => {
      options.validationMethod = 'SECRET_AS_QUERY_PARAM';
      console.log(options);
      const url = `${baseUrl}/${endpoint
        .replace('{groupId}', groupId)
        .replace('{appId}', appId)
        .replace('{serviceId}', serviceId)}`;
      logger.debug('Requesting %s', url);
      return fetch(url, {
        method: 'post',
        headers: {
          Authorization: `Bearer ${access_token}` // eslint-disable-line camelcase
        },
        body: JSON.stringify({
          name,
          function_source: (typeof functionSource === 'string') && functionSource.startsWith('exports') ? functionSource : `exports=${functionSource.toString()}`,
          respond_result: respondResult,
          options
        })
      }).then(res => res.json());
    }
  };
};
