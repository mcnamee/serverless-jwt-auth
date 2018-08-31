/**
 * Task Database Schema
 */
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId: { type: String, default: '0' },
  name: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  dateCreated: { type: Date, default: Date.now },
  dateCompleted: Date
});
mongoose.model('Tasks', TaskSchema);

module.exports = mongoose.model('Tasks');
