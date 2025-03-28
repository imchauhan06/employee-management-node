const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();

// Database Connection
mongoose.connect("mongodb://127.0.0.1:27017/employeeDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected")).catch(err => console.log(err));

// Employee Schema
const employeeSchema = new mongoose.Schema({
    name: String,
    email: String,
    position: String,
    salary: Number,
    jobLocation: String,
    phoneNumber: String,
    joiningDate: String,
    profilePicture: String
});

const Employee = mongoose.model("Employee", employeeSchema);

// Middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer Storage for Profile Picture Upload
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Home Route
app.get("/", async (req, res) => {
    const employees = await Employee.find();
    res.render("index", { employees });
});

// Show Edit Page
app.get("/edit/:id", async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).send("Employee not found");
        res.render("edit", { employee });
    } catch (err) {
        res.status(500).send("Error loading employee");
    }
});

// ✅ FIXED: Update Employee Data Route
app.post("/update/:id", upload.single("profilePicture"), async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).send("Employee not found");

        // Prepare updated data
        const updatedData = {
            name: req.body.name,
            email: req.body.email,
            position: req.body.position,
            salary: req.body.salary,
            jobLocation: req.body.jobLocation,
            phoneNumber: req.body.phoneNumber,
            joiningDate: req.body.joiningDate,
            profilePicture: req.file ? req.file.filename : employee.profilePicture // Keep old image if no new one uploaded
        };

        await Employee.findByIdAndUpdate(req.params.id, updatedData);
        res.redirect("/");
    } catch (error) {
        res.status(500).send("Error updating employee");
    }
});

// Start Server
app.listen(3000, () => console.log("Server started on http://localhost:3000"));
