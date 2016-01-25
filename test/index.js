

/**
 * Requirements
 */

var chai = require('chai'),
    assert = require('chai').assert,
    chaiAsPromised = require('chai-as-promised');
    resumePdfToJson = require('../index');


chai.use(chaiAsPromised);


/**
 * Test Descriptions
 */

describe('resumePdfToJson', function() {


    var path = 'test/JasonNode.pdf';
    var output = 'test/JasonNode.json';

    var p = resumePdfToJson(path, {'output': output})
        .then(function(data) {
            return data;
        });

    it('The resumePdfToJson(...) promise is fullfilled.', function() {
        return assert.isFulfilled(p);
    });


});

