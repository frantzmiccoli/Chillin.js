/* This file is used to let Travis run QUnit tests */
module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        qunit: {
            files: ['tests/index.html']
        }
    });

    // Task to run tests
    grunt.registerTask('test', 'qunit');
};
