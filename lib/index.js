const process = require('process');
const defaultBaseUrl = process.env.REALM_BASE_URL || 'https://realm.mongodb.com/api/admin/v3.0';

module.exports = {
  defaultBaseUrl
};
