var child_process = require('child_process');

var launchChild = function () {
    var child = child_process.spawn('node', ['../lib/child.js'], {
        stdio: [0, 1, 2, 'ipc']
    });

    child.on('message', function (msg) {
        console.log(msg);
        process.exit(-1);
    });

    child.on('exit', function (code) {
        if (code !== 0) {
            console.log('child error');
            launchChild();
        }
    });

    child.send({ hello: 'hello' });


}

module.exports = launchChild;