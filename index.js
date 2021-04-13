const {
  createHash
} = require('crypto');

// The Atlas API uses digest auth so we need a special client for it
const DigestFetch = require('digest-fetch');
const fetch = require('node-fetch');
const logger = require('pino')({ level: 'error' });
const { URL } = require('url');
const { login, groupIds } = require('./lib/realm/auth')(fetch, { logger: logger.child({ module: 'auth' }) });
const { getApps, createApp } = require('./lib/realm/groups/apps')(fetch, { logger: logger.child({ module: 'groups' }) });
const { getServices, createHttpService, createAtlasService } = require('./lib/realm/groups/apps/services')(fetch, { logger: logger.child({ module: 'services' }) });
const IncomingWebhooks = require('./lib/realm/groups/apps/services/incoming_webooks');
const { createIncomingWebhook } = IncomingWebhooks(fetch, { logger: logger.child({ module: 'incoming_webhooks' }) });
const atlasClustersAPI = require('./lib/atlas/clusters');
const atlasGroupsAPI = require('./lib/atlas/groups');
const { generateLambda, generateLambdaFromCommand } = require('./lib/lambda-generator');
const EventEmitter = require('events');
const uuid = require('uuid');

const BASE_ATLAS_SERVICE_NAME = 'lambdash-mongodb-atlas-service-';
const SERVICE_NAME = 'atlas-query-lambdas-service';
const APP_NAME = 'atlas-query-lambdas';

const REALM_WEBHOOK_BASE_URL = 'https://webhooks.mongodb-realm.com/api/client/v2.0/app';

class Lambdash extends EventEmitter {
  constructor ({ redactedUrl }) {
    super();
    this.redactedUrl = new URL(redactedUrl);
    const hash = createHash('md5');
    hash.update(this.redactedUrl.hostname);
    this.atlasServiceName = BASE_ATLAS_SERVICE_NAME + hash.digest('hex');
  }

  async login ({ username, apiKey }) {
    this.credentials = { username, apiKey };
    const digestFetch = new DigestFetch(username, apiKey);
    this.getClusters = atlasClustersAPI(digestFetch.fetch.bind(digestFetch), { logger: logger.child({ module: 'atlas.clusters' }) })?.getClusters;
    this.getGroups = atlasGroupsAPI(digestFetch.fetch.bind(digestFetch), { logger: logger.child({ module: 'atlas.groups' }) })?.getGroups;
    await this._login();
    await this._fetchInfo();
    this.emit('ready');
  }

  async _login () {
    this.user = await login(this.credentials);
  }

  async _fetchInfo () {
    const groups = await groupIds(this.user);
    // For each group, now fetch the clusters
    // This can be optimized for cases where there are a lot
    // of groups but for now let's just fetch everything
    const groupsToClusters = await groups.reduce(async (acc, groupId) => {
      const clusters = await this.getClusters({ groupId });
      acc[groupId] = clusters;
      return acc;
    }, {});
    // Attempt to find the right group and cluster
    // This should probably be done at the previous step
    Object.keys(groupsToClusters).forEach((groupId) => {
      const clusters = groupsToClusters[groupId];
      const rightCluster = clusters.find(c => {
        const srvUrl = new URL(c.srvAddress);
        return srvUrl.hostname === this.redactedUrl.hostname;
      });
      if (rightCluster) {
        this.groupId = groupId;
        this.cluster = rightCluster;
      }
    });
    if (!this.groupId) {
      throw new Error('Could not find the right cluster');
    }
  }

  static determineParams (paramTypes = {}, variables = []) {
    const variablesAsObject = variables.reduce((acc, curr) => {
      acc[curr] = 'String';
      return acc;
    }, {});
    const unionParamVariables = { ...variablesAsObject, ...paramTypes };
    return Object.keys(unionParamVariables).reduce((acc, key) => {
      const paramTypeName = (typeof unionParamVariables[key] === 'string') ? unionParamVariables[key] : unionParamVariables[key].name;
      const kv = `${key}=<${paramTypeName}>`;
      acc.paramsQueryString = acc.paramsQueryString.length > 0 ? acc.paramsQueryString + `&${kv}` : kv;
      acc.params[key] = paramTypeName;
      return acc;
    }, { paramsQueryString: '', params: {} });
  }

