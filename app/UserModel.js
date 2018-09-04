const mongoose = require('mongoose');
const validator = require('validator');

const model = mongoose.model('Users', {
  firstName: {
    type: String,
    required: [true, 'First Name is a required field'],
    validate: {
      validator: v => validator.isAlphanumeric(v),
      message: props => `${props.value} is not a valid first name`,
    },
  },
  lastName: {
    type: String,
    required: [true, 'Last Name is a required field'],
    validate: {
      validator: v => validator.isAlphanumeric(v),
      message: props => `${props.value} is not a valid last name`,
    },
  },
  email: {
    type: String,
    required: [true, 'Email is a required field'],
    validate: {
      validator: v => validator.isEmail(v),
      message: props => `${props.value} is not a valid email`,
    },
  },
  password: {
    type: String,
    required: [true, 'Password is a required field'],
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model;
