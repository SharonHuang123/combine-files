/* lib/echo.js */
var fs = require('fs');
var path = require('path');
var bt = new Date().valueOf();

function copy(src, dst) {
    fs.createReadStream(src).pipe(fs.createWriteStream(dst));
}

function main(argv) {
    copy(argv[0], argv[1]);
}

function travelSync(dir, callback, finish) {
    fs.readdirSync(dir).forEach(function (file) {
        var pathname = path.join(dir, file);
        if (fs.statSync(pathname).isDirectory()) {
            travelSync(pathname, callback)
        } else {
            callback(pathname);
        }
    });

    finish && finish();
}

function travel(dir, callback, finish) {
    fs.readdir(dir, function (err, files) {
        (function next(i) {
            if (i < files.length) {
                var pathname = path.join(dir, files[i]);

                fs.stat(pathname, function (err, stats) {
                    if (stats.isDirectory()) {
                        travel(pathname, callback, function () {
                            next(i + 1);
                        });
                    } else {
                        callback(pathname, function () {
                            next(i + 1);
                        });
                    }
                });
            } else {
                finish && finish();
            }

        })(0);
    })
}

var finish = function (tag) {
    var et = new Date().valueOf();
    console.log(tag + " finished, times:" + (et - bt).toString() + 'ms');
}

var callback = function (pathname, foo) {
    //console.log(pathname);
    foo && foo();
}

function root(argvs) {

    if (argvs.length < 1) {
        console.log("no dir path entry!");
    } else if (argvs.length == 1 || (argvs.length > 1 && argvs[1].toUpperCase() != '-A')) {
        travelSync(argvs[0], callback, function(){
            finish("sync");
        });
    } else {
        travel(argvs[0], callback, function(){
            finish("async");
        });
    }
}

module.exports = function (argvs) {
    root(argvs);
}