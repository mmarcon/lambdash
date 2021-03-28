const process = require('process');
const defaultBaseUrl = process.env.REALM_BASE_URL || 'https://realm.mongodb.com/api/admin/v3.0';
const defaultAtlasBaseUrl = process.env.ATLAS_BASE_URL || 'https://cloud.mongodb.com/api/atlas/v1.0';

module.exports = {
  defaultBaseUrl,
  defaultAtlasBaseUrl
};
