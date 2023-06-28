// Import express and Handlebars module
const express = require('express')
const exphbs = require('express-handlebars')


/* Routes */
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')

var format = require('date-fns/format')
var formatDistanceToNow = require('date-fns/formatDistanceToNow')


/* Express config */
const app = express()
require('./models/index')
app.use(express.static('public'))   // define where static assets live

app.engine('hbs', exphbs.engine({   // configure Handlebars
    defaultlayout: 'main',
    extname: 'hbs',
    helpers: {
        dateFormat: x => {
            return format(x, 'dd/MM/yyyy')
        },
        hasReview: rate => {
            console.log("hasReview")
            return rate > 0  ? true : false
        },
        dateDifference: x => {
            return formatDistanceToNow(x,{addSuffix: true})
        },
    }
}))

app.set('view engine', 'hbs')       // set Handlebars view engine


/* Setting routes */
// For testing
app.get('/csstest', (req, res) => {
    res.render("csstest")
})
// For testing

app.use('/', userRouter)
app.use('/admin', adminRouter)
app.locals.loggedAs = global.loggedAs

// Tells the app to listen on port 3000 and logs that information to the console
app.listen(process.env.PORT || 3000, () => {

});
