module.exports.register = {
  type: 'object',
  properties: {
    body: {
      required: ['firstName', 'lastName', 'email', 'password'],
      type: 'object',
      properties: {
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 }
      }
    }
  }
}

module.exports.login = {
  type: 'object',
  properties: {
    body: {
      required: ['email', 'password'],
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }
    }
  }
}

module.exports.update = {
  type: 'object',
  properties: {
    body: {
      required: ['firstName', 'lastName', 'email'],
      type: 'object',
      properties: {
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 }
      }
    }
  }
}
