const bcrypt = require('bcryptjs-then');
const validator = require('validator');
// const UserModel = require('../UserModel');

/**
 * Register user validation
 * @param obj eventBody - the user input
 */
module.exports.create = async (eventBody) => {
  const errors = [];

  // Name isn't long enough
  if (!validator.isLength(eventBody.firstName, { min: 4 })) {
    errors.push('First Name needs to longer than 4 characters');
  }
  if (!validator.isLength(eventBody.lastName, { min: 4 })) {
    errors.push('Last Name needs to longer than 4 characters');
  }

  // Isn't valid email format
  if (!validator.isEmail(eventBody.email)) {
    errors.push('Must be a valid email');
  }

  // User already exists
  // const user = await UserModel.findOne({ email: eventBody.email });
  // if (user) {
  //   errors.push('User with that email exists');
  // }

  // Password isn't long enough
  if (!validator.isLength(eventBody.password, { min: 6 })) {
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
  console.log(eventBody);
  console.log(user);
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
