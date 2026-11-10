const Movie = require("../models/Movie.js");

// CREATE: Add a movie
module.exports.createMovie = (reqBody) => {
    return Movie.findOne({ title: reqBody.title, director: reqBody.director })
        .then((result) => {
            if (result != null) {
                return {
                    code: 400,
                    message: "Oops! Movie already exists in your watchlist.",
                    data: result
                };
            } else {
                let newMovie = new Movie({
                    title: reqBody.title,
                    director: reqBody.director,
                    releaseYear: reqBody.releaseYear,
                    leadActors: reqBody.leadActors,
                    genre: reqBody.genre,
                    watchStatus: reqBody.watchStatus || "To Watch",
                    audienceScore: reqBody.audienceScore,
                    personalScore: reqBody.personalScore,
                    synopsis: reqBody.synopsis
                });

                return newMovie.save().then((savedMovie, err) => {
                    if (err) {
                        return { code: 400, message: "There is a problem saving the movie." };
                    } else {
                        return {
                            code: 201,
                            message: `${reqBody.title.toUpperCase()} is now added to the watchlist!`,
                            data: savedMovie
                        };
                    }
                });
            }
        })
        .catch(err => {
            return { code: 500, message: "Internal Server Error." };
        });
};

// READ: Get all active (non-archived) movies
module.exports.getAllMovies = (fields) => {
    const projectedFields = fields ? fields.split(',').join(' ') : '';

    return Movie.find({ isArchived: false })
        .select(projectedFields)
        .then(result => {
            if (result.length == 0) {
                return { code: 200, message: "There are no movies in your active watchlist yet." };
            } else {
                return { code: 200, message: "Getting all movies. Success!", data: result };
            }
        })
        .catch(err => {
            return { code: 500, message: "Internal Server Error." };
        });
};

// READ: Get all ARCHIVED movies
module.exports.getArchivedMovies = () => {
    return Movie.find({ isArchived: true })
        .then(result => {
            if (result.length == 0) {
                return { code: 200, message: "There are no archived movies yet." };
            } else {
                return { code: 200, message: "SUCCESS: Getting all archived movies.", data: result };
            }
        })
        .catch(err => {
            return { code: 500, message: "Internal Server Error." };
        });
};

// READ: Get a specific movie
module.exports.getSpecificMovie = (movieId) => {
    return Movie.findById(movieId)
        .then((result, err) => {
            if (err || !result) {
                return { code: 404, message: "ERROR: Cannot find movie using that ID." };
            } else {
                return { code: 200, message: "SUCCESS: Movie Found.", data: result };
            }
        })
        .catch(err => {
            return { code: 500, message: "Internal Server Error." };
        });
};

// UPDATE: Update movie details (with personalScore rule)
module.exports.updateMovie = (movieId, reqBody) => {
    return Movie.findById(movieId)
        .then((movie) => {
            if (!movie) {
                return { code: 404, message: "ERROR: Movie not found." };
            }

            const isBecomingWatched = reqBody.watchStatus === "Watched";
            const isCurrentlyWatched = movie.watchStatus === "Watched";

            if (reqBody.personalScore !== undefined && !isCurrentlyWatched && !isBecomingWatched) {
                return {
                    code: 400,
                    message: "ERROR: You can only add a personal score if the movie is marked as 'Watched'."
                };
            }

            return Movie.findByIdAndUpdate(
                movieId,
                reqBody,
                { new: true, runValidators: true }
            ).then((updatedMovie) => {
                return { code: 200, message: "SUCCESS: Movie updated successfully.", data: updatedMovie };
            });
        })
        .catch(err => {
            return { code: 500, message: "Internal Server Error." };
        });
};

// ARCHIVE: Move a single movie to archive (Replaces Soft Delete)
module.exports.archiveMovie = (movieId) => {
    return Movie.findByIdAndUpdate(
        movieId,
        { isArchived: true },
        { new: true }
    ).then((result) => {
        if (!result) {
            return { code: 404, message: "ERROR: Failed to archive movie or movie not found." };
        } else {
            return { code: 200, message: "SUCCESS: Movie archived successfully.", data: result };
        }
    }).catch(err => {
        return { code: 500, message: "Internal Server Error." };
    });
};

// UNARCHIVE: Restore a single movie from archive
module.exports.unarchiveMovie = (movieId) => {
    return Movie.findByIdAndUpdate(
        movieId,
        { isArchived: false },
        { new: true }
    ).then((result) => {
        if (!result) {
            return { code: 404, message: "ERROR: Failed to unarchive movie or movie not found." };
        } else {
            return { code: 200, message: "SUCCESS: Movie unarchived successfully.", data: result };
        }
    }).catch(err => {
        return { code: 500, message: "Internal Server Error." };
    });
};

// HARD DELETE: Permanently remove from database
module.exports.hardDeleteMovie = (movieId) => {
    return Movie.findByIdAndDelete(movieId)
        .then((result) => {
            if (!result) {
                return { code: 404, message: "ERROR: Movie not found." };
            } else {
                return { code: 200, message: "SUCCESS: Movie permanently deleted from database.", data: result };
            }
        })
        .catch(err => {
            return { code: 500, message: "Internal Server Error." };
        });
};

// ARCHIVE WATCHED: Move all "Watched" movies to archive in one query
module.exports.archiveWatchedMovies = () => {
    return Movie.updateMany(
        { watchStatus: "Watched", isArchived: false },
        { isArchived: true }
    ).then((result) => {
        if (result.modifiedCount === 0) {
            return { code: 200, message: "No watched movies found to archive." };
        } else {
            return { code: 200, message: "SUCCESS: All watched movies archived.", data: result };
        }
    }).catch(err => {
        return { code: 500, message: "Internal Server Error." };
    });
};

// EXTRA: Analytics Aggregation
module.exports.getMovieStats = () => {
    return Movie.aggregate([
        { $match: { isArchived: false } },
        { $unwind: "$genre" },
        {
            $group: {
                _id: "$genre",
                totalMovies: { $sum: 1 },
                averageAudienceScore: { $avg: "$audienceScore" },
                averagePersonalScore: { $avg: "$personalScore" }
            }
        },
        { $sort: { totalMovies: -1 } }
    ]).then((result) => {
        if (!result || result.length === 0) {
            return { code: 200, message: "No stats available yet. Add some movies first." };
        } else {
            return { code: 200, message: "SUCCESS: Movie analytics retrieved.", data: result };
        }
    }).catch(err => {
        return { code: 500, message: "Internal Server Error." };
    });
};