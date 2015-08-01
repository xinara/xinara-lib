'use strict';

/**
 * Keys model
 *
 * @module models
 */

var OpenPGP     = require('openpgp');

/**
 * Keys model 
 * @class KeyModel 
 */

module.exports = function (sequelize, DataTypes) {

    return sequelize.define('keys', {

        keyId: {
            type: DataTypes.STRING,
            unique: true
        },

        fingerprint: {
            type: DataTypes.STRING,
            unique: true
        },

        type: {
            type: DataTypes.ENUM(
                          'public',
                          'private')
        },

        content: {
            type: DataTypes.BLOB,
            allowNull: false,

            get: function () {
                var key;
                var clean = this.getDataValue('content');

                if (Buffer.isBuffer(clean)) {
                    clean = clean.toString('utf8');
                }

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
                        throw new sequelize.ValidationError(
                                'Error reading key: ' + e.message);
                    }

                    if (!key.keys || key.keys.length !== 1) {
                        throw new sequelize.ValidationError(
                                'Invalid number of keys');
                    }

                    key = key.keys[0];
                    
                }

                if (key.isPrivate()) {
                    this.setDataValue('type', 'private');
                } else if (key.isPublic()) {
                    this.setDataValue('type', 'public');
                } else {
                    throw new sequelize.ValidationError('Invalid key');
                }

                fingerprint = key.primaryKey.fingerprint;
                keyId = key.primaryKey.keyid.toHex();

                this.setDataValue('keyId', keyId);
                this.setDataValue('fingerprint', fingerprint);
                this.setDataValue('content', key.armor());     

            }

        },

        password: {
            type: DataTypes.STRING,
            allowNull: true
        }

    }, {
        freezeTableName: true
    });

};