  async createLambda (name, options) {
    this.emit('creating lambda');
    await this._ensureAppExists();
    await this._ensureServicesExists();
    this.emit('creating function');
    const lambda = generateLambda({ ...options, service: this.atlasServiceName });
    const secret = options.secret ? options.secret : uuid.v4();
    let url = `${REALM_WEBHOOK_BASE_URL}/${this.urlAppId}/service/${SERVICE_NAME}/incoming_webhook/${name}?secret=${secret}`;
    const { params, paramsQueryString } = Lambdash.determineParams(options.paramTypes, lambda.variables);
    if (paramsQueryString.length > 0) {
      url += `&${paramsQueryString}`;
    }
    try {
      await createIncomingWebhook({
        ...this.user,
        groupId: this.groupId,
        appId: this.appId,
        serviceId: this.httpServiceId,
        name,
        secret,
        httpMethod: IncomingWebhooks.HTTPMethod.GET,
        validationMethod: IncomingWebhooks.ValidationMethod.REQUIRE_SECRET,
        functionSource: lambda.fn
      });
      this.emit('lambda created', {
        name,
        secret,
        url,
        curl: `curl "${url}"`,
        params
      });
    } catch (e) {
      this.emit('error', e.message);
    }
  }

  async createLambdaFromCommand (name, options) {
    this.emit('creating lambda');
    await this._ensureAppExists();
    await this._ensureServicesExists();
    this.emit('creating function');
    const lambda = generateLambdaFromCommand({ ...options, service: this.atlasServiceName });
    const secret = options.secret ? options.secret : uuid.v4();
    let url = `${REALM_WEBHOOK_BASE_URL}/${this.urlAppId}/service/${SERVICE_NAME}/incoming_webhook/${name}?secret=${secret}`;
    const { params, paramsQueryString } = Lambdash.determineParams(options.paramTypes, lambda.variables);
    if (paramsQueryString.length > 0) {
      url += `&${paramsQueryString}`;
    }
    try {
      await createIncomingWebhook({
        ...this.user,
        groupId: this.groupId,
        appId: this.appId,
        serviceId: this.httpServiceId,
        name,
        secret,
        httpMethod: IncomingWebhooks.HTTPMethod.GET,
        validationMethod: IncomingWebhooks.ValidationMethod.REQUIRE_SECRET,
        functionSource: lambda.fn
      });
      this.emit('lambda created', {
        name,
        secret,
        url,
        curl: `curl "${url}"`,
        params
      });
    } catch (e) {
      this.emit('error', e.message);
    }
  }

  async _ensureAppExists () {
    this.emit('setting up realm app');
    const apps = await getApps({ ...this.user, groupId: this.groupId });
    const app = apps.find(({ name }) => name === APP_NAME);
    if (!app) {
      logger.info('App does not exist. We will create it');
      // Create a new app
      const appCreateResponse = await createApp({ ...this.user, groupId: this.groupId, name: APP_NAME });
      this.appId = appCreateResponse?.appId;
      this.urlAppId = appCreateResponse?.client_app_id;
      this.emit('realm app ready', this.appId);
    } else {
      this.appId = app.appId;
      this.urlAppId = app.client_app_id;
      logger.info('App already exists, no need to create it');
      this.emit('realm app ready', this.appId);
    }
  }

  async _ensureServicesExists () {
    this.emit('setting up realm http service');
    const services = await getServices({ ...this.user, groupId: this.groupId, appId: this.appId });
    const httpService = services.find(({ name }) => name === SERVICE_NAME);
    if (!httpService) {
      logger.info('Service does not exist. We will create it');
      // Create a new service
      const createServiceResponse = await createHttpService({ ...this.user, groupId: this.groupId, appId: this.appId, name: SERVICE_NAME });
      this.httpServiceId = createServiceResponse?.serviceId;
      this.emit('realm http service ready', this.httpServiceId);
    } else {
      this.httpServiceId = httpService.serviceId;
      logger.info('Service already exists, no need to create it');
      this.emit('realm http service ready', this.httpServiceId);
    }

    this.emit('setting up realm atlas service');
    if (!services.find(({ name }) => name === this.atlasServiceName)) {
      logger.info('Atlas service does not exist. We will create it');
      // Create a new service
      await createAtlasService({
        ...this.user,
        groupId: this.groupId,
        appId: this.appId,
        name: this.atlasServiceName,
        clusterName: this.cluster.name
      });
      this.emit('atlas service ready');
    } else {
      logger.info('Atlas service already exists, no need to create it');
      this.emit('atlas service ready');
    }
  }
}

module.exports = {
  Lambdash
};
