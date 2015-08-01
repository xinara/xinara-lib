'use strict';

/**
 * Initialization of storage object
 * @module storage
 */

var Sequelize = require('sequelize'),
    _ = require('underscore'),
    config = require('./config');

var instance = null;

/**
 * Get storage object
 * @return {Sequelize}
 */

module.exports.getStorage = function(uconfig) {
    
    var conf = _.extend(
            {},
            config.storage,
            uconfig || {});
    
    var options = _.omit(conf, [
            'db', 'username', 'password'
    ]);

    options.logging = function () {};

    if (!instance) {

        instance = new Sequelize(
                conf.db || null,
                conf.username || null,
                conf.password || null,
                options
        );

    }

    return instance;

};
