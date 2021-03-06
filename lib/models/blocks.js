'use strict';

/**
 * Block model
 *
 * @module models
 */

var crypto          = require('crypto'),
    _               = require('underscore'),
    OpenPGP         = require('openpgp');

var ID_ZERO = OpenPGP.util.hex2bin('0000000000000000');
var NO_DECRYPT_ERR = 'Error decrypting and verifying message!';

module.exports = function (sequelize, DataTypes) {

    /**
     * Blocks model 
     * @class BlockModel 
     */

    return sequelize.define('blocks', {

        checksum: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                is: /^[0-9a-f]{40}$/
            }
        },

        keyId: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'key_id'
        },

        stat: {
            type: DataTypes.ENUM(
                          'new',
                          'received',
                          'identified',
                          'unknow',
                          'discarded'
            ),
            allowNull: false,
            defaultValue: 'new'
        },

        sent: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },

        content: {
            type: DataTypes.BLOB,
            allowNull: false,

            get: function () {
                var message;
                var clean = this.getDataValue('content');

                if (Buffer.isBuffer(clean)) {
                    clean = clean.toString('utf8');
                }

                message = OpenPGP.message.readArmored(clean);
                return message;
            },

            set: function (value) {
                var block, fingerprint, keyId;
                var hasher = crypto.createHash('sha1');
                
                if (value instanceof OpenPGP.message.Message) {
                    block = value; 
                } else {
                    try {
                        block = OpenPGP.message.readArmored(value);
                    } catch (e) {
                        throw new sequelize.ValidationError(
                                'Error reading block: ' + e.message);
                    }
                    
                }

                // Get alleged KeyID 
                keyId = block.packets[0].publicKeyId.toHex();
            
                // Delete keyid (if there one)
                block.packets[0].publicKeyId.read(ID_ZERO);

                hasher.update(block.armor());
                fingerprint = hasher.digest('hex');

                if (OpenPGP.util.hex2bin(keyId) !== ID_ZERO) {
                    this.setDataValue('keyId', keyId);
                } else {
                    this.setDataValue('keyId', null);
                }

                this.setDataValue('checksum', fingerprint);
                this.setDataValue('content', block.armor());     

            }

        }

    }, {
        freezeTableName: true,

        classMethods: {
            /**
             * Create block from buffer
             *
             * @method
             * @static 
             * @param {Buffer} data         - Blob to cipher 
             * @param {models.Key} key      - Key to cipher
             * @param {String} [password]   - Password of key
             * @return {Promise}
             */
            createSignedBlock: function (data, key, password) {
                var self = this;
               
               return new sequelize.Promise(function (resolve, reject) {
               
                   if (!Buffer.isBuffer(data)) {
                        return reject(new Error("Data has been a Buffer"));
                   }

                   var PGPKey = key.content;

                   if (! PGPKey.decrypt(password || null) ) {
                        return reject(new Error("Invalid key password"));
                   }

                   // This isn't the best method, but I don't find a method 
                   // to sign and encrypt async.
                   // @TODO Fix that shit

                   OpenPGP.signAndEncryptMessage(
                           [PGPKey], PGPKey, data.toString('binary'))
                   
                   .then(function (message) {
                        self.create({
                            content: message
                        })
                        .then(resolve)
                        .catch(reject);
                   })

                   .catch(reject);

               });

            }
        },

        instanceMethods: {
            checkWith: function (key, password) {
                var self = this;

                return new sequelize.Promise(function (resolve, reject) {
                    
                    // Clone message
                    var clear = self.getDataValue('content').toString('utf8');
                    var message = OpenPGP.message.readArmored(clear);
                    
                    var PGPKey = key.content;

                    var skeyid = PGPKey.getKeyIds()[1];

                    message.packets[0].publicKeyId.read(skeyid.bytes);

                    if (! PGPKey.decrypt(password || null)) {
                        return reject(
                                new Error("Invalid private key password"));
                    }

                    OpenPGP.decryptAndVerifyMessage(
                            PGPKey, [PGPKey.toPublic()], message)
                    .then(function (result) {

                        try {
                            _.each(result.signatures, function (sign) {
                                if (!sign.valid) {
                                    throw new Error("Invalid signature!");
                                }
                            });
                        } catch (e) {
                            return reject(e);
                        }

                        resolve({
                            works: true,
                            result: result.text
                        });

                    })
                    .catch(function (e) {
                        if (e.message && e.message === NO_DECRYPT_ERR) {
                            return resolve({
                                works: false,
                                result: null
                            });
                        }

                        reject(e);

                    });

                });
            }
        }

    });

};
