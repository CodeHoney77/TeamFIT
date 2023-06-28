const mongoose = require("mongoose")
const User = require("../models/userModel")
const UserPass = require("../models/userPassModel")
const Book = require("../models/bookModel")
const Review = require("../models/reviewModel")
const BookReq = require("../models/bookReqModel")
const Tag = require("../models/tagModel")
const { LEGAL_TCP_SOCKET_OPTIONS } = require('mongodb')
const { updateOne } = require("../models/bookModel")

const bookStatusFormatter = {
    'noRead': {
        key: 'noRead',
        val: 'Not Reading'
    },
    'reading': {
        key: 'reading',
        val: 'Reading'
    },
    'completed': {
        key: 'completed',
        val: 'Completed'
    },
    'plan to read': {
        key: 'plan to read',
        val: 'Plan to Read'
    }
}
// Helper functions
function createUser(user, pass) {
    // Things you need to include:
    // in User model: username, userType,
    // in UserPass model: userId(from the User model), make loginName same as username, loginPass
    // Also data validation for username, pass. 
    // Encryption for password.

    const demoImage = "https://cdn-icons-png.flaticon.com/512/709/709699.png"
    const newUser = new User({
        username: user,
        userType: 'User',
        friends: [],
        image: demoImage,
        books: []
    })

    newUser.save()
    const newUserPass = new UserPass({
        userId: newUser._id,
        loginName: newUser.username,
        loginPass: pass
    })
    newUserPass.save()
    console.log("A new user has been created -------------------------")
    console.log(newUser)
    console.log("User login details ----------------------------------")
    console.log(newUserPass)
    
}

function createBookReq(username, bookTitle, author, description, coverUrl, chapters, pages) {
    const newBookReq = new BookReq({
        username: username,
        bookTitle: bookTitle,
        author: author,
        description: description,
        image: coverUrl,
        chapters: chapters,
        pages: pages,
        tags: []
    })
    newBookReq.save()

    console.log("A new book request has been created -------------------------")
    console.log(newBookReq)
}


function createReview(bookId, userId, username, rating, reviewText) {
    const newReview = new Review({
        bookId: bookId,
        userId: userId,
        username: username,
        rating: rating,
        reviewText: reviewText,
        timestamp: Date.now(),
    })
    newReview.save()

    console.log("A new review has been created -------------------------")
    console.log(newReview)
}

// Checks if something was typed into the search bar.
function hasQuery(req) {
    if(req.query.s != undefined) { return true } return false
}
// Redirects user to the search results page with the query.
function redirectToSearchResults(req, res) { 
    var query = req.query.s
    res.redirect('/searchResults?s='+query)
}

// Checks if user is logged in.
function isLoggedIn() { return global.loggedAs != undefined }
// Redirects user to the login page.
function redirectToLogin(res) { res.redirect('/login') }
function redirectToLoginFailure(res) { res.redirect('/loginFailure') }
function redirectToProfilePage(res) { res.redirect('/profilePage') } 
function enteredUserPass(req) { return req.query.username != undefined && req.query.password != undefined }
function enteredBookReq(req) {
    return req.query.bookTitle != undefined && req.query.bookAuthor != undefined && req.query.bookDescription != undefined &&
     req.query.coverUrl != undefined && req.query.bookChapters != undefined && req.query.bookPages != undefined
}
function enteredReview(req) {
    return req.query.reviewText != undefined && req.query.rating != undefined
}
async function loadBooks() { if(global.books == undefined) { global.books = await Book.find().lean() } }

async function loadReviews() { if(global.reviews == undefined) { global.reviews = await Review.find().lean() } }

async function checkValidTag(tag) { 
    // Will return the tagId if found, otherwise returns -1
    var validTag = await Tag.find({"tag": tag}).lean()
    if(validTag.length > 0) {
        return validTag[0]._id
    }
    return -1
}

async function checkValidBook(bookName) { 
    // Will return the bookId if found, otherwise returns -1
    var validBook = await Book.find({"bookTitle": bookName}).lean()
    if(validBook.length > 0) {
        return validBook[0]._id
    }
    return -1
}

