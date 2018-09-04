const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs-then');
const dynamodb = require('../../db');
const uuid = require('uuid');
// const UserModel = require('../UserModel');
const UserRequest = require('../Requests/Users');
const sanitizer = require('validator');

/**
 * POST /login ----------------------------------------------------
 * Logs a user in - returns a JWT token
 * @param event 
 * @param context 
 */
module.exports.login = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return login(JSON.parse(event.body))
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    })).catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

/**
 * Does the username exist and password match user?
 * @param eventBody 
 */
function login(eventBody) {
  return new Promise(async (resolve, reject) => {
    const params = {
      TableName: process.env.TABLE_USERS,
      FilterExpression : 'email = :email',
      ExpressionAttributeValues : {
        ':email': sanitizer.normalizeEmail(sanitizer.trim(eventBody.email))
      },
    };

    return dynamodb.scan(params, (err, res) => {
      if (err) return reject(err);
      if (!res || !res.Items || res.Items.length < 1) {
        return reject({ message: 'User not found' });
      }
      return resolve(res.Items[0]);
    });
  })
  .then(user => UserRequest.login(eventBody, user))
  .then(user => ({ auth: true, token: signToken(user._id) }));
}

/**
 * Sign the JWT token
 * @param id 
 */
function signToken(id) {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: 86400 // expires in 24 hours
  });
}


/**
 * POST /register ----------------------------------------------------
 * User Sign Up
 * @param event 
 * @param context 
 */
module.exports.register = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return UserRequest.create(JSON.parse(event.body))
    .then(() => register(JSON.parse(event.body)))
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    })).catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

/**
 * Add the new user to the DB
 * @param eventBody 
 */
async function register(eventBody) {
  return new Promise(async (resolve, reject) => {
    const params = {
      TableName: process.env.TABLE_USERS,
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

    return dynamodb.put(params, (err) => {
      if (err) return reject(err);
      return resolve(JSON.stringify(params.Item));
    });
  }).then(user => ({ auth: true, token: signToken(user._id) }));
}


/**
 * GET /me ----------------------------------------------------
 * Get's the authenticated user's login details
 * @param event 
 * @param context 
 */
module.exports.me = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return dynamodb()
    .then(() => me(event.requestContext.authorizer.principalId)
    ).then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    })).catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

/**
 * Get auth'd user from the DB
 * @param userId 
 */
function me(userId) {
  return UserModel.findById(userId, { password: 0 })
    .then(user => !user ? Promise.reject('No user found.') : user)
    .catch(err => Promise.reject(new Error(err)));
}


