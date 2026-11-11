const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

router.post('/', (req, res) => {
    movieController.createMovie(req.body).then(result => res.status(result.code).send(result));
});

router.get('/', (req, res) => {
    movieController.getAllMovies(req.query.fields).then(result => res.status(result.code).send(result));
});

router.get('/stats', (req, res) => {
    movieController.getMovieStats().then(result => res.status(result.code).send(result));
});

router.post('/archive-watched', (req, res) => {
    movieController.archiveWatchedMovies().then(result => res.status(result.code).send(result));
});

// GET - Fetch all archived movies
router.get('/archived', (req, res) => {
    movieController.getArchivedMovies().then(result => res.status(result.code).send(result));
});

// Restore route
router.patch('/:id/restore', (req, res) => {
    movieController.restoreMovie(req.params.id).then(result => res.status(result.code).send(result));
});

router.get('/:id', (req, res) => {
    movieController.getSpecificMovie(req.params.id).then(result => res.status(result.code).send(result));
});

router.patch('/:id', (req, res) => {
    movieController.updateMovie(req.params.id, req.body).then(result => res.status(result.code).send(result));
});

// Soft Delete route
router.delete('/:id', (req, res) => {
    movieController.softDeleteMovie(req.params.id).then(result => res.status(result.code).send(result));
});

// Hard Delete route (Extra feature and really just to clear the database with)
router.delete('/:id/hard', (req, res) => {
    movieController.hardDeleteMovie(req.params.id).then(result => res.status(result.code).send(result));
});

module.exports = router;