async function checkValidUsername(username) { 
    // Will return the userId if found, otherwise returns -1
    var hasUsername = await UserPass.find({"loginName": username}).lean()
    if(hasUsername.length > 0) {
        return parseInt(hasUsername[0].userId)
    }
    return -1
}

// Render functions
const tempLogIn = (req, res) => {
    global.loggedAs = mongoose.Types.ObjectId('631f196c1ce3e7ff32df8931');
    res.redirect("/")
}

const tempAdminLogin = (req, res) => {
    global.loggedAs = mongoose.Types.ObjectId('631f427bb2eb9abdc0b14391');
    res.redirect("/")
}

const renderHomePage = async (req, res) => {
    await loadBooks()
    // Search redirect
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    const latestBooks = await Book.find().lean()

    res.render("homePage.hbs", {
        latest: latestBooks.reverse().slice(0,Math.min(await Book.count(), 20)),
    })
}


const renderLoginPage = async (req, res) => {
    await loadBooks()
    if(isLoggedIn()) { redirectToProfilePage(res); return }
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 
    
    // STILL NEED TO DO:
    // 1. ENCRYPT AND DECRYPT USERNAME AND PASSWORDS

    // 3. ADD A LOG OUT BUTTON

    // Check for username and password
    if(enteredUserPass(req)) {
        var queryUser = await UserPass.find({"loginName": req.query.username, "loginPass": req.query.password}).lean()
        
        if(queryUser.length > 0){
            global.loggedAs = queryUser[0].userId
            redirectToProfilePage(res)
            return
        }
        // Incorrect password, display error
        redirectToLoginFailure(res)
        return
    }
    res.render("login.hbs", {
        loggedAs: global.loggedAs
    })

}

const renderLoginFailurePage = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    if(enteredUserPass(req)) {
        // Retry the login when the login button is pressed
        res.redirect('/login?username='+req.query.username+'&password='+req.query.password)
        return
    }
    // Render failure page otherwise
    res.render("loginFailure.hbs")
}

const renderLogout = async (req, res) => {
    await loadBooks()
    global.loggedAs = undefined
    res.redirect('/')
}

const renderBookPage = async (req, res) => {
    var isHidden = "";
    let numberOfReviews = 0;
    curUser = await User.findById(global.loggedAs)
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    const book = await Book.findById(req.params.id).lean()
    //Found book
    console.log("book");
    console.log(book);
    const review = await Review.find({bookId: book._id}).lean()
    //Found Review
    console.log("review");
    console.log(review);
    numberOfReviews = review.length;
    console.log("no. of reviews");
    console.log(numberOfReviews);

    let totRating = 0
    let averageRating = 0
    for (let i = 0; i < review.length; i++) {
        const element = review[i];
        totRating = totRating + element.rating;
    }

    console.log("------------------------------------------------------------");
    console.log("Average Rating:");
    if (numberOfReviews > 0) {
        averageRating = parseInt(totRating / numberOfReviews);
    }
    console.log(averageRating);

    await Book.updateOne({_id:book},
        {
            $set: {
                averageRating: averageRating
            }
        }
    )

    if (book) {
        if(!isLoggedIn()) { 
            // Hide the add book to read list button
            isHidden = "isHidden"
            res.render("book.hbs", {
                book: book,
                isHidden: isHidden,
                numberOfReviews: numberOfReviews,
                avgRating: averageRating
            })
            return
        }

        var bookStatusDisplayOrder = bookStatusFormatter
        if(req.query.readStatus != undefined) {
            // The read status has been changed
            var readBook = false
            var i = 0
            // Looks through current user booksList and find if there is an entry
            for(let bookInfo of curUser.books) {
                if(bookInfo.bookId == req.params.id) {
                    readBook = true
                    break
                }
                i = i + 1
            }
            //If user set to completed then, auto complete all chapters and pages
            if(readBook){
                if(req.query.readStatus == "completed") {
                    curUser.books[i].chaptersRead = book.chapters
                    curUser.books[i].pagesRead = book.pages
                }
                curUser.books[i].readStatus = req.query.readStatus
            } else {
                // Add a new entry instead
                if(req.query.readStatus == "completed") {
                    curUser.books.push({
                        bookId: req.params.id,
                        readStatus: req.query.readStatus,
                        chaptersRead: book.chapters,
                        pagesRead: book.pages
                    })
                }
                else {
                    curUser.books.push({
                        bookId: req.params.id,
                        readStatus: req.query.readStatus,
                        chaptersRead: 0,
                        pagesRead: 0
                    })
                }
            }
            

            await User.updateOne({_id: loggedAs}, 
                {
                    $set: {
                        books: curUser.books
                    }
                }
            )
            bookStatusDisplayOrder = []
            bookStatusDisplayOrder.push(bookStatusFormatter[req.query.readStatus])
            for(let dispInfo in bookStatusFormatter) {
                if(dispInfo != req.query.readStatus) {
                    bookStatusDisplayOrder.push(bookStatusFormatter[dispInfo])
                }
            }
        } else {
            // no change in book status

            for(let userReadBook of curUser.books) {
                if(userReadBook.bookId == req.params.id) {
                    console.log("I've read this book")
                    bookStatusDisplayOrder = []
                    bookStatusDisplayOrder.push(bookStatusFormatter[userReadBook.readStatus])
                    for(let dispInfo in bookStatusFormatter) {
                        if(dispInfo != userReadBook.readStatus) {
                            bookStatusDisplayOrder.push(bookStatusFormatter[dispInfo])
                            
                        }
                    }
                    break
                }
            }
        
        }
        res.render("book.hbs", {
            book: book,
            readFuncStatus: bookStatusDisplayOrder,
            isHidden: isHidden,
            numberOfReviews: numberOfReviews,
            avgRating: averageRating
        })
    }
    else {
        res.redirect('/book/')
    }
}

