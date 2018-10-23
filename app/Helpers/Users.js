const jwt = require('jsonwebtoken');
const sanitizer = require('validator');

const DB = require('../../db');
const TableName = process.env.TABLENAME_USERS;


/**
 * Create & Sign a JWT with the user ID for request auth
 * @param str id 
 */
module.exports.signToken = id => jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: 86400 });


/**
 * Does a given email exist as a user?
 * @param str email
 */
module.exports.userByEmail = email => DB.scan({
    TableName,
    FilterExpression : 'email = :email',
    ExpressionAttributeValues : {
      ':email': sanitizer.normalizeEmail(sanitizer.trim(email))
    },
  }).promise().then(res => (res && res.Items && res.Items[0]) ? res.Items[0] : null
  ).catch(err => null);


/**
 * Get a user by ID
 * @param str id
 */
module.exports.userById = id => DB.get({ TableName, Key: { id } }).promise()
  .then((res) => {
    // Return the user
    if (res && res.Item) {
      // We don't want the password shown to users
      if (res.Item.password) delete res.Item.password;
      return res.Item;
    }

    throw new Error('User not found');
  });
