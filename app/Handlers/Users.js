const uuid = require('uuid');
const middy = require('middy');
const jwt = require('jsonwebtoken');
const sanitizer = require('validator');
const bcrypt = require('bcryptjs-then');
const { jsonBodyParser, httpErrorHandler } = require('middy/middlewares');

const DB = require('../../db');
const RequestSchema = require('../Requests/Users');
const validatorMiddleware = require('../Middleware/Validator');
const apiResponseMiddleware = require('../Middleware/ApiResponse');

const TableName = process.env.TABLE_USERS;


/* *** Helpers *** */


/**
 * Create & Sign a JWT with the user ID for request auth
 * @param str id 
 */
const signToken = id => jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: 86400 });


/**
 * Does a given email exist as a user?
 * @param str email
 */
findEmail = (email) => DB.scan({
    TableName,
    FilterExpression : 'email = :email',
    ExpressionAttributeValues : {
      ':email': sanitizer.normalizeEmail(sanitizer.trim(email))
    },
  })
  .promise()
  .then((res) => {
    // Return the user
    if (res && res.Items && res.Items[0]) return res.Items[0];

    // Otherwise let us know that its empty
    return null;
  }).catch(err => null);


/**
 * Get a user by ID
 * @param str id
 */
userById = (id) => DB.get({ TableName, Key: { id } })
  .promise()
  .then((res) => {
    // Return the user
    if (res && res.Item) {
      // We don't want the password shown to users
      if (res.Item.password) delete res.Item.password;
      return res.Item;
    }

    throw new Error('User not found');
  })


/* *** Endpoints *** */


/**
 * POST /register ----------------------------------------------------
 * User Sign Up
 * @param event
 * @param context
 * @param cb
 */
const registerHandler = async (event, context, cb) => {
  const { firstName, lastName, email, password } = event.body;

  const params = {
    TableName,
    Item: {
      id: await uuid.v1(),
      firstName: sanitizer.trim(firstName),
      lastName: sanitizer.trim(lastName),
      email: sanitizer.normalizeEmail(sanitizer.trim(email)),
      password: await bcrypt.hash(password, 8),
      level: 'standard',
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    },
  };

  return findEmail(params.Item.email) // Does the email already exist?
    .then(user => { if (user) throw new Error('User with that email exists') })
    .then(() => DB.put(params).promise()) // Add the data to the DB
    .then(() => userById(params.Item.id)) // Get user data from DB
    .then(user => cb(null, {
      statusCode: 201,
      body: { message: 'Success', data: { token: signToken(params.Item.id), ...user } },
    }))
    .catch(err => ({ body: { message: err.message } }));
}

const register = middy(registerHandler)
  .use(jsonBodyParser())
  .use(validatorMiddleware({ inputSchema: RequestSchema.register }))
  .use(httpErrorHandler())
  .use(apiResponseMiddleware());


/**
 * POST /login ----------------------------------------------------
 * Logs a user in - returns a JWT token
 * @param event
 * @param context
 * @param cb
 */
const loginHandler = async (event, context, cb) => {
  const { email, password } = event.body;

  return findEmail(email) // Does the email exist?
    .then(user => { if (!user) { throw new Error('Username/Password is not correct'); } return user; })
    .then(async (user) => { // Check if passwords match
      const passwordIsValid = await bcrypt.compare(password, user.password);
      if (!passwordIsValid) throw new Error('Username/Password is not correct');
      return user;
    })
    .then(user => cb(null, {
      body: { message: 'Success', data: { token: signToken(user.id), ...user } },
    }))
    .catch(err => ({ body: { message: err.message } }));
}

const login = middy(loginHandler)
  .use(jsonBodyParser())
  .use(validatorMiddleware({ inputSchema: RequestSchema.login }))
  .use(httpErrorHandler())
  .use(apiResponseMiddleware());


/**
 * GET /user ----------------------------------------------------
 * Returns authenticated user's login details
 * @param event
 * @param context
 * @param cb
 */
const userHandler = (event, context, cb) => cb(null, {
  body: { message: 'Success', data: event.requestContext.authorizer.user }
});

const user = middy(userHandler)
  .use(httpErrorHandler())
  .use(apiResponseMiddleware());


/**
 * PUT /user ----------------------------------------------------
 * Update my User account
 * @param event
 * @param context
 * @param cb
 */
const updateHandler = async (event, context, cb) => {
  const { firstName, lastName, email, password } = event.body;
  const id = event.requestContext.authorizer.principalId;

  // Create update query based on user input
  let query = 'set firstName=:fn, lastName=:ln, email=:em, updatedAt=:ud';
  const queryValues = {
    ':fn': sanitizer.trim(firstName),
    ':ln': sanitizer.trim(lastName),
    ':em': sanitizer.normalizeEmail(sanitizer.trim(email)),
    ':ud': new Date().getTime(),
  };

  // Password is optional, if provided, pass to query
  if (password) {
    query += ', password=:pw';
    queryValues[':pw'] = await bcrypt.hash(password, 8);
  }

  const params = {
    TableName,
    Key: { id },
    UpdateExpression: query,
    ExpressionAttributeValues: queryValues,
    ReturnValues: 'ALL_NEW',
  }

  return findEmail(queryValues[':em']) // Check if the new email already exists
    .then((foundUser) => {
      if (foundUser && foundUser.email) {
        // New email exists, and doesn't belong to the current user
        if (foundUser.email === queryValues[':em'] && foundUser.id !== id) {
          throw new Error('That email belongs to another user');
        }
      }
    })
    .then(() => DB.update(params).promise()) // Update the data to the DB
    .then(user => cb(null, { body: { message: 'User Updated', data: user } }))
    .catch(err => ({ body: { message: err.message } }));
}

const update = middy(updateHandler)
  .use(jsonBodyParser())
  .use(validatorMiddleware({ inputSchema: RequestSchema.update }))
  .use(httpErrorHandler())
  .use(apiResponseMiddleware());


/* *** Export Endpoints *** */

module.exports = { register, login, user, update };
