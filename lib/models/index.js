'use strict';

var path    = require('path'),
    storage = require('../storage');

var getPath = function (modelName) {
    return path.join(__dirname, modelName);
};

module.exports = function (config) {

    var models = {};

    config = config || {};
    var sequelize = storage.getStorage(config);

    models.Keys = sequelize.import(getPath('keys'));
    models.Servers = sequelize.import(getPath('servers'));
    models.Blocks = sequelize.import(getPath('blocks'));

    models.sequelize = sequelize;
    
    return models;

};
