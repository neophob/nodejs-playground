var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require("path");
var server;
var util = require('util');
var exec = require("child_process").exec;

server = http.createServer(function(req, res){
    // your normal server code
    var uri = url.parse(req.url).pathname;
    var filename = path.join(process.cwd(), uri);
    
    //serv static files
    fs.exists(filename, function(exists) {
    	if (!exists) {
      		res.writeHead(404, {"Content-Type": "text/plain"});
      		res.write("404 Not Found\n");
      		res.end();
      		return;
    	}
    
    	fs.readFile(filename, "binary", function(err, file) {
      		if(err) {        
        		res.writeHead(500, {"Content-Type": "text/plain"});
        		res.write(err + "\n");
        		res.end();
        		return;
      		}
      		res.writeHead(200);
      		res.write(file, "binary");
      		res.end();
    	});
  	});      
}),

server.listen(8001);

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
	    	console.log('execute '+data.letter);
			exec(data.letter, function (error, stdout, stderr) {
				var output = stdout;
				
				if (stderr !== '') {
					output = output+'\n'+stderr;
				}
				
	    		console.log('stdout: '+output);
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
