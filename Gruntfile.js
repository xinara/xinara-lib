/*global module:false*/
module.exports = function(grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>' + '\n' +
                '<%= pkg.homepage ? "* " + pkg.homepage : "" %>' + '\n' +
                ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' + '\n' +
                ' * License: <%= _.pluck(pkg.licenses, "type").join(", ") %> ' +
                '(<%= _.pluck(pkg.licenses, "url").join(", ") %>)' + '\n' +
                ' */\n\n'
        },
        jshint: {
            options: {
                reporter: require('jshint-stylish'),
                jshintrc: true
            },
            xinara: {
                src: [
                    'index.js',
                    'lib/*.js',
                    'lib/**/*.js'
                ]
            }
        },
        simplemocha: {
            options: {
                timeout: 3000,
                ignoreLeaks: false,
                uid: 'bdd',
                reporter: 'spec'
            },
            all: {
                src: ['test/*.js']
            }
        },
        jsdoc: {
            dist: {
                src: [
                    'README.md',
                    'index.js',
                    'lib/**/*.js'
                ],
                options: {
                    destination: 'docs',
                    template: "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                    configure: "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template/jsdoc.conf.json"
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-jsdoc');

    // Custom tasks
    grunt.registerTask('check', ['jshint']);
    grunt.registerTask('test', ['simplemocha']);

    // Default task
    grunt.registerTask('default', ['check']);

};
