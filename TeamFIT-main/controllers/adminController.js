
const mongoose = require("mongoose")
const User = require("../models/userModel")
const Book = require("../models/bookModel")
const BookReq = require("../models/bookReqModel")
const Tag = require("../models/tagModel")


async function loadBooks() { if(global.books == undefined) { global.books = await Book.find().lean() } }

// Checks if user is logged in as admin
async function isAdmin() {
    if (global.loggedAs != undefined) {
        curUser = await User.findById(global.loggedAs)
        if (curUser.userType == 'Admin') {
            return true
        }
    }
    return false
}
function adminError(res) { res.redirect('/admin/redirect') }

// Checks if something was typed into the search bar.
function hasQuery(req) {
    if(req.query.s != undefined) { return true } return false
}
// Redirects user to the search results page with the query.
function redirectToSearchResults(req, res) { 
    var query = req.query.s
    res.redirect('/searchResults?s='+query)
}


async function createTag(tag) {
    const newTag = new Tag({
        tag: tag
    })

    newTag.save()
}

async function checkValidTag(tag) { 
    // Will return the tagId if found, otherwise returns -1
    var validTag = await Tag.find({"tag": tag}).lean()
    console.log(validTag)
    if(validTag.length > 0) {
        return validTag[0]._id
    }
    return -1
}

async function createBook(title, author, description, image, chapters, pages) {
    
    const newBook = new Book ({
        bookId: await Book.count(),
        bookTitle: title,
        author: author,
        description: description,
        averageRating: 10,
        image: image,
        chapters: chapters,
        pages: pages,
        tags: []
    })

    newBook.save()
    // Reload books database
    global.books = await Book.find().lean()
    return newBook
}












const renderAdminHomePage = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()
    var admin = await isAdmin()
    if (admin == false) {
        adminError(res)
        return
    }
    res.render("adminHome.hbs")
}

const renderAddBook = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()
    var admin = await isAdmin()
    if (admin == false) {
        adminError(res)
        return
    }
    if(req.query.bookTitle != undefined) {
  
        var newBook = await createBook(
            req.query.bookTitle, 
            req.query.bookAuthor, 
            req.query.bookDescription, 
            req.query.coverUrl,
            req.query.bookChapters, 
            req.query.bookPages
            )//req.query.image, 

        res.redirect("/book/"+newBook._id)    
        return
    }
    res.render("bookAdd.hbs")
}

const renderBookRequests = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()
    var admin = await isAdmin()
    if (admin == false) {
        adminError(res)
        return
    }

    BookReq.find({}).lean().exec(function(err, reqs){
        res.render('adminBookRequests.hbs', {requests: reqs})
    });
}

const removeBookRequest = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()
    var admin = await isAdmin()
    if (admin == false) {
        adminError(res)
        return
    }

    await BookReq.findByIdAndDelete(req.params.id)

    res.redirect('/admin/bookRequests')
}

const renderAdminRedirect = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()
    res.render("error.hbs", {
        error: "ONLY ADMINS CAN ACCESS THIS PAGE",
        redirect: "/"
    })
}

const renderRemoveBook = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()
    var admin = await isAdmin()
    if (admin == false) {
        adminError(res)
        return
    }

    if(req.query.ss != undefined) {
        var searchResults = [];
    
        Book.find({}).lean().exec(function(err, elements) {
            elements.forEach(element => {
                if(element.bookTitle.toLowerCase().includes(req.query.ss.toLowerCase())) {
                    searchResults.push(element);
                }    
            });
            res.render("removeBook.hbs", {
                books: searchResults,
                query: req.query.ss
            })
        });
    } else {
        res.redirect('/admin/removeBook?ss=')
    }    
}

const removeBook = async (req, res) => {
    await loadBooks()
    var admin = await isAdmin()
    if (admin == false) {
        adminError(res)
        return
    }

    await Book.findByIdAndDelete(req.params.id)

    res.redirect('/admin/removeBook?ss=')
}

const renderCreateTags = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()
    var admin = await isAdmin()
    if (admin == false) {
        adminError(res)
        return
    }

    if (req.query.newTag != undefined) {
        if (await checkValidTag(req.query.newTag) == -1) {
            console.log(req.query.newTag)
            createTag(req.query.newTag)
            res.redirect('/admin/createTagsSuccess')
        }
        else (
            res.redirect('/admin/createTagsFailure')
        )

    }

    res.render('createTags.hbs')
}

const renderCreateTagSuccess = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()

    res.render("success.hbs", {
        message: "Tag added successfully",
        redirect: "/admin/createTags"
    })
}

const renderCreateTagFailure = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()

    res.render("error.hbs", {
        error: "Tag already exists",
        redirect: "/admin/createTags"
    })
    
}

const renderAddTags = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()
    var admin = await isAdmin()
    if (admin == false) {
        adminError(res)
        return
    }

    if(req.query.ss != undefined) {
        var searchResults = [];
    
        Book.find({}).lean().exec(function(err, elements) {
            elements.forEach(element => {
                if(element.bookTitle.toLowerCase().includes(req.query.ss.toLowerCase())) {
                    searchResults.push(element);
                }    
            });
            res.render("addTags.hbs", {
                books: searchResults,
                query: req.query.ss
            })
        });
    } else {
        res.redirect('/admin/addTags?ss=')
    }    
}

const addTag = async (req, res) => {
    await loadBooks()
    var admin = await isAdmin()
    if (admin == false) {
        adminError(res)
        return
    }

    curBook = await Book.findById(mongoose.Types.ObjectId(req.params.id)).lean()

    if (req.query.addTag != undefined) {
        tagId = await checkValidTag(req.query.addTag)
        if (tagId != -1 && (curBook.tags.length < 3)) {
            curTag = await Tag.findById(tagId).lean()
            curBook.tags.push({
                tag_id: tagId,
                tag_name: curTag.tag
            })

            await Book.updateOne({_id: req.params.id}, 
                {
                    $set: {
                        tags: curBook.tags
                    }
                }
            )

            res.redirect("/admin/addTagSuccess")
        }
        else {
            res.redirect("/admin/addTagFailure")
        }
    }
}

const renderAddTagSuccess = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()

    res.render("success.hbs", {
        message: "Tag added successfully",
        redirect: "/admin/addTags?ss="
    })
}

const renderAddTagFailure = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 

    await loadBooks()

    res.render("error.hbs", {
        error: "Tag limit reached or tag doesnt exist",
        redirect: "/admin/addTags?ss="
    })
    
}

const resetTags = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 
    await loadBooks()
    
    var admin = await isAdmin()
    if (admin == false) {
        adminError(res)
        return
    }

    await Book.updateOne({_id: req.params.id}, 
        {
            $set: {
                tags: []
            }
        }
    )

    res.redirect("/admin/tagResetMessage")
}

const renderTagResetMessage = async (req, res) => {
    if(hasQuery(req)) { redirectToSearchResults(req, res); return } 
    await loadBooks()

    res.render("success.hbs", {
        message: "Tags reset successfully",
        redirect: "/admin/addTags?ss="
    })

}

module.exports = {
    renderAdminHomePage,
    renderAddBook,
    renderBookRequests,
    renderAdminRedirect,
    removeBookRequest,
    renderRemoveBook,
    removeBook,
    renderAddTags,
    renderCreateTags,
    renderCreateTagSuccess,
    renderCreateTagFailure,
    addTag,
    renderAddTagSuccess,
    renderAddTagFailure,
    renderTagResetMessage,
    resetTags
}