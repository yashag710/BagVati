const mongoose = require('mongoose');
const database = 'eCommerce';
// Connecting to the MongoDB database

console.log('Connecting to MongoDB at', process.env.MONGO_URI + database);

if(!process.env.MONGO_URI){
  console.log('MONGO_URI is not defined in environment variables');
  process.exit(1);
}
mongoose.connect(`${process.env.MONGO_URI}${database}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then((x) => {
  console.log('Connected to the database');
}).catch((err) => {
  console.log(err);
  console.log('Error connecting to the database');
  process.exit(1);
});

module.exports = mongoose.connection;