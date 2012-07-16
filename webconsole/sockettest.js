var http = require('http');
var util = require('util');
var spawn = require("child_process").spawn;
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
      //trim string
      var cmd = data.letter.replace (/^\s+/, '').replace (/\s+$/, '');
    	if (cmd !== '') {
	    	console.log('execute <'+cmd+'>');
	    	
	    	//split up in arrays
	    	var cmdarray = cmd.split(" ");
	    	var process = cmdarray.shift(); // get first elemet from array (remove)
			var subproc = spawn(process, cmdarray);
			
			subproc.stdout.on('data', function(data) {
				console.log('got stdout data');
				//console.log(util.inspect(data));
				socket.emit('out', {'text': data.toString() });
			});

			subproc.stderr.on('data', function(data) {
				console.log('got stderr data');
				socket.emit('out', {'text': data.toString() });
			});
			
			subproc.on('exit', function(code) {
		        if (code != 0) {
		            console.log('Failed: ' + code);
		        }				
			});
	  			    	       				
    	}
    });
});
console.log('Server started');
