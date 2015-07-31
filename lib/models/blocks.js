'use strict';

/**
 * Block model
 *
 * @module models
 */

var crypto          = require('crypto'),
    Sequelize       = require('sequelize'),
    OpenPGP         = require('openpgp'),
    storage         = require('../storage');

var db = storage.getStorage();

var ID_ZERO = OpenPGP.util.hex2bin('0000000000000000');

/**
 * Blocks model 
 * @class BlockModel 
 */

var BlockModel = db.define('blocks', {

    checksum: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
            is: /^[0-9a-f]{40}$/
        }
    },

    keyId: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'key_id'
    },

    stat: {
        type: Sequelize.ENUM(
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
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    content: {
        type: Sequelize.BLOB,
        allowNull: false,

        get: function () {
            var clean = this.getDataValue('content');
            return OpenPGP.message.readArmored(clean);
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
                    throw new Sequelize.ValidationError(
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
           
           return new Sequelize.Promise(function (resolve, reject) {
           
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
                    BlockModel.create({
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
    
    }

});

module.exports = BlockModel;