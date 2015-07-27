var models = require('../models');
var crypto = require('crypto');
var utils = require('../lib/utils');

//Autoloading :userid
exports.load = function(req, res, next, id) {
  models.User
    .findById(id)
    .then(function(user) {
      if (user) {
        req.user = user;
        next();
      } else {
        req.flash('error', 'No existe el usuario con id=' + id + '.');
        next('No existe el usuario con id= ' + id + '.');
      }
    })
    .catch(function(error) {
      next(error)
    });
};

//Comprueba que el usuario logeado es el usuario al que se refiere esta ruta o es admin.
exports.loggedUserIsUser = function(req, res, next) {
  if (req.session.user && (req.session.user.id == req.user.id || req.session.user.isAdmin == true)) {
    next();
  } else {
    res.redirect('/');
  }
};

//Comprueba que el usuario logeado es el admin.
exports.loggedUserIsAdmin = function(req, res, next) {
  if (req.session.user && req.session.user.isAdmin == true) {
    next();
  } else {
    res.redirect('/');
  }
};

// GET /users
exports.index = function(req, res, next) {
  models.User
    .findAll({
      order: ['name']
    })
    .then(function(users) {
      res.render('users/index', {
        users: users
      });
    })
    .catch(function(error) {
      next(error)
    });
};

// GET /users/:userid
exports.show = function(req, res, next) {
  res.render('users/show', {
    user: req.user
  });
};

// GET /users/new
exports.new = function(req, res, next) {
  var user = models.User.build({
    login: 'Tu login',
    name: 'Tu nombre',
    email: 'Tu email'
  });

  res.render('users/new', {
    user: user,
    validate_errors: {}
  });
};

// POST /users
exports.create = function(req, res, next) {
  var user = models.User.build({
    login: req.body.user.login,
    name: req.body.user.name,
    email: req.body.user.email
  });

  models.User.find({
      where: {
        login: req.body.user.login
      }
    })
    .then(function(existing_user) {
      if (existing_user) {
        req.flash('error', "Error: El usuario \"" + req.body.user.login + "\" ya existe.");
        res.render('users/new', {
          user: user,
          validate_errors: {
            login: 'El usuario \"' + req.body.user.login + '\" ya existe.'
          }
        });
      } else {
        user
          .validate()
          .then(
            function(err) {
              if (err) {
                req.flash('error', 'Los datos del formulario son incorrectos.');
                for (var i in err.errors) {
                  req.flash('error', err.errors[i].message);
                };
                res.render('users/new', {
                  user: user,
                });
                return;
              }
            });

        if (!req.body.user.password) {
          req.flash('error', 'El campo Password es obligatorio.');
          res.render('users/new', {
            user: user,
            validate_errors: {
              password: 'El campo Password es obligatorio.'
            }
          });
          return;
        }

        user.salt = utils.createNewSalt();
        user.hashed_password = utils.encriptarPassword(req.body.user.password, user.salt);

        user.save()
          .then(function() {
            req.flash('success', 'Usuario creado con éxito.');
            res.redirect('/users');
          })
          .catch(function(error) {
            next(error)
          });
      }
    })
    .catch(function(error) {
      next(error)
    });
};

// GET /users/:userid/edit
exports.edit = function(req, res, next) {
  res.render('users/edit', {
    user: req.user,
    validate_errors: {}
  });
};

// PUT /users/:userid
exports.update = function(req, res, next) {
  req.user.name = req.body.user.name;
  req.user.email = req.body.user.email;

  req.user
    .validate()
    .then(
      function(err) {
        if (err) {
          req.flash('error', 'Los datos del formulario son incorrectos.');
          for (var i in err.errors) {
            req.flash('error', err.errors[i].message);
          };

          res.render('users/edit', {
            user: req.user,
          });
          return;
        }

        var fields_to_update = ['name', 'email'];

        if (req.body.user.password) {
          req.user.salt = utils.createNewSalt();
          req.user.hashed_password = utils.encriptarPassword(req.body.user.password,
            req.user.salt);
          fields_to_update.push('salt');
          fields_to_update.push('hashed_password');
        }

        req.user.save(fields_to_update)
          .then(function() {
            req.flash('success', 'Usuario actualizado con éxito.');
            res.redirect('/users');
          })
          .catch(function(error) {
            next(error)
          });
      });
};

// DELETE /users/:userid
exports.destroy = function(req, res, next) {
  req.user.destroy()
    .then(function() {
      req.flash('success', 'Usuario eliminado con éxito.');
      res.redirect('/users');
    })
    .catch(function(error) {
      next(error)
    });
};

// Autenticar un usuario.
exports.autenticar = function(login, password, callback) {
  models.User.find({
      where: {
        login: login
      }
    })
    .then(function(user) {
      if (user) {
        var hash = utils.encriptarPassword(password, user.salt)
        if (hash === user.hashed_password) {
          callback(null, user);
          return;
        }
      }
      callback(new Error('Password erróneo.'));
    })
    .catch(function(error) {
      callback(error);
    });
};
