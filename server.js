const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Employee = require('./models/Employee');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/employees', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected')).catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', async (req, res) => {
  const employees = await Employee.find();
  res.render('index', { employees });
});

app.post('/add', async (req, res) => {
  const { name, email, position } = req.body;
  await Employee.create({ name, email, position });
  res.redirect('/');
});

app.post('/delete/:id', async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.redirect('/');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
