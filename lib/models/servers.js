'use strict';

/**
 * Servers model
 *
 * @module models
 */

var Sequelize       = require('sequelize'),
    storage         = require('../storage');

var db = storage.getStorage();

/**
 * Server model 
 * @class ServerModel 
 */

var ServerModel = db.define('server', {

    name: {
        type: Sequelize.STRING
    },

    url: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            isUrl: true
        }
    },

    keyId: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            is: /^[0-9a-f]+$/
        }
    },

    lastSync: {
        type: Sequelize.TIME,
        allowNull: true
    }

}, {
    freezeTableName: true
});

module.exports = ServerModel;
