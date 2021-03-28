const process = require('process');
const defaultAtlasBaseUrl = process.env.ATLAS_BASE_URL || 'https://cloud.mongodb.com/api/atlas/v1.0';

module.exports = {
  defaultAtlasBaseUrl
};
