require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const Employee = require('./models/Employee');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

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

// Home Page - List Employees
app.get('/', async (req, res) => {
    const employees = await Employee.find();
    res.render('index', { employees });
});

// Add Employee
app.post('/add', upload.single('profilePicture'), async (req, res) => {
    try {
        const newEmployee = new Employee({
            name: req.body.name,
            email: req.body.email,
            position: req.body.position,
            profilePicture: req.file ? req.file.filename : null,
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
app.get('/edit/:id', async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    res.render('edit', { employee });
});

app.post('/edit/:id', async (req, res) => {
    await Employee.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/');
});

// Delete Employee
app.get('/delete/:id', async (req, res) => {
    await Employee.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

// Show Profile Page
app.get('/profile/:id', async (req, res) => {
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
