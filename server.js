const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

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
    joiningDate: String,
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

// ✅ Home Route - Display Employee List
app.get("/", async (req, res) => {
    try {
        const employees = await Employee.find();
        res.render("index", { employees });
    } catch (error) {
        res.status(500).send("❌ Error fetching employees");
    }
});

// ✅ Add New Employee Route
app.post("/add", upload.single("profilePicture"), async (req, res) => {
    try {
        const newEmployee = new Employee({
            name: req.body.name,
            email: req.body.email,
            position: req.body.position,
            salary: req.body.salary,
            jobLocation: req.body.jobLocation,
            phoneNumber: req.body.phoneNumber,
            joiningDate: req.body.joiningDate,
            profilePicture: req.file ? req.file.filename : "default.png"
        });

        await newEmployee.save();
        res.redirect("/");
    } catch (error) {
        res.status(500).send("❌ Error adding employee");
    }
});

// ✅ Show Profile Page
app.get("/profile/:id", async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).send("❌ Employee not found");

        res.render("profile", { employee });
    } catch (error) {
        res.status(500).send("❌ Error loading profile");
    }
});

// ✅ Edit Employee Page
app.get("/edit/:id", async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).send("❌ Employee not found");

        res.render("edit", { employee });
    } catch (error) {
        res.status(500).send("❌ Error loading edit page");
    }
});

// ✅ Update Employee Data
app.post("/update/:id", upload.single("profilePicture"), async (req, res) => {
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
            joiningDate: req.body.joiningDate,
            profilePicture: req.file ? req.file.filename : employee.profilePicture // Keep old image if no new one uploaded
        };

        await Employee.findByIdAndUpdate(req.params.id, updatedData);
        res.redirect("/");
    } catch (error) {
        res.status(500).send("❌ Error updating employee");
    }
});

// ✅ Delete Employee
app.get("/delete/:id", async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.redirect("/");
    } catch (error) {
        res.status(500).send("❌ Error deleting employee");
    }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
