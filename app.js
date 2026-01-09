const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const indexRouter = require('./routes/index');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session Config
app.use(session({
  secret: 'secret_key_D2_project',
  resave: false,
  saveUninitialized: true
}));

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/', indexRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});