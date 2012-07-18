var GREPFILE = '/data/log/nas-core/info.log';

var http = require('http');
var util = require('util');
var spawn = require("child_process").spawn;
var static = require('node-static');

var file = new(static.Server)('./clientfiles/');
var port = process.env.PORT || 8001;
var server = http.createServer(function(request, response){
	request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    });
}).listen(port);


// use socket.io
var io = require('socket.io').listen(server);

//turn off debug
io.set('log level', 2);

var connectedUser = 0;
var subproc=0;

// define interactions with client
io.sockets.on('connection', function(socket){   	   
	connectedUser++;
	console.log('user connected, connected users: '+connectedUser);    
    
	if (subproc===0) {
		console.log('start child process');
		subproc = spawn('/bin/bash', ['-c', 'tail -f '+GREPFILE] );
	}

	subproc.stdout.on('data', function(data) {
		//console.log('got stdout data');
		socket.emit('out', {'text': data.toString() });
	});

	subproc.stderr.on('data', function(data) {
		console.log('got stderr data');
		socket.emit('out', {'text': data.toString() });
	});
			
	subproc.on('exit', function(code) {
		if (code != 0 && code != null) {
			console.log('Failed: ' + code);
		}
	});
    
	socket.on('disconnect', function () {
		connectedUser--;
		console.log('user disconnected, remaining clients: '+connectedUser);
		if (connectedUser===0) {
			console.log('kill child process');
			subproc.kill('SIGHUP');
			subproc = 0;
		}        
	});
}); 
  
console.log('Server started on port '+port);
