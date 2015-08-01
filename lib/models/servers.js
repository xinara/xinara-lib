'use strict';

/**
 * Servers model
 *
 * @module models
 */

module.exports = function (sequelize, DataTypes) {

    /**
     * Server model 
     * @class ServerModel 
     */

    return sequelize.define('servers', {

        name: {
            type: DataTypes.STRING
        },

        url: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isUrl: true
            }
        },

        keyId: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                is: /^[0-9a-f]+$/
            }
        },

        lastSync: {
            type: DataTypes.TIME,
            allowNull: true
        }

    }, {
        freezeTableName: true
    });

};
