module.exports = function simpleCsv (data) {
  const extractKeys = (item) => Object.keys(item);
  if (typeof data === 'object') {
    const output = [];
    if (!(data instanceof Array)) {
      data = [data];
    }
    output.push(extractKeys(data[0]).join(','));
    data.forEach(item => {
      output.push(Object.values(item).map(fieldValue => (typeof fieldValue === 'object') ? JSON.stringify(fieldValue).replace(/"/g, '\\"') : `"${fieldValue}"`).join(','));
    });
    return output.join('\n');
  } else {
    return data.toString();
  }
};
