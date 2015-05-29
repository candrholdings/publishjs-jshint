!function (assert, async, linq, path) {
    'use strict';

    require('vows').describe('Integration test').addBatch({
        'When reviewing passing JS file': {
            topic: function () {
                var callback = this.callback,
                    topic;

                require('publishjs')({
                    cache: false,
                    log: false,
                    processors: {
                        jsx: require('../index')
                    }
                }).build(function (pipe, callback) {
                    pipe.from(path.resolve(path.dirname(module.filename), 'integration-test-files/1'))
                        .jsx()
                        .run(callback);
                }, function (err) {
                    callback(null, err);
                });
            },

            'should returns no exceptions': function (topic) {
                assert(!topic);
            }
        },

        'When reviewing failing JS file': {
            topic: function () {
                var callback = this.callback,
                    topic;

                require('publishjs')({
                    cache: false,
                    log: false,
                    processors: {
                        jsx: require('../index')
                    }
                }).build(function (pipe, callback) {
                    pipe.from(path.resolve(path.dirname(module.filename), 'integration-test-files/2'))
                        .jsx()
                        .run(callback);
                }, function (err) {
                    callback(null, err);
                });
            },

            'should returns an exception': function (topic) {
                assert(topic);
                topic && assert.equal(topic.message, 'jshint failed');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('async'),
    require('async-linq'),
    require('path')
);