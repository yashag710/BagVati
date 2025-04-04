const mongoose = require('mongoose');

// Connecting to the MongoDB database
mongoose.connect("mongodb+srv://yashag1810:toweldone123@cluster07.duqh2lh.mongodb.net/eCommerce").then((x) => {
  console.log('Connected to the database');
}).catch((err) => {
  console.log(err);
  console.log('Error connecting to the database');
  process.exit(1);
});

module.exports = mongoose.connection;