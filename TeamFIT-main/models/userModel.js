const mongoose = require("mongoose");

// const readStatusSchema = new mongoose.Schema({
//     bookId: {
//         type: mongoose.Types.ObjectId,
//         required: true
//     },
//     readStatus: {
//         "type": String,
//         "enum": ["noRead", "reading", "read", "willRead"],
//         required: true
//     }
// })
//     ******Changed made to the schema above****
//     readStatus: {
//         "type": String,
//         "enum": ["noRead", "reading", "completed", "plan toa read"],
//         required: true
//     }

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    userType: { 
        type: String, 
        enum: ["User", "Admin"], 
        required: true 
    },
    friends: [{
        type: mongoose.Types.ObjectId,
        ref: "userModel"
    }],
    image: {
        type: String
    },
    // reviews: [mongoose.Types.ObjectId],
    books: [{
        bookId: {
            type: mongoose.Types.ObjectId,
            ref: "bookModel",
            required: true
        },
        readStatus: {
            type: String,
            enum: ["notRead", "plan to read", "reading", "completed"],
            required: true
        },
        chaptersRead: {
            type: mongoose.Types.Decimal128
        },
        pagesRead: {
            type: mongoose.Types.Decimal128
        }
        
    }],
    bio: {
        type: String,
    },
    fav_genre: {
        tag_id: {
            type: mongoose.Types.ObjectId,
            ref: "tagModel"
        },
        tag_name: {
            type: String
        }
    },
    fav_book: {
        book_id: {
            type: mongoose.Types.ObjectId,
            ref: "bookModel"
        },
        book_name: {
            type: String
        }
    },
})

const UserModel = mongoose.model('user', userSchema)

module.exports = UserModel