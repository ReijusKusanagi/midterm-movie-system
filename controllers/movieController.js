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

// READ: Get all active (non-deleted, non-archived) movies
module.exports.getAllMovies = (fields) => {
    const projectedFields = fields ? fields.split(',').join(' ') : '';

    return Movie.find({ isDeleted: false, isArchived: false }) // Checks both flags
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

            // RULE: Only allow personalScore if it's currently Watched OR becoming Watched
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

// SOFT DELETE: Mark record as deleted (deletedAt: Timestamp)
module.exports.softDeleteMovie = (movieId) => {
    return Movie.findByIdAndUpdate(
        movieId,
        { isDeleted: true, deletedAt: Date.now() },
        { new: true }
    ).then((result) => {
        if (!result) {
            return { code: 404, message: "ERROR: Failed to delete movie or movie not found." };
        } else {
            return { code: 200, message: "SUCCESS: Movie soft deleted successfully.", data: result };
        }
    }).catch(err => {
        return { code: 500, message: "Internal Server Error." };
    });
};

// RESTORE: Undo a soft delete - As per instructions
module.exports.restoreMovie = (movieId) => {
    return Movie.findByIdAndUpdate(
        movieId,
        { isDeleted: false, deletedAt: null },
        { new: true }
    ).then((result) => {
        if (!result) {
            return { code: 404, message: "ERROR: Failed to restore movie or movie not found." };
        } else {
            return { code: 200, message: "SUCCESS: Movie restored successfully.", data: result };
        }
    }).catch(err => {
        return { code: 500, message: "Internal Server Error." };
    });
};

// ARCHIVE WATCHED: Move all "Watched" movies to archive in a single query
module.exports.archiveWatchedMovies = () => {
    return Movie.updateMany(
        { watchStatus: "Watched", isArchived: false, isDeleted: false },
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

// READ: Get all ARCHIVED movies
module.exports.getArchivedMovies = () => {
    // Find movies that are archived, but NOT permanently soft-deleted
    return Movie.find({ isArchived: true, isDeleted: false }) 
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

// EXTRA (15 pts): Analytics Aggregation
module.exports.getMovieStats = () => {
    return Movie.aggregate([
        { $match: { isDeleted: false, isArchived: false } }, // Only active movies
        { $unwind: "$genre" }, // Flattens array for grouping
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

// Hard Delete (Permanently remove from database)
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