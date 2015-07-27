var path = require('path');
var crypto = require('crypto');
var utils = require('../lib/utils');

var Sequelize = require('sequelize');

// Usar BBDD
var vals = process.env.DATABASE_URL.match(/(.*)\:\/\/(.*?)\:(.*)@(.*)\:(.*)\/(.*)/);

var DATABASE_PROTOCOL = vals[1];
var DATABASE_DIALECT = vals[1];
var DATABASE_USER = vals[2];
var DATABASE_PASSWORD = vals[3];
var DATABASE_HOST = vals[4];
var DATABASE_PORT = vals[5];
var DATABASE_NAME = vals[6];

var sequelize = new Sequelize(DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, {
  dialect: DATABASE_DIALECT,
  protocol: DATABASE_PROTOCOL,
  port: DATABASE_PORT,
  host: DATABASE_HOST,
  storage: process.env.DATABASE_STORAGE,
  omitNull: true
});

// Importar la definicion de las clases.
var Post = sequelize.import(path.join(__dirname, 'post'));
var User = sequelize.import(path.join(__dirname, 'user'));
var Comment = sequelize.import(path.join(__dirname, 'comment'));

// Relaciones
User.hasMany(Post, {
  foreignKey: 'AuthorId',
  onDelete: 'cascade'
});
User.hasMany(Comment, {
  foreignKey: 'AuthorId',
  onDelete: 'cascade'
});
Post.hasMany(Comment, {
  onDelete: 'cascade'
});
Post.belongsTo(User, {
  as: 'Author',
  foreignKey: 'AuthorId'
});
Comment.belongsTo(User, {
  as: 'Author',
  foreignKey: 'AuthorId'
});
Comment.belongsTo(Post);

// Exportar los modelos:
exports.Post = Post;
exports.User = User;
exports.Comment = Comment;

// Inicalizar Base de datos
sequelize.sync().then(function() {
  User
    .count()
    .then(function(count) {
      if (count === 0) {
        var salt = utils.createNewSalt();
        var hashed_password = utils.encriptarPassword("1234", salt);
        User.bulkCreate([{
            login: 'admin',
            name: 'admin',
            email: 'admin@prueba.es',
            salt: salt,
            hashed_password: hashed_password,
            isAdmin: true
          }])
          .then(function() {
            console.log('Base de datos inicializada')
          });
      }
    })
});
