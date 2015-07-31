'use stricts';

var assert  = require('assert'),
    fs      = require('fs'),
    path    = require('path'),
    OpenPGP = require('openpgp'),
    Sequelize = require('sequelize'),
    config  = require('../lib/config');

var tmpmark = (new Date()).getTime();
var datadir = path.resolve(__dirname + '/data');
var dbpath = path.resolve(__dirname + '/tmp/' + tmpmark.toString(36) + '.dat');

config.$set({
    storage: {
        dialect: 'sqlite',
        storage: dbpath
    }
});

var KeyModel    = require('../lib/models/keys');
var BlockModel  = require('../lib/models/blocks');

var publicKey = fs.readFileSync(datadir + '/public4096.asc');
var privateKey = fs.readFileSync(datadir + '/private4096.asc');
var lorem = fs.readFileSync(datadir + '/lorem.txt');

describe("Test block creation from content", function () {
    var privateKeyInstance;

    it("Geting private key", function (done) {

        KeyModel.sync({
            force: true
        })
        .then(function () {

            KeyModel.create({
                content: privateKey.toString('utf8')
            })
            .then(function (key) {
                privateKeyInstance = key;
                done();
            })
            .catch(done);

        }
        ).catch(done);            

    });

    it("Syncing block model", function (done) {
        BlockModel.sync().then(function () {
            done();
        }).catch(done);
    });

    it("Creating block from lorem", function (done) {
    
        BlockModel.createSignedBlock(
                lorem, privateKeyInstance, '123456')
        .then(function (block) {
            assert.equal(block.keyId, '212e55b4e0059edd', "Incorrect KeyID");
            assert.equal(block.stat, 'new', "Incorrect default status");

            var keyId = block.content.packets[0].publicKeyId.toHex();

            assert.equal(keyId, '0000000000000000', "The block has keyId!!");

            done();
        }).catch(done);

    });

});