const mongoose = require("mongoose");


const userPassSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    loginName: {
        type: String, 
        required: true
    },
    loginPass: {
        type: String,
        required: true
    }
})

const UserPassModel = mongoose.model('userPass', userPassSchema)

module.exports = UserPassModel