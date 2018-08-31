const connectToDatabase = require('../../db');
const TaskModel = require('../TaskModel');
const TaskRequest = require('../Requests/Tasks');
const sanitizer = require('validator');

/**
 * GET /tasks
 * Return a list of all tasks
 * @param event 
 * @param context 
 * @return obj
 */
module.exports.list = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return connectToDatabase()
    .then(() => list(event.requestContext.authorizer.principalId))
    .then(tasks => ({
      statusCode: 200,
      body: JSON.stringify(tasks)
    })).catch(err => ({
      statusCode: err.statusCode || 500,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ message: err.message })
    }));
};

/**
 * Return a list of all tasks
 * @return arr 
 */
function list(userId) {
  return TaskModel.find({ userId })
    .then(tasks => !tasks ? Promise.reject('No tasks found.') : tasks)
    .catch(err => Promise.reject(new Error(err)));
}


/**
 * POST /task ----------------------------------------------------
 * Create New Task
 * @param event 
 * @param context 
 */
module.exports.create = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return connectToDatabase()
    .then(() => create(JSON.parse(event.body), event.requestContext.authorizer.principalId))
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
async function create(eventBody, userId) {
  const body = {
    userId,
    name: sanitizer.trim(eventBody.name),
  };

  return TaskRequest.create(body)
    .then(() => TaskModel.create(body));
}
