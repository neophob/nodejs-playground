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
	    	var cmd = cmdarray.shift(); // get first elemet from array (remove)
			var subproc = spawn(cmd, cmdarray, 
			{
			   env: process.env,
			   cwd: process.cwd,
			   stdio: [ 'pipe', 'pipe', 'pipe' ]
			 });			
			
			subproc.stdout.on('data', function(data) {
				console.log('got stdout data');
				socket.emit('out', {'text': data.toString() });
			});

			subproc.stderr.on('data', function(data) {
				console.log('got stderr data');
				socket.emit('out', {'text': data.toString() });
			});
			
			subproc.on('exit', function(code) {
		        if (code != 0) {
		            console.log('Failed: ' + code);
		        } else {
		        	
		        	//pretty ugly hack to change workign dir...
		        	try {
			        	var n=cmd.search('cd');
			        	if (n>=0 && cmdarray.length>0) {
			        		console.log('found cd command');
		    	    		switch (cmdarray[0]) {
		        				case '.': 	//nothing to do
		        					break;	
		        					
		        				case '..': 
		        					process.chdir(process.cwd()+'/..');	
		        					break;
		        				
		        				default: 
		        					process.chdir(cmdarray[0]);
		        			}	
		        		}
		        	} catch (err) {
		        		console.log('error while chdir: ' + err);	
		        	}
		        }
//		        console.log(util.inspect(subproc));		
			});
	  			    	       				
    	}
    });
});
console.log('Server started');
