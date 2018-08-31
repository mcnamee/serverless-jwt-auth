const validator = require('validator');

/**
 * Create a new Task validation
 * @param obj eventBody - the user input
 */
module.exports.create = async (eventBody) => {
  const errors = [];

  // Name isn't long enough
  if (!validator.isLength(eventBody.name, { min: 2 })) {
    errors.push('Task name needs to longer than 2 characters');
  }

  if (errors.length > 0) return Promise.reject(new Error(errors.toString()));
  return Promise.resolve();
}
