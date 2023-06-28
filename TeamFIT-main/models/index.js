if (process.env.NODE_ENV !== 'production') { 
    require('dotenv').config() 
} 
const mongoose = require('mongoose') 


mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    dbName: 'mbl-dtb' 
}) 

const dtb = mongoose.connection.on('error', err => { 
    console.error(err); 
    process.exit(1) 
}) 

dtb.once('open', async () => { 
    console.log(`Database online. ${dtb.host}:${dtb.port}`) 
}) 
require('./userModel')
require('./userPassModel')
require('./bookReqModel')
require('./bookModel')
require('./tagModel')