const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Session Setup
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true
}));

// ✅ Database Connection
mongoose.connect("mongodb://127.0.0.1:27017/employeeDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Employee Schema
const employeeSchema = new mongoose.Schema({
    name: String,
    email: String,
    position: String,
    salary: Number,
    jobLocation: String,
    phoneNumber: String,
    birthDate: String,
    profilePicture: String
});

const Employee = mongoose.model("Employee", employeeSchema);

// ✅ Middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Multer Storage for Profile Picture Upload
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ✅ Middleware to Protect Routes
function checkAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
}

// ✅ Login Page Route
app.get("/login", (req, res) => {
    res.render("login", { message: "" });
});

// ✅ Handle Login Authentication
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    // Replace this with actual database authentication
    if (email === "admin@example.com" && password === "password") {
        req.session.user = email; // Store user session
        res.redirect("/dashboard");
    } else {
        res.render("login", { message: "Invalid email or password" });
    }
});

// ✅ Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            res.redirect("/dashboard");
        } else {
            res.redirect("/login");
        }
    });
});

// ✅ Dashboard (Main Page - Protected)
app.get("/dashboard", checkAuth, async (req, res) => {
    try {
        const employees = await Employee.find();
        res.render("index", { employees });
    } catch (error) {
        res.status(500).send("❌ Error fetching employees");
    }
});

// ✅ Add Employee (Protected)
app.post("/add", checkAuth, upload.single("profilePicture"), async (req, res) => {
    try {
        const newEmployee = new Employee({
            name: req.body.name,
            email: req.body.email,
            position: req.body.position,
            salary: req.body.salary,
            jobLocation: req.body.jobLocation,
            phoneNumber: req.body.phoneNumber,
            birthDate: req.body.birthDate,
            profilePicture: req.file ? req.file.filename : "default.png"
        });

        await newEmployee.save();
        res.redirect("dashboard");
    } catch (error) {
        res.status(500).send("❌ Error adding employee");
    }
});

// ✅ Profile Page (Protected)
app.get("/profile/:id", checkAuth, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).send("❌ Employee not found");

        res.render("profile", { employee });
    } catch (error) {
        res.status(500).send("❌ Error loading profile");
    }
});

// ✅ Edit Employee Page (Protected)
app.get("/edit/:id", checkAuth, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).send("❌ Employee not found");

        res.render("edit", { employee });
    } catch (error) {
        res.status(500).send("❌ Error loading edit page");
    }
});

// ✅ Update Employee Data (Protected)
app.post("/update/:id", checkAuth, upload.single("profilePicture"), async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).send("❌ Employee not found");

        // Prepare updated data
        const updatedData = {
            name: req.body.name,
            email: req.body.email,
            position: req.body.position,
            salary: req.body.salary,
            jobLocation: req.body.jobLocation,
            phoneNumber: req.body.phoneNumber,
            birthDate: req.body.birthDate,
            profilePicture: req.file ? req.file.filename : employee.profilePicture
        };

        await Employee.findByIdAndUpdate(req.params.id, updatedData);
        res.redirect("/dashboard");
    } catch (error) {
        res.status(500).send("❌ Error updating employee");
    }
});

// ✅ Delete Employee (Protected)
app.get("/delete/:id", checkAuth, async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.redirect("/dashboard");
    } catch (error) {
        res.status(500).send("❌ Error deleting employee");
    }
});
// Redirect root URL ("/") to login page
app.get("/", (req, res) => {
    res.redirect("/login");
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
