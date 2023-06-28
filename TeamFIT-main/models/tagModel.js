const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema({
    tag: {
        type: String,
        required: true
    }
})

const TagModel = mongoose.model('tag', tagSchema)

module.exports = TagModel