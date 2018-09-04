const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs-then');
const connectToDatabase = require('../../db');
const UserModel = require('../UserModel');
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

  return connectToDatabase()
    .then(() => login(JSON.parse(event.body)))
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
  return UserModel.findOne({ email: eventBody.email })
    .then(user => UserRequest.login(eventBody, user))
    .then(user => signToken(user.id))
    .then(token => ({ auth: true, token: token }));
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

  return connectToDatabase()
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
  const body = {
    firstName: sanitizer.trim(eventBody.firstName),
    lastName: sanitizer.trim(eventBody.lastName),
    email: sanitizer.normalizeEmail(sanitizer.trim(eventBody.email)),
    password: await bcrypt.hash(eventBody.password, 8),
  };

  return UserRequest.create(eventBody)
    .then(() => UserModel.create(body))
    .then(user => ({ auth: true, token: signToken(user._id) }));
}


/**
 * GET /me ----------------------------------------------------
 * Get's the authenticated user's login details
 * @param event 
 * @param context 
 */
module.exports.me = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return connectToDatabase()
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


