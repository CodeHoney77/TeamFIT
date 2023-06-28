const mongoose = require("mongoose");

const bookReqSchema = new mongoose.Schema({
    username: {
        type: String,
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
    tags: [String]
})

const BookReqModel = mongoose.model('bookReq', bookReqSchema)

module.exports = BookReqModel