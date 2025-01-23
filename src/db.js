const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://juangallegodeveloper:njE0agKeqAZW47ea@opa-cluster.u6icx.mongodb.net/?retryWrites=true&w=majority&appName=OPA-Cluster', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = mongoose;