const renderBookNotFound = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return }

    res.render("error.hbs", {
        error: "BOOK IS NOT FOUND",
        redirect: "/"
    })
}

const renderReviewPage = async (req, res) => {
    var isHidden = "";
    var revHidden = "";
    let numberOfReviews = 0;
    curUser = await User.findById(global.loggedAs)
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    const book = await Book.findById(req.params.id).lean()
    //Found book
    console.log("book");
    console.log(book);
    const review = await Review.find({bookId: book._id}).lean()
    //Found Review
    console.log("review");
    console.log(review);
    numberOfReviews = review.length;
    console.log("no. of reviews");
    console.log(numberOfReviews);

    let totRating = 0
    let averageRating = 0
    for (let i = 0; i < review.length; i++) {
        const element = review[i];
        totRating = totRating + element.rating;
    }

    console.log("------------------------------------------------------------");
    console.log("Average Rating:");
    if (numberOfReviews > 0) {
        averageRating = parseInt(totRating / numberOfReviews);
    }
    console.log(averageRating);

    await Book.updateOne({_id:book},
        {
            $set: {
                averageRating: averageRating
            }
        }
    )

    if (numberOfReviews == 0) {
        revHidden = "isHidden"
    }
    console.log("is hidden?: ");
    console.log(revHidden);


    if (book) {
        if(!isLoggedIn()) { 
            // Hide the add book to read list button
            isHidden = "isHidden"
            res.render("review.hbs", {
                book: book,
                isHidden: isHidden,
                review: review,
                revHidden: revHidden,
                numberOfReviews: numberOfReviews,
                avRating: averageRating
            })
            return
        }

        var bookStatusDisplayOrder = bookStatusFormatter
        if(req.query.readStatus != undefined) {
            // The read status has been changed
            var readBook = false
            var i = 0
            for(let bookInfo of curUser.books) {
                if(bookInfo.bookId == req.params.id) {
                    readBook = true
                    break
                }
                i = i + 1
            }
            if(readBook){
                if(req.query.readStatus == "completed") {
                    curUser.books[i].chaptersRead = book.chapters
                    curUser.books[i].pagesRead = book.pages
                }
                curUser.books[i].readStatus = req.query.readStatus
            } else {
                // Add a new entry instead
                if(req.query.readStatus == "completed") {
                    curUser.books.push({
                        bookId: req.params.id,
                        readStatus: req.query.readStatus,
                        chaptersRead: book.chapters,
                        pagesRead: book.pages
                    })
                }
                else {
                    curUser.books.push({
                        bookId: req.params.id,
                        readStatus: req.query.readStatus,
                        chaptersRead: 0,
                        pagesRead: 0
                    })
                }
            }
            

            await User.updateOne({_id: loggedAs}, 
                {
                    $set: {
                        books: curUser.books
                    }
                }
            )
            bookStatusDisplayOrder = []
            bookStatusDisplayOrder.push(bookStatusFormatter[req.query.readStatus])
            for(let dispInfo in bookStatusFormatter) {
                if(dispInfo != req.query.readStatus) {
                    bookStatusDisplayOrder.push(bookStatusFormatter[dispInfo])
                }
            }
        } else {
            // no change in book status

            for(let userReadBook of curUser.books) {
                if(userReadBook.bookId == req.params.id) {
                    console.log("I've read this book")
                    bookStatusDisplayOrder = []
                    bookStatusDisplayOrder.push(bookStatusFormatter[userReadBook.readStatus])
                    for(let dispInfo in bookStatusFormatter) {
                        if(dispInfo != userReadBook.readStatus) {
                            bookStatusDisplayOrder.push(bookStatusFormatter[dispInfo])
                            
                        }
                    }
                    break
                }
            }
        
        }
        res.render("review.hbs", {
            book: book,
            readFuncStatus: bookStatusDisplayOrder,
            isHidden: isHidden,
            review: review,
            revHidden: revHidden,
            numberOfReviews: numberOfReviews,
            avgRating: averageRating
        })
    }
    else {
        res.redirect('/book/')
    }
}

