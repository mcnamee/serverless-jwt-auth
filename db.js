const mongoose = require('mongoose');
let isConnected;

module.exports = connectToDatabase = () => {
  if (isConnected) Promise.resolve();
  return mongoose.connect(process.env.DB).then(db => isConnected = db.connections[0].readyState);
};
