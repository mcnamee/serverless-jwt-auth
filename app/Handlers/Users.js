const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs-then');
const uuid = require('uuid');
const sanitizer = require('validator');

const DB = require('../../db');
const ValidateRequest = require('../Requests/Users');
const ApiResponse = require('../Helpers/ApiResponse');

const TableName = process.env.TABLE_USERS;

/* *** Helpers *** */

/**
 * Create & Sign a JWT with the user ID for request auth
 * @param str id 
 */
const signToken = id =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: 86400 });

/**
 * Does a given email exist as a user?
 * @param str email
 */
findEmail = (email) => {
  const params = {
    TableName,
    FilterExpression : 'email = :email',
    ExpressionAttributeValues : {
      ':email': sanitizer.normalizeEmail(sanitizer.trim(email))
    },
  };

  return new Promise(async resolve => DB.scan(params, (err, res) => {
    // Return the user
    if (res && res.Items && res.Items[0]) resolve(res.Items[0]);

    // Otherwise let us know that its empty
    resolve(null);
  }));
}

/* *** Endpoints *** */

/**
 * POST /register ----------------------------------------------------
 * User Sign Up
 * @param event 
 * @param context 
 */
module.exports.register = async (event) => {
  const eventBody = JSON.parse(event.body);
  const params = {
    TableName,
    Item: {
      id: uuid.v1(),
      firstName: sanitizer.trim(eventBody.firstName),
      lastName: sanitizer.trim(eventBody.lastName),
      email: sanitizer.normalizeEmail(sanitizer.trim(eventBody.email)),
      password: await bcrypt.hash(eventBody.password, 8),
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    },
  };

  return findEmail(eventBody.email) // Does the email already exist?
    .then(user => ValidateRequest.register(eventBody, user)) // Validate the user input
    .then(() => DB.put(params, err => { if (err) { throw err; } })) // Add the data to the DB
    .then(() => ({ auth: true, token: signToken(params.Item.id) })) // Create an Auth token
    .then(data => ApiResponse.success(data)) // Respond with data
    .catch(err => ApiResponse.failure(err)); // Respond with error
}


/**
 * POST /login ----------------------------------------------------
 * Logs a user in - returns a JWT token
 * @param event 
 * @param context 
 */
module.exports.login = (event) => {
  const eventBody = JSON.parse(event.body);

  return findEmail(eventBody.email) // Does the user exist?
    .then(user => ValidateRequest.login(eventBody, user)) // Validate the user input
    .then(user => ({ auth: true, token: signToken(user.id) })) // Create an Auth token
    .then(data => ApiResponse.success(data)) // Respond with data
    .catch(err => ApiResponse.failure(err)); // Respond with error
}


/**
 * GET /me ----------------------------------------------------
 * Get's the authenticated user's login details
 * @param event 
 * @param context 
 */
module.exports.me = (event) => {
  const userId = event.requestContext.authorizer.principalId;
  const params = { TableName, Key: { id: userId } };

  return new Promise(async (resolve, reject) =>
    // Get the data from the DB
    DB.get(params, (err, res) => {
      if (err) return reject(err);
      if (!res || !res.Item) { return reject({ message: 'User not found' }); }
      return resolve(res.Item);
    }))
    .then(data => ApiResponse.success(data)) // Respond with data
    .catch(err => ApiResponse.failure(err)); // Respond with error
}
