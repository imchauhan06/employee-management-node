const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    name: String,
    email: String,
    position: String,
    profilePicture: String,
    salary: Number,
    jobLocation: String,
    phoneNumber: String,
    birthDate: Date
});

module.exports = mongoose.model('Employee', EmployeeSchema);
