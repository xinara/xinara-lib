'use strict';

/* global describe */
/* global it */

var assert  = require('assert'),
    fs      = require('fs'),
    path    = require('path'),
    getModels = require('../lib/models');

var tmpmark = (new Date()).getTime();
var datadir = path.resolve(__dirname + '/data');
var dbpath = path.resolve(__dirname + '/tmp/' + tmpmark.toString(36) + '.dat');

var models = getModels({
    dialect: 'sqlite',
    storage: dbpath
});

var publicKey = fs.readFileSync(datadir + '/public4096.asc');
var privateKey = fs.readFileSync(datadir + '/private4096.asc');
var otherKey = fs.readFileSync(datadir + '/otherkey.asc');
var lorem = fs.readFileSync(datadir + '/lorem.txt');
var invalid = fs.readFileSync(datadir + '/invalid.asc');
var cipheredLorem = fs.readFileSync(datadir + '/lorem.asc');

var KeyModel = models.Keys;
var ServerModel = models.Servers; 
var BlockModel  = models.Blocks;

describe("Syncing models", function () {

    it("Sync Keys Model", function (done) {
        KeyModel.sync({
            force: true
        })
        .then(function () {
            done();
        })
        .catch(done);
    });

    it("Sync Servers Model", function (done) {
        ServerModel.sync({
            force: true
        })
        .then(function () {
            done();
        })
        .catch(done);
    });


    it("Sync Blocks Model", function (done) {
        BlockModel.sync({
            force: true
        })
        .then(function () {
            done();
        })
        .catch(done);
    });

});

describe("Checking Keys model", function () {

    it("Saving public key model", function (done) {
    
        KeyModel.create({
            content: publicKey.toString('utf8')
        })
        .then(function (key) {
            assert.equal(key.keyId, '6591b53af140f0c3', 'Bad read of key id');
            assert.equal(key.fingerprint,
                    '1f339deee6fca29a26a1fc3f6591b53af140f0c3',
                                    'Bad read of key fingerprint');
            assert.equal(key.type, 'public', 'Bad read of key type');
            done();
        })
        .catch(function (e) {
            done(e);
        });

    });

    it("Try to save the same key", function (done) {
   
        KeyModel.create({
            content: publicKey.toString('utf8')
        })
        .then(function () {
            done(new Error("Repeat key pass"));
        })
        .catch(function (e) {
            if (e instanceof models.sequelize.UniqueConstraintError) {
                // pass
                return done();
            }

            done(e);
        });

    });

    it("Updating as private", function (done) {

        KeyModel.findOne({
            where: {
                keyId: '6591b53af140f0c3'
            }
        })
        .then(function (key) {
            key.content = privateKey.toString('utf8');
            key.save()
            .then(function (key) {
                assert.equal(key.keyId, '6591b53af140f0c3',
                                                    'Bad read of key id');
                assert.equal(key.fingerprint,
                                '1f339deee6fca29a26a1fc3f6591b53af140f0c3',
                                'Bad read of key fingerprint');

                assert.equal(key.type, 'private', 'Bad read of key type');
                done();
            })
            .catch(done);
        })
        .catch(done);
    
    });

    it("Try to saving invalid key model", function (done) {

        try {
            KeyModel.create({
                content: invalid
            })
            .then(function () {
                done(new Error("Pass invalid key"));
            })
            .catch(done);

        } catch (e) {
            if (e instanceof models.sequelize.ValidationError) {
                // pass
                return done();
            }

            done(e);

        }
    });

});

describe("Checking server model", function () {

    it("Creating server", function (done) {

        ServerModel.create({
            name: 'My server',
            url: 'http://domain.com',
            keyId: 'f140f0c3'
        })
        .then(function (server) {
            assert.equal(server.name, 'My server', 'Name');
            assert.equal(server.url, 'http://domain.com', 'Domain');
            assert.equal(server.keyId, 'f140f0c3', 'Key ID');
            done();
        })
        .catch(done);

    });

    it ("Try to create invalid url server", function (done) {

        ServerModel.create({
            name: 'My other server',
            url: 'this is a invalid domain',
            keyId: 'f140f0c3'
        })
        .then(function () {
            done(new Error("Invalid url pass"));
        })
        .catch(function (e) {
            if (e instanceof models.sequelize.ValidationError) {
                // pass 
                return done();
            } 

            done(e);
        });

    });

});

describe("Test block creation from content", function () {


    it("Creating block from ciphered content", function (done) {

        BlockModel.create({
            content: cipheredLorem.toString('utf8')
        })
        .then(function (block) {
            assert.equal(block.keyId, null, "Message has key id");

            assert.equal(block.checksum,
                    '8e27436d3a5274a809dccec0e5db27c69ee17c3e',
                    "Incorrect checksum");

            var keyId = block.content.packets[0].publicKeyId.toHex();

            assert.equal(keyId, '0000000000000000', "The block has keyId!!");

            done();

        })
        .catch(done);

    });

    it("Creating block from lorem", function (done) {
        
        KeyModel.findOne({
            where: {
                keyId: '6591b53af140f0c3'
            }
        }) 
        .then(function (privateKeyInstance) {

            BlockModel.createSignedBlock(
                    lorem, privateKeyInstance, '123456')
            .then(function (block) {
                assert.equal(block.keyId,
                                '212e55b4e0059edd', "Incorrect KeyID");
                
                assert.equal(block.stat,
                                    'new', "Incorrect default status");

                var keyId = block.content.packets[0].publicKeyId.toHex();

                assert.equal(keyId, '0000000000000000',
                                                "The block has keyId!!");

                done();
            }).catch(done);

        })
        .catch(done);

    });

    it("Try to decrypt block with INvalid key", function (done) {

        KeyModel.create({
            content: otherKey.toString('utf8')
        })
        .then(function (key) {

            BlockModel.findOne({
                where: {
                    checksum: '8e27436d3a5274a809dccec0e5db27c69ee17c3e'
                }
            })
            .then(function (block) {
            
                block.checkWith(key, '123456')
                .then(function (result) {
                    assert.equal(result.works, false, "WTF??");
                    done();
                })
                .catch(done);

            })
            .catch(done);
       
        })
        .catch(done);



    
    });

    it("Try to decrypt block with valid key", function (done) {

        KeyModel.findOne({
            where: {
                keyId: '6591b53af140f0c3'
            }
        }) 
        .then(function (privateKeyInstance) {
 
            BlockModel.findOne({
                where: {
                    checksum: '8e27436d3a5274a809dccec0e5db27c69ee17c3e'
                }
            })
            .then(function (block) {
            
                block.checkWith(privateKeyInstance, '123456')
                .then(function (result) {
                    assert.equal(result.works, true, "Not resolved!");
                    assert.equal(result.result, lorem.toString('utf8'),
                                                        "Invalid result");
                    done();
                })
                .catch(done);

            })
            .catch(done);
        })
        .catch(done);

    });

});
