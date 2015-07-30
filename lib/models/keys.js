'use strict';

/**
 * Keys model
 *
 * @module models
 */

var Sequelize       = require('sequelize'),
    OpenPGP         = require('openpgp'),
    storage         = require('../storage');

var db = storage.getStorage();

/**
 * Keys model 
 * @class KeyModel 
 */

var KeyModel = db.define('server', {

    keyId: {
        type: Sequelize.STRING,
        unique: true
    },

    fingerprint: {
        type: Sequelize.STRING,
        unique: true
    },

    type: {
        type: Sequelize.ENUM(
                      'public',
                      'private')
    },

    content: {
        type: Sequelize.BLOB,
        allowNull: false,

        get: function () {
            var key;
            var clean = this.getDataValue('content');

            key = OpenPGP.key.readArmored(clean);
   
            return key.keys[0];

        },

        set: function (value) {
            var key, keyId, fingerprint;
            
            if (value instanceof OpenPGP.key.Key) {
                key = value; 
            } else {
                try {
                    key = OpenPGP.key.readArmored(value);
                } catch (e) {
                    throw new Sequelize.ValidationError(
                            'Error reading key: ' + e.message);
                }

                if (!key.keys || key.keys.length !== 1) {
                    throw new Sequelize.ValidationError(
                            'Invalid number of keys');
                }

                key = key.keys[0];
                
            }

            if (key.isPrivate()) {
                this.setDataValue('type', 'private');
            } else if (key.isPublic()) {
                this.setDataValue('type', 'public');
            } else {
                throw new Sequelize.ValidationError('Invalid key');
            }

            fingerprint = key.primaryKey.fingerprint;
            keyId = key.primaryKey.keyid.toHex();

            this.setDataValue('keyId', keyId);
            this.setDataValue('fingerprint', fingerprint);
            this.setDataValue('content', key.armor());     

        }

    },

    password: {
        type: Sequelize.STRING,
        allowNull: true
    }

}, {
    freezeTableName: true
});

module.exports = KeyModel;
