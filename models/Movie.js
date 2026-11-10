const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String },
    director: { type: String },
    releaseYear: { type: Number },
    leadActors: { 
        type: [String],  
        default: []      
    },  
    genre: { 
        type: [String],  
        default: []      
    },
    watchStatus: { 
        type: String, 
        enum: ['To Watch', 'Watched'], 
        default: 'To Watch' 
    },
    audienceScore: { type: Number, min: 0, max: 10 },
    personalScore: { type: Number, min: 0, max: 10 },
    synopsis: { type: String },
    isArchived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);