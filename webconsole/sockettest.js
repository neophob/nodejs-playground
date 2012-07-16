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
      //trim string
      var cmd = data.letter.replace (/^\s+/, '').replace (/\s+$/, '');
    	if (cmd !== '') {
	    	console.log('execute <'+cmd+'>');
			exec(cmd, function (error, stdout, stderr) {
				var output = '';				
				
				if (stderr !== '') {
					output = output+'\n'+stderr;
				} else {
          output = stdout;
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
