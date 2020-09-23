const express = require('express');
const connectDB = require('./config/db');
const app = express();
const path = require('path');
const publicPath = path.join(__dirname, '.', 'client/build');
//connect to database
connectDB();
//init middleware
app.use(express.json());

//Define route
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/users', require('./routes/api/users'));
// charger le serveur
app.use(express.static(publicPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

//Serve static assets in production
/*
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}
*/
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Le serveur a demarrer au port ${PORT}`));

/*
const express = require('express');
const connectDB = require('./config/db');

const app = express();
connectDB();

//Initialisation du middleware
app.use(express.json({
    extented: false
}));

app.get('/', (req, res) => res.send('Exécution API'));

// definir les routes
app.use('', require('./routes/api/auth'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/users', require('./routes/api/users'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Le serveur a demarrer sur le port ${PORT}`));
*/
