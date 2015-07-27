var models = require('../models');
var userController = require('./user_controller');

//Auto-loading :commentid
exports.load = function(req, res, next, id) {
  models.Comment
    .findById(id)
    .then(function(comment) {
      if (comment) {
        req.comment = comment;
        next();
      } else {
        req.flash('error', 'No existe el comentario con id=' + id + '.');
        next(new Error('No existe el comentario con id=' + id + '.'));
      }
    })
    .catch(function(error) {
      next(error)
    });
};

//Comprueba que el usuario logeado es el author.
exports.loggedUserIsAuthor = function(req, res, next) {
  if (req.session.user && (req.session.user.id == req.comment.AuthorId || req.session.user.isAdmin == true)) {
    next();
  } else {
    res.redirect('/');
  }
};

// GET /posts/:postid/comments
exports.index = function(req, res, next) {
  models.Comment
    .findAll({
      where: {
        PostId: req.post.id
      },
      order: [
        ['updatedAt', 'DESC']
      ],
      include: [{
        model: models.User,
        as: 'Author',
        attributes: ['id', 'name']
      }]
    })
    .then(function(comments) {
      res.render('comments/index', {
        comments: comments,
        post: req.post
      });
    })
    .catch(function(error) {
      next(error)
    });
};

// GET /posts/:postid/comments/:commentid
exports.show = function(req, res, next) {
  // Buscar el autor del post
  models.User
    .findById(req.post.AuthorId)
    .then(function(user) {
      req.post.author = user ||  {};
      models.User
        .findById(req.comment.AuthorId)
        .then(function(user) {
          req.comment.author = user ||  {};
          res.render('comments/show', {
            comment: req.comment,
            post: req.post
          });
        })
        .catch(function(error) {
          next(error)
        });
    })
    .catch(function(error) {
      next(error)
    });
};

// GET /posts/:postid/comments/new
exports.new = function(req, res, next) {
  var comment = models.Comment.build({
    body: 'Introduzca el texto del comentario'
  });

  res.render('comments/new', {
    comment: comment,
    post: req.post,
    validate_errors: {}
  });
};

// POST /posts/:postid/comments
exports.create = function(req, res, next) {
  var comment = models.Comment.build({
    body: req.body.comment.body,
    AuthorId: req.session.user.id,
    PostId: req.post.id
  });

  comment
    .validate()
    .then(
      function(err) {
        if (err) {
          req.flash('error', 'Los datos del formulario son incorrectos.');
          for (var i in err.errors) {
            req.flash('error', err.errors[i].message);
          };

          res.render('comments/new', {
            comment: comment,
            post: req.post,

          });
          return;
        }
      })
    .catch(function(error) {
      next(error)
    });

  comment.save()
    .then(function() {
      req.flash('success', 'Comentario creado con éxito.');
      res.redirect('/posts/' + req.post.id);
    })
    .catch(function(error) {
      next(error)
    });
};

// GET /posts/:postid/comments/:commentId/edit
exports.edit = function(req, res, next) {
  res.render('comments/edit', {
    comment: req.comment,
    post: req.post,
    validate_errors: {}
  });
};

// PUT /posts/:postid/comments/
exports.update = function(req, res, next) {
  req.comment.body = req.body.comment.body;

  req.comment
    .validate()
    .then(
      function(err) {
        if (err) {
          req.flash('error', 'Los datos del formulario son incorrectos.');
          for (var i in err.errors) {
            req.flash('error', err.errors[i].message);
          };

          res.render('comments/new', {
            comment: req.comment,
            post: req.post,
          });
          return;
        }
      })
      .catch(function(error) {
        next(error)
      });

    req.comment.save(['body'])
    .then(function() {
      req.flash('success', 'Commentario actualizado con éxito.');
      res.redirect('/posts/' + req.post.id);
    })
    .catch(function(error) {
      next(error)
    });
};

// DELETE /posts/:postid/comments/:commentid
exports.destroy = function(req, res, next) {
  req.comment.destroy()
    .then(function() {
      req.flash('success', 'Comentario eliminado con éxito.');
      res.redirect('/posts/' + req.post.id);
    })
    .catch(function(error) {
      next(error)
    });
};
