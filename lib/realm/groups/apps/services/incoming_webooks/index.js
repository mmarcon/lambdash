const {
  defaultBaseUrl
} = require('../../../..');

const HTTPMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  ANY: 'ANY'
};

const ValidationMethod = {
  REQUIRE_SECRET: 'SECRET_AS_QUERY_PARAM',
  VERIFY_PAYLOAD_SIGNATURE: 'VERIFY_PAYLOAD',
  NO_VALIDATION: 'NO_VALIDATION'
};

function IncomingWebhooks (fetch, {
  baseUrl = defaultBaseUrl,
  logger
} = {}) {
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
      validationMethod = ValidationMethod.NO_VALIDATION,
      httpMethod = HTTPMethod.ANY,
      secret
    } = {}, endpoint = 'groups/{groupId}/apps/{appId}/services/{serviceId}/incoming_webhooks') => {
      const options = {
        validationMethod,
        httpMethod,
        secret
      };
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
          function_source: (typeof functionSource === 'string') && functionSource.startsWith('exports') ? functionSource : `exports = async ${functionSource.toString()}`,
          respond_result: respondResult,
          options
        })
      })
        .then(res => res.json());
    }
  };
}

IncomingWebhooks.HTTPMethod = HTTPMethod;
IncomingWebhooks.ValidationMethod = ValidationMethod;

module.exports = IncomingWebhooks;
