const process = require('process');
const defaultBaseUrl = process.env.REALM_BASE_URL || 'https://realm.mongodb.com/api/admin/v3.0';

const checkStatus = async function (res) {
  if (res.ok) {
    return res;
  }
  const data = await res.json();
  let errorMessage = data.error || res.statusText;
  switch (data.error_code) {
    case 'IncomingWebhookDuplicateName':
      errorMessage = 'Query Lambda with named already exists';
      break;
  }

  throw new Error(errorMessage);
};

module.exports = {
  defaultBaseUrl,
  checkStatus
};
