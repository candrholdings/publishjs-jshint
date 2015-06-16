!function (jshint, path, util, linq) {
    'use strict';

    jshint();

    var number = util.number,
        replaceMultiple = util.regexp.replaceMultiple,
        time = util.time;

    module.exports = function (inputs, outputs, options, callback) {
        if (arguments.length === 3) {
            callback = arguments[2];
            options = null;
        }

        var that = this,
            startTime = Date.now(),
            fileCount = 0,
            totalSize = 0;

        outputs = inputs.all;
        inputs = inputs.newOrChanged;

        Object.getOwnPropertyNames(inputs).forEach(function (filename) {
            totalSize += inputs[filename].length;
            fileCount++;
            reviewFile(filename, inputs[filename].toString(), options || {}, that.log);
        });

        var elapsed = Date.now() - startTime;

        if (fileCount) {
            that.log([
                'Code reviewed ',
                fileCount,
                ' file(s), took ',
                time.humanize(elapsed),
                ' (',
                number.bytes(totalSize / elapsed * 1e3),
                '/s)'
            ].join(''));
        } else {
            that.log('No new or changed files to code review');
        }

        callback(null, outputs);
    };

    function reviewFile(filename, content, options, log) {
        var extname = (path.extname(filename) || '').toLowerCase(),
            fragments = [];

        if (extname === '.html' || extname === '.htm') {
            var pattern = /(?:<script [^>]*?type="text\/javascript"[^>]*>)([\s\S]*?)(?:<\/script>)/gmi,
                match;

            while ((match = pattern.exec(content))) {
                fragments.push({
                    lineNumberOffset: content.substr(0, match.index).split('\n').length - 1,
                    code: match[1]
                });
            }
        } else if (extname === '.js') {
            fragments.push({
                lineNumberOffset: 0,
                code: content
            });
        }

        fragments.forEach(function (fragment) {
            var result = jshint(fragment.code, options);

            if (!result) {
                log('One or more lines failed code review\n' + linq(jshint.errors).where(function (error) { return error; }).select(function (error, index) {
                    return [
                        filename,
                        ':',
                        error.line + fragment.lineNumberOffset,
                        ': ',
                        (error.evidence || '').replace(/(^\s+)|(\s+$)/g, ''),
                        ' <-- ',
                        error.reason
                    ].join('');
                }).run().join('\n'));

                throw new Error('jshint failed');
            }
        });
    }
}(
    require('jshint').JSHINT,
    require('path'),
    require('publishjs').util,
    require('async-linq')
);