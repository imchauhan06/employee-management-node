const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const Employee = require('./models/Employee');

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/employees', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Dummy Admin Login (Hardcoded)
const ADMIN = { email: "admin@example.com", password: "admin123" };

// Middleware to Check Login
function checkAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

// Login Page
app.get('/login', (req, res) => res.render('login', { message: "" }));
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN.email && password === ADMIN.password) {
    req.session.user = email;
    return res.redirect('/');
  }
  res.render('login', { message: "Invalid credentials" });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/', checkAuth, async (req, res) => {
  const employees = await Employee.find();
  res.render('index', { employees });
});


app.post('/add', checkAuth, async (req, res) => {
  await Employee.create(req.body);
  res.redirect('/');
});

app.get('/edit/:id', checkAuth, async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  res.render('edit', { employee });
});

// Update Employee
app.post('/update/:id', checkAuth, async (req, res) => {
  await Employee.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/');
});

// Delete Employee
app.post('/delete/:id', checkAuth, async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.redirect('/');
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
