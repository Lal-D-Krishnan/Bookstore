let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
var cors = require('cors');
//let fileUpload=require('express-fileupload')
const oneDay = 120000000000000000;
let Handlebars = require('handlebars');

let userRouter = require('./routes/users');
let adminRouter = require('./routes/admin');
let hbs = require('express-handlebars')
let app = express();
//let fileUpload=require('express-fileupload')
let db=require('./config/connection')
let session = require('express-session')

app.use(cors())
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',paritalsDir:__dirname+'/views/partials/'}))

app.use(logger('dev')); 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(fileUpload())

// add cache control
app.use((req, res, next) => {
  if (!req.user) {
    res.header("cache-control", "private,must revalidate,no-cache,no-store");
    res.header("Express", "-3");
  }
  next();
});
//set session as middlewear using app.use
app.use(session({
  secret:'key',
  resave:false,
  cookie:{maxAge:oneDay},
  saveUninitialized:false
}))

Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

Handlebars.registerHelper("ifEquals", function(a,b, opts) {
  if (a == b) {
    return opts.fn(this)
} else {
    return opts.inverse(this)
} 
})

//before starting a project we connect it with db
db.connect((err)=>{
  if (err) console.log("Connection Error"); 
  else console.log("Database Connected to port 27017");
})

db.connect((err)=>{
  if(err) console.log("Database Connection Error"+err)
  else console.log("DB Connection Successful to port 27010")
})
app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).render('admin/errorh',{error:true})
//   // next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  
});


  

module.exports = app;
