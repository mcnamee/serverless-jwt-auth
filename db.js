const mongoose = require('mongoose');
let isConnected;

module.exports = connectToDatabase = () => {
  if (isConnected) {
    console.log('=> using existing database connection');
    return Promise.resolve();
  }

  console.log('=> using new database connection');
  return mongoose.connect(process.env.DB) // keep the connection string in an env var
    .then(db => { 
      isConnected = db.connections[0].readyState;
    });
};
