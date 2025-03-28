require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const Employee = require('./models/Employee');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session Middleware
app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Set Storage for Profile Pictures
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Admin Credentials
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = bcrypt.hashSync("password", 10);

// Authentication Middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Login Page
app.get('/login', (req, res) => {
    res.render('login', { message: "" });
});

// Handle Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && bcrypt.compareSync(password, ADMIN_PASSWORD)) {
        req.session.user = email;
        return res.redirect('/');
    } else {
        return res.render('login', { message: "Invalid email or password!" });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Home Page - List Employees
app.get('/', requireAuth, async (req, res) => {
    const employees = await Employee.find();
    res.render('index', { employees });
});

// Add Employee
app.post('/add', requireAuth, upload.single('profilePicture'), async (req, res) => {
    try {
        const newEmployee = new Employee({
            name: req.body.name,
            email: req.body.email,
            position: req.body.position,
            profilePicture: req.file ? req.file.filename : "default.png",
            salary: req.body.salary,
            jobLocation: req.body.jobLocation,
            phoneNumber: req.body.phoneNumber,
            joiningDate: req.body.joiningDate
        });

        await newEmployee.save();
        res.redirect('/');
    } catch (error) {
        res.status(500).send("Error adding employee");
    }
});

// Edit Employee
app.get('/edit/:id', requireAuth, async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    res.render('edit', { employee });
});

app.post('/edit/:id', requireAuth, async (req, res) => {
    await Employee.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/');
});

// Delete Employee
app.get('/delete/:id', requireAuth, async (req, res) => {
    await Employee.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

// Show Profile Page
app.get('/profile/:id', requireAuth, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).send("Employee not found");
        }
        res.render('profile', { employee });
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
