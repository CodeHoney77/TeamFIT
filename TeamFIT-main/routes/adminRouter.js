// Import express
const express = require('express')

// Create our Router object
const adminRouter = express.Router()

// Import Controller functions
const adminController = require('../controllers/adminController')

/* Routes to handle GET requests */
// admin homePage
adminRouter.get('/', adminController.renderAdminHomePage)

adminRouter.get('/bookAdd', adminController.renderAddBook)
// admin bookRequests
adminRouter.get('/bookRequests', adminController.renderBookRequests)
adminRouter.get('/removeBookReq/:id', adminController.removeBookRequest)

// admin redirect
adminRouter.get('/redirect', adminController.renderAdminRedirect)

// admin removeBook
adminRouter.get('/removeBook', adminController.renderRemoveBook)
adminRouter.get('/deleteBook/:id', adminController.removeBook)

// admin add tags
adminRouter.get('/addTags', adminController.renderAddTags)
adminRouter.get('/addTags/:id', adminController.addTag)
adminRouter.get('/addTagSuccess', adminController.renderAddTagSuccess)
adminRouter.get('/addTagFailure', adminController.renderAddTagFailure)
adminRouter.get('/resetTags/:id', adminController.resetTags)
adminRouter.get('/tagResetMessage', adminController.renderTagResetMessage)

// admin create tags
adminRouter.get('/createTags', adminController.renderCreateTags)
adminRouter.get('/createTagsSuccess', adminController.renderCreateTagSuccess)
adminRouter.get('/createTagsFailure', adminController.renderCreateTagFailure)

// Export the router
module.exports = adminRouter
