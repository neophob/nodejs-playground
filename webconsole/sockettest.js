var http = require('http');
var util = require('util');
var exec = require("child_process").exec;
var static = require('node-static');

var file = new(static.Server)('./');
var server = http.createServer(function(request, response){
	request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    });
}).listen(8001);


// use socket.io
var io = require('socket.io').listen(server);

//turn off debug
io.set('log level', 1);

var pwd = '';
// define interactions with client
io.sockets.on('connection', function(socket){   	   

    //recieve client data
    socket.on('client_data', function(data){
    	if (data.letter) {
	    	console.log('execute <'+data.letter+'>');
			exec(data.letter, function (error, stdout, stderr) {
				var output = stdout;
				
				if (stderr !== '') {
					output = output+'\n'+stderr;
				}
				
	    		console.log('stdout: <'+output+'>');
	    		socket.emit('out', {'text': output});
	    		if (error !== null) {
	    			console.log(stderr);
//	    			socket.emit('out', {'text': stderr});
	    		}	    		
	  		});	    	       				
    	}
    });
});
console.log('Server started');