async function getBookStats (books) {
    var reading = 0
    var completed = 0
    var plan = 0

    for(let i of books) {
        curBook = await Book.findById(i.bookId).lean()
        if (curBook == null) {
            continue
        }

        if(i.readStatus == 'reading') {
            reading += 1
        } else if(i.readStatus == 'read') {
            completed += 1
        } else {
            plan += 1
        }
    }
    return {reading: reading,
            completed: completed,
            plan: plan}
}

const renderOwnProfilePage = async (req, res) => {
    console.log("--------------------------");
    console.log("renderingProfilePage");
    // This should render users own profile page when logged into their account
    // This version will have options to edit their profile page.
    await loadBooks()
    if(!isLoggedIn()) { redirectToLogin(res); return }
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 


    const userPage = await User.findById(global.loggedAs).lean()
    var stat = await getBookStats(userPage.books)
    friends = await User.find({_id: {$in: userPage.friends}}).lean()
    if (userPage.fav_book != null) {
        favBook = await Book.findById(userPage.fav_book.book_id).lean()
    }
    else {
        favBook = undefined
    }
    const review = await Review.find({userId: global.loggedAs}).sort({timestamp: -1}).lean()
    review.sort(function(x, y){
        return y.timestamp - x.timestamp;
    })
    //Found Review
    console.log("--------------------------");
    console.log("review");
    console.log(review);

    var outputList = []
    for (let rev of review) {
        let bookId = rev.bookId;
        ibook = await Book.findById(bookId).lean();
        let output = {
            review: rev,
            book: ibook
        }

        outputList.push(output);
    }

    console.log("--------------------------");
    console.log("outputList");
    console.log(outputList);
    console.log("outputList number");
    console.log(outputList.length);

    
    if (userPage) {
        res.render("profilePage.hbs", {
            user: userPage,
            friends: friends.sort(() => 0.5 - Math.random()).slice(0,Math.min(userPage.friends.length, 8)),
            stat: stat,
            output: outputList,
            favBook: favBook
        })
    }
    else {
        res.sendStatus(404)
    }


}

