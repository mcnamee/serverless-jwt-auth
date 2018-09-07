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
      // We don't want the password shown to users
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
const registerHandler = async (event, context, cb) => {
  const { body } = event;

  const params = {
    TableName,
    Item: {
      id: await uuid.v1(),
      firstName: sanitizer.trim(body.firstName),
      lastName: sanitizer.trim(body.lastName),
      email: sanitizer.normalizeEmail(sanitizer.trim(body.email)),
      password: await bcrypt.hash(body.password, 8),
      level: 'standard',
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    },
  };

  return findEmail(params.Item.email) // Does the email already exist?
    .then(user => { if (user) throw new Error('User with that email exists') })
    .then(() => DB.put(params, err => { if (err) throw err })) // Add the data to the DB
    .then(async () => await userById(params.Item.id)) // Get user data from DB
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
 */
const loginHandler = async (event, context, cb) => {
  const { body } = event;

  return findEmail(body.email) // Does the user exist?
    .then(user => { if (!user) { throw new Error('Username/Password is not correct'); } return user; })
    .then(async (user) => { // Check if passwords match
      const passwordIsValid = await bcrypt.compare(body.password, user.password);
      if (!passwordIsValid) throw new Error('Username/Password is not correct');
      return user;
    })
    .then(async user => await userById(user.id)) // Get user data from DB
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
 * Get's the authenticated user's login details
 * @param event 
 * @param context 
 */
const userHandler = async (event, context, cb) => {
  await userById(event.requestContext.authorizer.principalId)
    .then(user => cb(null, { body: { message: 'Success', data: user } }))
    .catch(err => ({ body: { message: err.message } }));
}

const user = middy(userHandler)
  .use(httpErrorHandler())
  .use(apiResponseMiddleware());


/**
 * PUT /user ----------------------------------------------------
 * Update my User account
 * @param event 
 * @param context 
 */
const updateHandler = async (event, context, cb) => {
  const { body } = event;
  const { firstName, lastName, email, password } = body;
  const id = event.requestContext.authorizer.principalId;
  const user = await userById(id);

  const sanitizedInput = {
    id, // Need the id for when comparing emails
    firstName: sanitizer.trim(firstName),
    lastName: sanitizer.trim(lastName),
    email: sanitizer.normalizeEmail(sanitizer.trim(email)),
  };

  // Password is an optional field
  if (password) sanitizedInput.password = await bcrypt.hash(password, 8);

  const params = {
    TableName,
    Item: {
      ...user, // Need the existing data, otherwise other values are removed on put
      ...sanitizedInput,
      updatedAt: new Date().getTime(),
    },
  };

  return findEmail(sanitizedInput.email) // Check if the new email already exists
    .then((existingUser) => {
      if (sanitizedInput.email && existingUser && existingUser.email) {
        // New email exists, and doesn't belong to the current user
        if (existingUser.email === sanitizedInput.email && existingUser.id !== sanitizedInput.id) {
          throw new Error('That email belongs to another user');
        }
      }
    })
    .then(() => DB.put(params, err => { if (err) throw err; })) // Update the data to the DB
    .then(async () => cb(null, { body: { message: 'User Updated', data:  await userById(id), } }))
    .catch(err => ({ body: { message: err.message } }));
}

const update = middy(updateHandler)
  .use(jsonBodyParser())
  .use(validatorMiddleware({ inputSchema: RequestSchema.update }))
  .use(httpErrorHandler())
  .use(apiResponseMiddleware());


module.exports = { register, login, user, update };
