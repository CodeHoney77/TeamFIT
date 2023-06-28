const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Types.Decimal128,
        required: true
    },
    bookTitle: {
        type: String,
        required: true
    },
    author: {
        type: String, 
        required: true
    },
    description: {
        type: String,
        required: true
    },
    averageRating: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    chapters: {
        type: mongoose.Types.Decimal128,
        required: true
    },
    pages: {
        type: mongoose.Types.Decimal128,
        required: true
    },
    tags: [{
        tag_id: {
            type: mongoose.Types.ObjectId,
            ref: "tagModel"
        },
        tag_name: {
            type: String
        }
    }]
})

function tagLimit(val) {
    return val.length <= 3;
  }

const BookModel = mongoose.model('book', bookSchema)

module.exports = BookModel