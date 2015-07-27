var crypto = require('crypto');

// Crea un string aleatorio para usar como salt.
exports.createNewSalt = function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
};

// Encripta un password.
exports.encriptarPassword = function(password, salt) {
  return crypto.createHmac('sha1', salt).update(password).digest('hex');
};
