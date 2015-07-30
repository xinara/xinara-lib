'use stricts';

var assert  = require('assert'),
    fs      = require('fs'),
    path    = require('path'),
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

var publicKey = fs.readFileSync(datadir + '/public4096.asc');
var privateKey = fs.readFileSync(datadir + '/private4096.asc');
var invalid = fs.readFileSync(datadir + '/invalid.asc');

describe("Checking keys model", function () {

    it("Sync model schema", function (done) {
        KeyModel.sync({
            force: true
        })
        .then(function () {
            done();
        })
        .catch(function (e) {
            done(e);
        });
    });

    it("Saving public key model", function (done) {
    
        KeyModel.create({
            content: publicKey.toString('utf8')
        })
        .then(function (key) {
            assert.equal(key.keyId, '6591b53af140f0c3', 'Bad read of key id');
            assert.equal(key.fingerprint, '1f339deee6fca29a26a1fc3f6591b53af140f0c3', 'Bad read of key fingerprint');
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
        .then(function (key) {
            done(new Error("Repeat key pass"));
        })
        .catch(function (e) {
            if (e instanceof Sequelize.UniqueConstraintError) {
                // pass
                return done();
            }

            done(e);
        });

    });

    it("Updating as private", function (done) {

        var key = KeyModel.findOne({
            where: {
                keyId: '6591b53af140f0c3'
            }
        })
        .then(function (key) {
            key.content = privateKey.toString('utf8');
            key.save()
            .then(function (key) {
                assert.equal(key.keyId, '6591b53af140f0c3', 'Bad read of key id');
                assert.equal(key.fingerprint, '1f339deee6fca29a26a1fc3f6591b53af140f0c3', 'Bad read of key fingerprint');
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
            .then(function (key) {
                done(new Error("Pass invalid key"));
            })
            .catch(done);

        } catch (e) {
            if (e instanceof Sequelize.ValidationError) {
                // pass
                return done();
            }

            done(e);

        }
    });

});