const renderProfilePage = async (req, res) => {
    // This should render general profile page of any viewer based on id.
    // This version should only be view-only and doesn't require login to view.
    await loadBooks()

    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 
    const userPage = await User.findById(mongoose.Types.ObjectId(req.params.id)).lean()
    const curUser = await User.findById(global.loggedAs)
    var stat = await getBookStats(userPage.books)
    friends = await User.find({_id: {$in: userPage.friends}}).lean()
    if (userPage.fav_book != null) {
        favBook = await Book.findById(userPage.fav_book.book_id).lean()
    }


    // Redirect to user's own profile page if the user is logged in
    if(isLoggedIn()) {
        if (curUser._id == req.params.id) {
            res.redirect("/profilePage")
        }
    }

    // Add user as friend
    if(req.query.af != undefined && req.query.af == "y") {
        if(!isLoggedIn()) { redirectToLogin(res); return }

        if (curUser.friends.includes(req.params.id) == false ) {
            console.log("Added Friend")
            curUser.friends.push(req.params.id)
            console.log(curUser.friends)
        }


        // Update mongo
        await User.updateOne({_id: loggedAs}, 
            {
                $set: {
                    friends: curUser.friends
                }
            }
        )
        
        res.redirect('/addFriendSuccess/' + req.params.id)
    }

    // Remove user as friend
    if(req.query.rf != undefined && req.query.rf == "y") {
        if(!isLoggedIn()) { redirectToLogin(res); return }

        if (curUser.friends.includes(req.params.id) == true ) {
            console.log("Deleted Friend")
            for( var i = 0; i < curUser.friends.length; i++){ 
                if ( curUser.friends[i] == req.params.id) { 
                    curUser.friends.splice(i, 1); 
                }  
            }
            console.log(curUser.friends)
        }
        
        // Update mongo
        await User.updateOne({_id: loggedAs}, 
            {
                $set: {
                    friends: curUser.friends
                }
            }
        )

        res.redirect('/removeFriendSuccess/' + req.params.id)
    }

    if (userPage) {
        res.render("profilePageReadOnly.hbs", {
            user: userPage,
            stat: stat,
            friends: friends.sort(() => 0.5 - Math.random()).slice(0,Math.min(userPage.friends.length, 8)),
            id: req.params.id,
            favBook: favBook
        })
    }
    else {
        res.sendStatus(404)
    }
}

const renderSearchResultsPage = async (req, res) => {
    await loadBooks()
    if(req.query.s != undefined) {
        var searchResults = [];
    
        Book.find({}).lean().exec(function(err, elements) {
            elements.forEach(element => {
                if(element.bookTitle.toLowerCase().includes(req.query.s.toLowerCase())) {
                    searchResults.push(element);
                }    
            });
            res.render("searchResults.hbs", {
                books: searchResults,
                query: req.query.s
            })
        });
    } else {
        res.redirect('/')
    }
    
}

const renderSignupPage = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    // Check for username and password
    if(enteredUserPass(req)) {
        // Username is not already in database. Create new user
        // Also check for data validity  STILL NEED TO DO
        if(await checkValidUsername(req.query.username) == -1) {
            createUser(req.query.username, req.query.password)
            
            res.redirect('/signupSuccess')
            return
        }
        // Username is already taken, display error message
        res.redirect('/signupFailure')
        return
    }

    res.render('signup.hbs')
}

const renderSignupSuccess = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    res.render("success.hbs", {
        message: "Signup Successful!",
        redirect: "/login"
    })
}

const renderSignupFailure = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    // Retry signup
    if(enteredUserPass(req)) {
        // Username is not already in database. Create new user
        if(await checkValidUsername(req.query.username) == -1) {
            createUser(req.query.username, req.query.password)
            
            res.redirect('/signupSuccess')
            return
        }
        // Username is already taken, display error message
        res.redirect('/signupFailure')
        return
    }

    res.render('signupFailure.hbs')
}

const renderRecentBooks = async (req, res) => {
    await loadBooks()
    // Search redirect
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    // Change the recent books (these are temporary)
    let tempRecent = global.books.slice(0, Math.min(await Book.count(), 6))
    res.render("recent.hbs", {
        recent: tempRecent 
    })
}

const renderBookRequest = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 
    if(isLoggedIn() == false) { redirectToLogin(res); return}

    curUser = await User.findById(global.loggedAs)

    if(enteredBookReq(req)) {
        createBookReq(
            curUser.username,
            req.query.bookTitle, 
            req.query.bookAuthor, 
            req.query.bookDescription, 
            req.query.coverUrl,
            req.query.bookChapters, 
            req.query.bookPages)
        res.redirect('/bookRequestSuccess')
    }

    res.render('bookRequest.hbs')
}

