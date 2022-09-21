const mongoClient = require('mongodb').MongoClient
const state = {
    db:null
}

module.exports.connect = function(done){
    // const url = 'mongodb://localhost:27017'
    const url = 'mongodb+srv://dbbookb1:1234567890@cluster0.zvt1vzn.mongodb.net/?retryWrites=true&w=majority'
    const dbname = 'bookcommercecloud'
    // const dbname = 'bookcommerce'
    
    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
    
}

module.exports.get=function(){
    return state.db
}