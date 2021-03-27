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
    }
  };
};
