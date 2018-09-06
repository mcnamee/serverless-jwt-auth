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


/**
 * Get a user by ID
 * @param str id
 */
userById = (id) => {
  return new Promise(async resolve => DB.get({ TableName, Key: { id } }, (err, res) => {
    if (err) throw err;

    // Return the user
    if (res && res.Item) {
      if (res.Item.password) delete res.Item.password;
      return resolve(res.Item);
    }

    return resolve(null);
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
      level: 'standard',
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    },
  };

  return findEmail(params.Item.email) // Does the email already exist?
    .then(user => ValidateRequest.register(eventBody, user, params.Item)) // Validate the user input
    .then(() => DB.put(params, err => { if (err) { throw err; } })) // Add the data to the DB
    .then(() => userById(params.Item.id)) // Get user data from DB
    .then(user => ({ message: 'Success', data: { token: signToken(user.id), ...user } })) // Create an Auth token
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
    .then(user => userById(user.id)) // Get user data from DB
    .then(user => ({ message: 'Success', data: { token: signToken(user.id), ...user } })) // Create an Auth token
    .then(data => ApiResponse.success(data)) // Respond with data
    .catch(err => ApiResponse.failure(err)); // Respond with error
}


/**
 * GET /user ----------------------------------------------------
 * Get's the authenticated user's login details
 * @param event 
 * @param context 
 */
module.exports.user = (event) =>
  userById(event.requestContext.authorizer.principalId)
    .then(data => ApiResponse.success({ // Respond with data
      message: 'Success',
      data,
    }))
    .catch(err => ApiResponse.failure(err)); // Respond with error


/**
 * PUT /user ----------------------------------------------------
 * Update my User account
 * @param event 
 * @param context 
 */
module.exports.update = async (event) => {
  const eventBody = JSON.parse(event.body);
  const id = event.requestContext.authorizer.principalId;
  const user = await userById(id);

  const sanitizedUser = { id }; // Need the id for when comparing emails
  if (eventBody.firstName) sanitizedUser.firstName = sanitizer.trim(eventBody.firstName);
  if (eventBody.lastName) sanitizedUser.lastName = sanitizer.trim(eventBody.lastName);
  if (eventBody.email) sanitizedUser.email = sanitizer.normalizeEmail(sanitizer.trim(eventBody.email));
  if (eventBody.password) sanitizedUser.password = await bcrypt.hash(eventBody.password, 8);

  const params = {
    TableName,
    Item: {
      ...user, // Need the existing data, otherwise other values are removed on put
      ...sanitizedUser,
      updatedAt: new Date().getTime(),
    },
  };

  // Does the email already exist?
  const newEmailUser = sanitizedUser.email ? await findEmail(sanitizedUser.email) : null;

  return ValidateRequest.update(eventBody, newEmailUser, sanitizedUser) // Validate the user input
    .then(() => DB.put(params, err => { if (err) { throw err; } })) // Add the data to the DB
    .then(async () => ApiResponse.success({
      message: 'User Updated',
      data: await userById(id),
    }))
    .catch(err => ApiResponse.failure(err)); // Respond with error
}
