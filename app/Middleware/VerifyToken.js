const jwt = require('jsonwebtoken');

/**
 * Middleware for authorizing requests
 * @param event 
 * @param context 
 * @param callback 
 */
module.exports.auth = (event, context, callback) => {
  // Check header or url parameters or post parameters for token
  const token = event.authorizationToken;

  if (!token) return callback(null, 'Unauthorized');

  // Verifies secret and checks exp
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return callback(null, 'Unauthorized');

    // If everything is good, save to request for use in other routes
    return callback(null, generatePolicy(decoded.id, 'Allow', event.methodArn))
  });
};

/**
 * Generate the JWT Auth Policy
 * @param principalId 
 * @param effect 
 * @param resource 
 */
const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {};
  authResponse.principalId = principalId;

  if (effect && resource) {
    const statementOne = {
      'Action': 'execute-api:Invoke',
      'Effect': effect,
      'Resource': resource,
    };

    const policyDocument = {
      'Version': '2012-10-17',
      'Statement': [statementOne],
    };

    authResponse.policyDocument = policyDocument;
  }

  return authResponse;
}
