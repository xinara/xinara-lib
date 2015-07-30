'use stricts';

var assert  = require('assert'),
    Sequelize = require('sequelize'),
    path    = require('path'),
    config  = require('../lib/config');

var tmpmark = (new Date()).getTime();
var dbpath = path.resolve(__dirname + '/tmp/' + tmpmark.toString(36) + '.dat');

config.$set({
    storage: {
        dialect: 'sqlite',
        storage: dbpath
    }
});

var ServerModel = require('../lib/models/servers');

describe("Checking server model", function () {

    it("Sync model schema", function (done) {
        ServerModel.sync({
            force: true
        })
        .then(function () {
            done();
        })
        .catch(function (e) {
            done(e);
        });
    });

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
        .catch(function (e) {
            done(e);
        });

    });

    it ("Try to create invalid url server", function (done) {

        ServerModel.create({
            name: 'My other server',
            url: 'this is a invalid domain',
            keyId: 'f140f0c3'
        })
        .then(function (server) {
            done(new Error("Invalid url pass"));
        })
        .catch(function (e) {
            if (e instanceof Sequelize.ValidationError) {
                // pass 
                return done();
            } 

            done(e);
        });



    });

});

