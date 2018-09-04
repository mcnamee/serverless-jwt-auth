const AWS = require('aws-sdk');

const options = (process.env.IS_OFFLINE)
  ? { region: 'localhost', endpoint: 'http://localhost:8000' }
  : {};

const client = new AWS.DynamoDB.DocumentClient(options);

module.exports = client;
