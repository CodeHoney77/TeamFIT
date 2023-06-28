const mongoose = require("mongoose");


const reviewSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "BookId",
        require: true
    },
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "userId",
        require: true
    },
    username: {
        type: String, 
        required: true, 
    },
    rating: {
        type: Number,
        require: true
    },
    reviewText: {
        type: String
    },
    timestamp: {
        type: Date,
        default: () => Date.now()
    }
})

const reviewModel = mongoose.model('review', reviewSchema)

module.exports = reviewModel