'use strict';

/** 
 * Default config
 *
 * @module config 
 */

var _ = require('underscore');

module.exports = {
    
    storage: {
        dialect: 'sqlite',
        storage: ':memory'
    }

};

/**
 * Set config 
 * @param {Object} config   - Configuration
 */
module.exports.$set = function (config) {
    _.extend(
        module.exports,
        _.omit(config, '$set')
    );
};
