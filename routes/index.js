var express = require('express');
var router = express.Router();

var postController = require('../controllers/post_controller');
var userController = require('../controllers/user_controller');
var sessionController = require('../controllers/session_controller');
var commentController = require('../controllers/comment_controller');

// GET home page.
router.get('/', postController.all);
// GET tags page.
router.get('/tags/:tag', postController.tags);

// Autoloading
router.param('postid', postController.load);
router.param('userid', userController.load);
router.param('commentid', commentController.load);

// Rutas de sesiones
router.get('/login', sessionController.new);
router.post('/login', sessionController.create);
router.get('/logout', sessionController.destroy);

// Rutas de Comentarios
router.get('/posts/:postid([0-9]+)/comments', commentController.index);
router.get('/posts/:postid([0-9]+)/comments/new', sessionController.loginRequired, commentController.new);
router.get('/posts/:postid([0-9]+)/comments/:commentid([0-9]+)', commentController.show);
router.post('/posts/:postid([0-9]+)/comments', sessionController.loginRequired, commentController.create);
router.get('/posts/:postid([0-9]+)/comments/:commentid([0-9]+)/edit', sessionController.loginRequired, commentController.loggedUserIsAuthor, commentController.edit);
router.put('/posts/:postid([0-9]+)/comments/:commentid([0-9]+)', sessionController.loginRequired, commentController.loggedUserIsAuthor, commentController.update);
router.delete('/posts/:postid([0-9]+)/comments/:commentid([0-9]+)', sessionController.loginRequired, commentController.loggedUserIsAuthor, commentController.destroy);

// Rutas de Posts
router.get('/posts', sessionController.loginRequired, postController.index);
router.get('/posts/new', sessionController.loginRequired, postController.new);
router.get('/posts/:postid([0-9]+)', postController.show);
router.post('/posts', sessionController.loginRequired, postController.create);
router.get('/posts/:postid([0-9]+)/edit', sessionController.loginRequired, postController.loggedUserIsAuthor, postController.edit);
router.put('/posts/:postid([0-9]+)', sessionController.loginRequired, postController.loggedUserIsAuthor, postController.update);
router.delete('/posts/:postid([0-9]+)', sessionController.loginRequired, postController.loggedUserIsAuthor, postController.destroy);

// Rutas de Users
router.get('/users', sessionController.loginRequired, userController.loggedUserIsAdmin, userController.index);
router.get('/signup', userController.new);
router.get('/users/new', userController.new);
router.get('/users/:userid([0-9]+)', sessionController.loginRequired, userController.loggedUserIsUser, userController.show);
router.post('/users', userController.create);
router.get('/users/:userid([0-9]+)/edit', sessionController.loginRequired, userController.loggedUserIsUser, userController.edit);
router.put('/users/:userid([0-9]+)', sessionController.loginRequired, userController.loggedUserIsUser, userController.update);
router.delete('/users/:userid([0-9]+)', sessionController.loginRequired, userController.loggedUserIsUser, userController.destroy);

// Rutas API
router.get('/api/posts', postController.api);

module.exports = router;
