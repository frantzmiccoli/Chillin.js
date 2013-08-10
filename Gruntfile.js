/* This file is used to let Travis run QUnit tests */
module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Project configuration.
    grunt.initConfig({
        qunit: {
            files: ['tests/index.html']
        }
    });

    // Task to run tests
    grunt.registerTask('test', 'qunit');
};
