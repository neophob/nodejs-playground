var GREPFILE = '/var/log/system.log';

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

// define interactions with client
io.sockets.on('connection', function(socket){   	   
    console.log('connection!');

	setInterval(function() {
	    console.log('send new trigger');
	    socket.emit('bang', {'temp': Math.random() });	
	}, 1000 );

	socket.on('disconnect', function () {
		console.log('disconnected');
	});
}); 
  
console.log('Server started on port '+port);
