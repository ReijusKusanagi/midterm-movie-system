const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// Base route: /api/movies

// POST - Create a movie
router.post('/', (req, res) => {
    movieController.createMovie(req.body).then(result => res.status(result.code).send(result));
});

// GET - Fetch all active movies
router.get('/', (req, res) => {
    movieController.getAllMovies(req.query.fields).then(result => res.status(result.code).send(result));
});

// ⚠️ Specific routes MUST come BEFORE dynamic /:id routes

// GET - Analytics
router.get('/stats', (req, res) => {
    movieController.getMovieStats().then(result => res.status(result.code).send(result));
});

// GET - Fetch all archived movies
router.get('/archived', (req, res) => {
    movieController.getArchivedMovies().then(result => res.status(result.code).send(result));
});

// PATCH - Archive all "Watched" movies
router.patch('/archive-watched', (req, res) => {
    movieController.archiveWatchedMovies().then(result => res.status(result.code).send(result));
});

// GET - Fetch a specific movie by ID
router.get('/:id', (req, res) => {
    movieController.getSpecificMovie(req.params.id).then(result => res.status(result.code).send(result));
});

// PATCH / PUT - Update movie details
router.patch('/:id', (req, res) => {
    movieController.updateMovie(req.params.id, req.body).then(result => res.status(result.code).send(result));
});

router.put('/:id', (req, res) => {
    movieController.updateMovie(req.params.id, req.body).then(result => res.status(result.code).send(result));
});

// DELETE - Archive a movie
router.delete('/:id', (req, res) => {
    movieController.archiveMovie(req.params.id).then(result => res.status(result.code).send(result));
});

// PATCH - Unarchive a movie
router.patch('/:id/restore', (req, res) => {
    movieController.unarchiveMovie(req.params.id).then(result => res.status(result.code).send(result));
});

// DELETE - Hard delete a movie permanently
router.delete('/:id/hard', (req, res) => {
    movieController.hardDeleteMovie(req.params.id).then(result => res.status(result.code).send(result));
});

module.exports = router;