const renderBookRequestSuccess = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 
    
    res.render("success.hbs", {
        message: "Book Request Sucessful!",
        redirect: "/bookRequest"
    })
}

const renderOwnProfileBookListPage = async(req, res) =>{
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 
    if(isLoggedIn() == false) { redirectToLogin(res); return}
    var curUser = await User.findById(global.loggedAs)
    var outputList = []
    for(let curr of curUser.books) {
        if(curr.readStatus == "noRead") {
            continue;
        }
        let output = {
            readStatus: curr.readStatus,
            chaptersRead: curr.chaptersRead,
            pagesRead: curr.pagesRead,
            bookInfo: {}
        }

        output.bookInfo = await Book.findById(curr.bookId).lean()
        if (output.bookInfo != null) {
            outputList.push(output)
        }
    }
    if(Object.keys(req.query).length > 0) {
        var query_params = Object.keys(req.query)[0].split("_")
        if(query_params[0] != undefined) {
            var bookId = query_params[1]
            var newBookChapters = req.query["newChapterNumber_"+bookId]
            var newBookPages = req.query["newPageNumber_"+bookId]

            for(let curr of curUser.books) {
                if(curr.bookId == bookId) {
                    if (newBookChapters != null) {
                        curr.chaptersRead = newBookChapters
                    }
                    
                    if (newBookPages != null) {
                        curr.pagesRead = newBookPages
                    }

                    break
                }
            }
            
            // Update mongo
            await User.updateOne({_id: loggedAs}, 
                {
                    $set: {
                        books: curUser.books
                    }
                }
            )



            console.log("Updated book progress!")
        }
        res.redirect('.')
        return
    }
    res.render("profileBookListView.hbs", {
        books: outputList
    })
}

const renderProfileBookListPage = async(req, res) =>{
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    const curUser = await User.findById(mongoose.Types.ObjectId(req.params.id)).lean()
    var outputList = []

    // Redirect to user's own booklist if the user is logged in
    if(isLoggedIn()) {
        if (global.loggedAs == req.params.id) {
            res.redirect("/profileBookList")
        }
    }

    for(let curr of curUser.books) {
        if(curr.readStatus == "noRead") {
            continue;
        }
        let output = {
            readStatus: curr.readStatus,
            chaptersRead: curr.chaptersRead,
            pagesRead: curr.pagesRead,
            bookInfo: {}
        }

        output.bookInfo = await Book.findById(curr.bookId).lean()
        if (output.bookInfo != null) {
            outputList.push(output)
        }
    }
    
    res.render("profileBookListViewReadOnly.hbs", {
        user: curUser,
        books: outputList
    })
}

const renderUserSearchResultsPage = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    if(req.query.u != undefined) {
        var searchResults = [];
    
        User.find({}).lean().exec(function(err, elements) {
            elements.forEach(element => {
                if(element.username.toLowerCase().includes(req.query.u.toLowerCase())) {
                    searchResults.push(element);
                }    
            });
            res.render("userSearchResults.hbs", {
                users: searchResults,
                query: req.query.u
            })
        });
    } else {
        res.redirect('/')
    }
    
}

