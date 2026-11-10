const express = require('express');
const mongoose = require('mongoose');
const movieRoutes = require('./routes/movieRoutes'); // Import routes

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect("[input mongodb connection string here]");
let db = mongoose.connection;
db.on("error", () => console.log("Cannot connect to MongoDB."));
db.once("open", () => console.log("You are now connected to MongoDB Atlas"));

// Routes
app.use('/api/movies', movieRoutes);

app.listen(port, () => console.log(`Server is running at port ${port}`));