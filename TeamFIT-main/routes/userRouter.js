// Import express
const express = require('express')

// Create our Router object
const userRouter = express.Router()

// Import Controller functions
const userController = require('../controllers/userController')


/* Routes to handle GET requests */
// homePage
userRouter.get('/', userController.renderHomePage)

// login
userRouter.get('/login', userController.renderLoginPage)
userRouter.get('/loginFailure', userController.renderLoginFailurePage)
//  logs u in and out (for testing only)
userRouter.get('/logint', userController.tempLogIn)
userRouter.get('/adminlogin', userController.tempAdminLogin)
userRouter.get('/logout', userController.renderLogout)

// book
userRouter.get('/book/:id', userController.renderBookPage)
userRouter.get('/book/',userController.renderBookNotFound)

//bookReview
userRouter.get('/book/:id/review', userController.renderReviewPage)
userRouter.get('/book/:id/addReview', userController.renderAddReviewPage)


// profilePage
userRouter.get('/profilePage', userController.renderOwnProfilePage)
userRouter.get('/profilePage/:id', userController.renderProfilePage)
userRouter.get('/addFriendSuccess/:id', userController.renderAddFriendSuccess)
userRouter.get('/removeFriendSuccess/:id', userController.renderRemoveFriendSuccess)
userRouter.get('/editProfile',userController.renderEditProfile)
userRouter.get('/editFavTagError', userController.renderFavTagError)
userRouter.get('/editFavBookError', userController.renderFavBookError)
// profilePageBookList
userRouter.get('/profileBookList', userController.renderOwnProfileBookListPage)
userRouter.get('/profileBookList/:id', userController.renderProfileBookListPage)
// friendList
userRouter.get('/friendList',userController.renderOwnFriendList)
userRouter.get('/friendList/:id',userController.renderFriendList)

// searchResults
userRouter.get('/searchResults', userController.renderSearchResultsPage)

// userSearchResults
userRouter.get('/userSearchResults', userController.renderUserSearchResultsPage)

// tagSearchResults
userRouter.get('/tagListPage', userController.renderTagListPage)

// tagPage
userRouter.get('/tagPage/:id', userController.renderTagPage)

// signup
userRouter.get('/signup', userController.renderSignupPage)
userRouter.get('/signupSuccess', userController.renderSignupSuccess)
userRouter.get('/signupFailure', userController.renderSignupFailure)

// recent section
userRouter.get('/recent', userController.renderRecentBooks)

// bookRequest
userRouter.get('/bookRequest', userController.renderBookRequest)
userRouter.get('/bookRequestSuccess', userController.renderBookRequestSuccess)

// help 
userRouter.get('/help', userController.renderHelpPage)

// Export the router
module.exports = userRouter