const renderEditProfile = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 
    if(isLoggedIn() == false) { redirectToLogin(res); return}

    const curUser = await User.findById(global.loggedAs).lean()

    if(req.query.dpfp != undefined && req.query.dpfp == "y") {
        await User.updateOne({_id: global.loggedAs}, 
            {
                $set: {
                    image: ""
                }
            }
        )
        res.redirect('/editProfile')
    }

    if (req.query.bio != undefined || req.query.imageUrl != undefined || req.query.favGenre != undefined) {
        if(req.query.bio != undefined) {
            await User.updateOne({_id: global.loggedAs}, 
                {
                    $set: {
                        bio: req.query.bio
                    }
                }
            )
        }

        if(req.query.imageUrl != undefined && req.query.imageUrl != "") {
            await User.updateOne({_id: global.loggedAs}, 
                {
                    $set: {
                        image: req.query.imageUrl
                    }
                }
            )
        }

        if(req.query.favGenre != undefined) {
            tagId = await checkValidTag(req.query.favGenre)
            if (tagId != -1) {
                await User.updateOne({_id: global.loggedAs},
                    {
                        $set: {
                            fav_genre: {
                                tag_id: tagId, 
                                tag_name: req.query.favGenre
                            }
                        }
                    }
                )
            }
        }
        if(req.query.favBook != undefined) {
            bookId = await checkValidBook(req.query.favBook)
            if (bookId != -1) {
                await User.updateOne({_id: global.loggedAs},
                    {
                        $set: {
                            fav_book: {
                                book_id: bookId, 
                                book_name: req.query.favBook
                            }
                        }
                    }
                )
            }
        }
        if (tagId == -1) {
            res.redirect('/editFavTagError')
        }
        else if (bookId == -1) {
            res.redirect('/editFavBookError')
        }
        else {
            res.redirect('/profilePage')
        }
    }

    res.render('editProfile.hbs', {
        user: curUser
    })
}

const renderAddFriendSuccess = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 
    
    res.render("success.hbs", {
        message: "User added as friend!",
        redirect: "/profilePage/" + req.params.id
    })
}

const renderRemoveFriendSuccess = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 
    
    res.render("success.hbs", {
        message: "User removed from friends!",
        redirect: "/profilePage/" + req.params.id
    })
}

const renderFavTagError = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()

    res.render("error.hbs", {
        error: "Tag doesn't exist",
        redirect: "/editProfile"
    })

}

const renderFavBookError = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()

    res.render("error.hbs", {
        error: "Book doesn't exist",
        redirect: "/editProfile"
    })

}

const renderFriendList = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return }

    const curUser = await User.findById(req.params.id).lean()
    friends = await User.find({_id: {$in: curUser.friends}}).lean()

    // Redirect to user's own friendlist if the user is logged in
    if(isLoggedIn()) {
        if (global.loggedAs == req.params.id) {
            res.redirect("/friendList")
        }
    }

    
    if (curUser) {
        res.render("friendListReadOnly.hbs", {
            user: curUser,
            friends: friends
        })
    }
    else {
        res.sendStatus(404)
    }
}

const renderOwnFriendList = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return }
    if(isLoggedIn() == false) { redirectToLogin(res); return}

    const curUser = await User.findById(global.loggedAs).lean()
    friends = await User.find({_id: {$in: curUser.friends}}).lean()

    // Remove user as friend
    if(req.query.id != undefined && req.query.rf == "y") {
        if(!isLoggedIn()) { redirectToLogin(res); return }


        for( var i = 0; i < curUser.friends.length; i++){ 
            if ( curUser.friends[i] == req.query.id) { 
                curUser.friends.splice(i, 1); 
            }  
        }
        
        // Update mongo
        await User.updateOne({_id: loggedAs}, 
            {
                $set: {
                    friends: curUser.friends
                }
            }
        )

        res.redirect('/friendList')
    }

    if (curUser) {
        res.render("friendList.hbs", {
            user: curUser,
            friends: friends
        })
    }
    else {
        res.sendStatus(404)
    }

}

const renderHelpPage=async(req, res)=>{
    await loadBooks()
    res.render("help.hbs")
}

const renderTagListPage = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return }

    if(req.query.ts != undefined) {
        var searchResults = [];
    
        Tag.find({}).lean().exec(function(err, elements) {
            elements.forEach(element => {
                if(element.tag.toLowerCase().includes(req.query.ts.toLowerCase())) {
                    searchResults.push(element);
                }
            });
            res.render("tagListPage.hbs", {
                tags: searchResults,
                query: req.query.ts
            })
        });
    } else {
        res.redirect('/')
    }
}
   
