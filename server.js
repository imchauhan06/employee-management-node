const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// ✅ Fix: Mongoose Strict Query Warning
mongoose.set("strictQuery", false);

// ✅ Connect to MongoDB
mongoose
    .connect("mongodb://127.0.0.1:27017/employeeDB", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

// ✅ Define Employee Schema
const employeeSchema = new mongoose.Schema({
    name: String,
    email: String,
    position: String,
    profilePicture: String,
});

const Employee = mongoose.model("Employee", employeeSchema);

// ✅ Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Multer Configuration (For File Upload)
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// ✅ Home Route - Fetch All Employees
app.get("/", async (req, res) => {
    try {
        const employees = await Employee.find();
        console.log("Fetched Employees:", employees); // Debugging
        res.render("index", { employees });
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).send("Error fetching employees");
    }
});

// ✅ Add Employee with Profile Picture
app.post("/add", upload.single("profilePicture"), async (req, res) => {
    try {
        const { name, email, position } = req.body;
        const profilePicture = req.file ? req.file.filename : "default.png";

        const newEmployee = new Employee({ name, email, position, profilePicture });
        await newEmployee.save();

        console.log("Employee Added:", newEmployee);
        res.redirect("/");
    } catch (error) {
        console.error("Error adding employee:", error);
        res.status(500).send("Error adding employee");
    }
});

// ✅ Edit Employee
app.get("/edit/:id", async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        res.render("edit", { employee });
    } catch (error) {
        console.error("Error fetching employee for edit:", error);
        res.status(500).send("Error fetching employee for edit");
    }
});

// ✅ Delete Employee
app.post("/delete/:id", async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        console.log("Employee Deleted:", req.params.id);
        res.redirect("/");
    } catch (error) {
        console.error("Error deleting employee:", error);
        res.status(500).send("Error deleting employee");
    }
});

// ✅ Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
