// Middleware: Se requiere hacer login.
exports.loginRequired = function(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login?redir=' + req.url);
  }
};

// Formulario para hacer login
exports.new = function(req, res) {
  res.render('session/new', {
    redir: req.query.redir || '/'
  });
};

// Crear la sesion
exports.create = function(req, res) {
  var redir = req.body.redir || '/'
  var login = req.body.login;
  var password = req.body.password;

  var uc = require('./user_controller');
  uc.autenticar(login, password, function(error, user) {
    if (error) {
      req.flash('error', String(error));
      res.redirect("/login?redir=" + redir);
      return;
    }

    req.session.user = {
      id: user.id,
      login: user.login,
      name: user.name,
      isAdmin: user.isAdmin
    };
    res.redirect(redir);
  });
};

// Logout
exports.destroy = function(req, res) {
  delete req.session.user;
  req.flash('success', 'Logout.');
  res.redirect("/login");
};
