/**
 * User Database Schema
 */
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
mongoose.model('Users', UserSchema);

module.exports = mongoose.model('Users');
