var models = require('../models');
var moment = require('moment');
var xss = require('xss');

// Autoload :postid
exports.load = function(req, res, next, id) {
  models.Post
    .findById(id)
    .then(function(post) {
      if (post) {
        req.post = post;
        next();
      } else {
        req.flash('error', 'No existe el post con id=' + id + '.');
        next(new Error('No existe el post con id=' + id + '.'));
      }
    })
    .catch(function(error) {
      next(error)
    });
};

// Comprueba que el usuario logeado es el author o admin.
exports.loggedUserIsAuthor = function(req, res, next) {
  if (req.session.user && (req.session.user.id == req.post.AuthorId || req.session.user.isAdmin == true)) {
    next();
  } else {
    res.redirect('/');
  }
};

// GET /posts
exports.index = function(req, res, next) {
  if (req.session.user.isAdmin == true) {
    models.Post
      .findAll({
        order: [
          ['updatedAt', 'DESC']
        ],
        include: [{
          model: models.User,
          as: 'Author',
          attributes: ['id', 'name']
        }]
      })
      .then(function(posts) {
        res.render('posts/index', {
          posts: posts,
          moment: moment
        });
      })
      .catch(function(error) {
        next(error)
      });
  } else {
    models.Post
      .findAll({
        where: {
          authorId: req.session.user.id
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
      .then(function(posts) {
        res.render('posts/index', {
          posts: posts,
          moment: moment
        });
      })
      .catch(function(error) {
        next(error)
      });
  }
};

// GET /posts
exports.all = function(req, res, next) {
  if (req.query.search === undefined) {
    models.Post
      .findAll({
        order: [
          ['updatedAt', 'DESC']
        ],
        include: [{
          model: models.User,
          as: 'Author',
          attributes: ['name']
        }]
      })
      .then(function(posts) {
        res.render('index', {
          posts: posts,
          moment: moment
        });
      })
      .catch(function(error) {
        next(error)
      });
  } else {
    var filtro = (decodeURIComponent(xss(req.query.search)) || '');
    models.Post
      .findAll({
        where: ["lower(title) like ?", '%' + filtro + '%'],
        order: [
          ['updatedAt', 'DESC']
        ],
        include: [{
          model: models.User,
          as: 'Author',
          attributes: ['name']
        }]
      })
      .then(function(posts) {
        res.render('tags', {
          posts: posts,
          moment: moment,
          filtro: filtro
        });
      })
      .catch(function(error) {
        next(error)
      });
  }
};

// GET /tags/:tag
exports.tags = function(req, res, next) {
  var filtro = decodeURIComponent(xss(req.params.tag));
  models.Post
    .findAll({
      where: ["lower(tags) like ?", '%' + filtro + '%'],
      order: [
        ['updatedAt', 'DESC']
      ],
      include: [{
        model: models.User,
        as: 'Author',
        attributes: ['name']
      }]
    })
    .then(function(posts) {
      res.render('tags', {
        posts: posts,
        moment: moment,
        filtro: filtro
      });
    })
    .catch(function(error) {
      next(error)
    });
};



// GET /posts/:postid
exports.show = function(req, res, next) {
  models.User
    .findById(req.post.AuthorId)
    .then(function(user) {
      req.post.author = user ||  {};
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
            attributes: ['name']
          }]
        })
        .then(function(comments) {
          var new_comment = models.Comment.build({
            body: 'Introduzca el texto del comentario'
          });
          res.render('posts/show', {
            post: req.post,
            comments: comments,
            comment: new_comment,
            moment: moment,
            validate_errors: {}
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

// GET /posts/new
exports.new = function(req, res, next) {
  var post = models.Post.build({
    title: 'Introduzca el título del Post',
    body: 'Introduzca el texto del Post'
  });

  res.render('posts/new', {
    post: post,
    validate_errors: {}
  });
};

// POST /posts
exports.create = function(req, res, next) {
  var post = models.Post.build({
    title: req.body.post.title,
    body: req.body.post.body,
    tags: req.body.post.tags,
    AuthorId: req.session.user.id
  });

  post
    .validate()
    .then(
      function(err) {
        if (err) {
          req.flash('error', 'Los datos del formulario son incorrectos.');
          for (var i in err.errors) {
            req.flash('error', err.errors[i].message);
          };

          res.render('posts/new', {
            post: post,
          });
          return;
        }
      })
    .catch(function(error) {
      next(error)
    });

  post.save()
    .then(function() {
      req.flash('success', 'Post creado con éxito.');
      res.redirect('/posts');
    })
    .catch(function(error) {
      next(error)
    });
};

// GET /posts/:postid/edit
exports.edit = function(req, res, next) {
  res.render('posts/edit', {
    post: req.post,
    validate_errors: {}
  });
};

// PUT /posts/:postid
exports.update = function(req, res, next) {
  req.post.title = req.body.post.title;
  req.post.body = req.body.post.body;
  req.post.tags = req.body.post.tags,
    req.post
    .validate()
    .then(
      function(err) {
        if (err) {
          req.flash('error', 'Los datos del formulario son incorrectos.');
          for (var i in err.errors) {
            req.flash('error', err.errors[i].message);
          };

          res.render('posts/edit', {
            post: req.post,
            validate_errors: validate_errors
          });
          return;
        }

        req.post.save(['title', 'body'])
          .then(function() {
            req.flash('success', 'Post actualizado con éxito.');
            res.redirect('/posts');
          })
          .catch(function(error) {
            next(error)
          });
      }
    );
};

// DELETE /posts/:postid
exports.destroy = function(req, res, next) {
  req.post.destroy()
    .then(function() {
      req.flash('success', 'Post eliminado con éxito.');
      res.redirect('/posts');
    })
    .catch(function(error) {
      next(error)
    });
};
