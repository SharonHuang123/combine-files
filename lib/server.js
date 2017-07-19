var fs = require('fs'),
    path = require('path'),
    http = require('http');

var MIME = {
    '.css': 'text/css',
    '.js': 'application/javascript'
};

function combineFiles(pathnames, callback) {
    var output = [];

    (function next(i, len) {
        if (i < len) {
            fs.readFile(pathnames[i], function (err, data) {
                if (err) {
                    callback(err);
                } else {
                    output.push(data);
                    next(i + 1, len);
                }
            });
        } else {
            callback(null, Buffer.concat(output));
        }
    }(0, pathnames.length));
}

function validateFiles(pathnames, callback) {
    (function next(i, len) {
        if (i < len) {
            fs.stat(pathnames[i], function (err, stat) {
                if(err){
                    callback(err);
                }else if(!stat.isFile()){
                    callback(new Error());
                }else{
                    next(i+1, len);
                }
            })
        } else {
            callback(null,pathnames);
        }

    })(0, pathnames.length);
}

function outputFiles(pathnames, writer){
    (function next(i, len){
        if(i<len){
            var reader = fs.createReadStream(pathnames[i]);
            reader.pipe(writer, {end:false});
            reader.on('end',function(){
                next(i+1, len);
            })
        }else{
            writer.end();
        }

    })(0, pathnames.length);
}

function parseURL(root, url) {
    var base, pathnames, parts;

    if (url.indexOf('??') === -1) {
        url = url.replace(/\/(?!\w*\/)/, "/??");
    }

    parts = url.split('??');
    base = parts[0];
    pathnames = parts[1].split(',').map(function (value) {
        return path.join(root, base, value);
    });

    return {
        mime: MIME[path.extname(pathnames[0])] || 'text/plain',
        pathnames: pathnames
    };
}

function main(argv) {
    var config = JSON.parse(fs.readFileSync(argv[0], 'utf-8')),
        root = config.root || '.',
        port = config.port || 80;

    var server = http.createServer(function (request, response) {
        var urlInfo = parseURL(root, request.url);

        validateFiles(urlInfo.pathnames, function (err, pathnames) {
            if (err) {
                response.writeHead(404);
                response.end(err.message);
            } else {
                response.writeHead(200, {
                    'Content-Type': urlInfo.mime
                });
                //response.end(data);
                outputFiles(pathnames, response);
            }
        });
    }).listen(port);

    process.on("SIGINT",function(){
        server.close(function(){
            console.log("SIGINT2");
            process.exit(0);
        })
    })
}

main(process.argv.slice(2));

