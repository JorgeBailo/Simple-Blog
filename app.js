var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var partials = require('express-partials');
var methodOverride = require('method-override');
var routes = require('./routes/index');
var flash = require('express-flash');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(methodOverride('_method'));
app.use(cookieParser('simple-blog-imagina'));
app.use(session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(partials());
app.use(flash());

// Helper dinamico: Hacer visible req.session en las vistas
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

// Helper estatico: Escapar texto
app.locals.escapeText = function(text) {
  return String(text)
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
};

app.use('/', routes);

// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
