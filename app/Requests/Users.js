const bcrypt = require('bcryptjs-then');
const validator = require('validator');

/**
 * Register user validation
 * @param obj eventBody - the user input
 */
module.exports.register = async (eventBody, user, sanitizedBody) => {
  const errors = [];

  // User already exists
  if (user) {
    errors.push('User with that email exists');
  }

  // Name isn't long enough
  if (!validator.isLength(sanitizedBody.firstName, { min: 1 })) {
    errors.push('First Name needs to longer than 4 characters');
  }
  if (!validator.isLength(sanitizedBody.lastName, { min: 1 })) {
    errors.push('Last Name needs to longer than 4 characters');
  }

  // Isn't valid email format
  if (!validator.isEmail(sanitizedBody.email)) {
    errors.push('Must be a valid email');
  }

  // Password isn't long enough
  if (!validator.isLength(validator.trim(eventBody.password), { min: 6 })) {
    errors.push('Password needs to be longer than 6 characters');
  }

  if (errors.length > 0) return Promise.reject(new Error(errors.toString()));
  return Promise.resolve();
}

/**
 * Login user validation
 * @param obj eventBody - the user input
 * @param obj user - the user from the DB
 */
module.exports.login = async (eventBody, user) => {
  // User doesn't exist
  if (!user) {
    return Promise.reject(new Error('Incorrect Username or Password'));
  }

  // Password is incorrect
  const passwordIsValid = await bcrypt.compare(eventBody.password, user.password);
  if (!passwordIsValid) {
    return Promise.reject(new Error('Incorrect Username or Password'));
  }

  return Promise.resolve(user);
}

/**
 * Update user validation
 * @param obj eventBody - the user input
 */
module.exports.update = async (eventBody, newEmailUser, sanitizedBody) => {
  const errors = [];

  // New email belongs to a user, that's not me
  if (
    sanitizedBody.email
    && newEmailUser
    && newEmailUser.email
    && newEmailUser.email === sanitizedBody.email
    && newEmailUser.id !== sanitizedBody.id
  ) {
    errors.push('That email is already in use');
  }

  // Name isn't long enough
  if (
    sanitizedBody.firstName
    && !validator.isLength(sanitizedBody.firstName, { min: 1 })
  ) {
    errors.push('First Name needs to longer than 4 characters');
  }
  if (
    sanitizedBody.lastName
    && !validator.isLength(sanitizedBody.lastName, { min: 1 })
  ) {
    errors.push('Last Name needs to longer than 4 characters');
  }

  // Isn't valid email format
  if (
    sanitizedBody.email
    && !validator.isEmail(sanitizedBody.email)
  ) {
    errors.push('Must be a valid email');
  }

  // Password isn't long enough
  if (
    eventBody.password
    && !validator.isLength(validator.trim(eventBody.password), { min: 6 })
  ) {
    errors.push('Password needs to be longer than 6 characters');
  }

  if (errors.length > 0) return Promise.reject(new Error(errors.toString()));
  return Promise.resolve();
}
