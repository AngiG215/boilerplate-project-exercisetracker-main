const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Borra las opciones antiguas, Mongoose 8 ya no las necesita
mongoose.connect(process.env.MONGO_URI);
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
  console.log("Conectado con éxito a la base de datos");
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now } // Mejorado con default
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users', async (req, res) => {
  try {
    const userObj = new User({ username: req.body.username });
    const user = await userObj.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.json({ error: "Could not save user" });
  }
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('username _id');
  res.json(users);
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  
  try {
    const user = await User.findById(id);
    if (!user) return res.json({ error: "Usuario no encontrado" });

    let filter = { user_id: id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date['$gte'] = new Date(from);
      if (to) filter.date['$lte'] = new Date(to);
    }

    let exercises = await Exercise.find(filter).limit(+limit || 1000);

    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log
    });
  } catch (err) {
    res.json({ error: "Error al obtener los logs" });
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.json({ error: "Usuario no encontrado" });

    const exerciseObj = new Exercise({
      user_id: id,
      description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date()
    });

    const exercise = await exerciseObj.save();
    
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    });
  } catch (err) {
    res.json({ error: "Error al guardar ejercicio" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