const renderTagPage = async (req, res) => {
    await loadBooks()
    if(hasQuery(req)) { redirectToSearchResults(req, res); return }

    curTag = await Tag.findById(mongoose.Types.ObjectId(req.params.id)).lean()
    Book.find({}).lean().exec(function(err, elements) {
        booksWithTag = []
        elements.forEach(element => {
            if (element.tags != undefined) {
                element.tags.forEach(tag => {
                    console.log(tag)
                    if(tag.tag_name == curTag.tag) {
                        booksWithTag.push(element);
                        console.log(booksWithTag)
                    }
                })
            }
        });

        res.render("tagPage.hbs", {
            tag: curTag,
            books: booksWithTag
        })
    });

    
}

const renderAddReviewPage = async (req, res) => {
    // This should render general profile page of any viewer based on id.
    // This version should only be view-only and doesn't require login to view.
    if(!isLoggedIn()) { redirectToLogin(res); return }
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    console.log("loading addreview page")
    await loadBooks()

    const bookId = req.params.id
    curUser = await User.findById(global.loggedAs)
    const book = await Book.findById(bookId).lean()
    //Found book
    console.log("Found book");
    console.log(book.bookTitle);
    console.log("Found user");
    console.log(curUser.username);

    if(enteredReview(req)) {
        createReview(
            book._id,
            curUser,
            curUser.username,
            req.query.rating,
            req.query.reviewText)

        //Update book status for current user
        // Looks through current user booksList and find if there is an entry
        if(req.query.readingStatus != null) {
            console.log("Updating book status for user")
            var newBookChapters = req.query["newChapterNumber"]
            var newBookPages = req.query["newPageNumber"]
            var readBook = false
            for(let bookInfo of curUser.books) {
                if(bookInfo.bookId == bookId) {
                    console.log("found that user have this book")
                    readBook = true
                    if (newBookChapters != null) {
                        bookInfo.chaptersRead = newBookChapters
                    }
                    console.log("Updated chapters read")

                    if (newBookPages != null) {
                        bookInfo.pagesRead = newBookPages
                    }
                    console.log("Updated pages read")

                    bookInfo.readStatus = req.query.readStatus
                    console.log("Updated read status")

                    //If user set to completed then, auto complete all chapters and pages
                    if(req.query.readStatus == "completed") {
                        bookInfo.chaptersRead = book.chapters
                        bookInfo.pagesRead = book.pages
                        console.log("auto complete the book")
                    }
                }
            }
            //no entry found
            if(!readBook) {
                // Add a new entry instead
                if(req.query.readStatus == "completed") {
                    curUser.books.push({
                        bookId: req.params.id,
                        readStatus: req.query.readStatus,
                        chaptersRead: book.chapters,
                        pagesRead: book.pages
                    })
                    console.log("Created new entry for complete")
                }
                else {
                    curUser.books.push({
                        bookId: req.params.id,
                        readStatus: req.query.readStatus,
                        chaptersRead: newBookChapters,
                        pagesRead: newBookPages
                    })
                    console.log("Created new entry for non-complete")
                }
            }

        }
        res.redirect('/book/'+bookId+'/review')
    }

    await User.updateOne({_id: loggedAs}, 
        {
            $set: {
                books: curUser.books
            }
        }
    )
    // Shows the add review page
    if(book) {
        if (isLoggedIn()) {
            res.render("addReview.hbs", {
                user:curUser,
                book:book
            })
        }
    }
    else {
        res.sendStatus(404)
    }
}





module.exports = {
    tempLogIn,
    tempAdminLogin,
    renderHomePage,
    renderLoginPage,
    renderLoginFailurePage,
    renderLogout,
    renderBookPage,
    renderProfilePage,
    renderOwnProfilePage,
    renderSearchResultsPage,
    renderSignupPage,
    renderSignupSuccess,
    renderSignupFailure,
    renderReviewPage,
    renderRecentBooks,
    renderBookRequest,
    renderBookRequestSuccess,
    renderProfileBookListPage,
    renderOwnProfileBookListPage,
    renderHelpPage,
    renderUserSearchResultsPage,
    renderEditProfile,
    renderAddFriendSuccess,
    renderRemoveFriendSuccess,
    renderFriendList,
    renderOwnFriendList,
    renderTagListPage,
    renderTagPage,
    renderFavTagError,
    renderFavBookError,
    renderBookNotFound,
    renderAddReviewPage
}
