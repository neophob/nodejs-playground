var http = require('http');
var util = require('util');
var spawn = require("child_process").spawn;
var static = require('node-static');
var os = require('os');

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
io.set('log level', 1);

var pwd = '';
var comspec,comspecParam;
var connectedUser = 0;

// define interactions with client
io.sockets.on('connection', function(socket){   	   
    connectedUser++;
    console.log('user connected, connected users: '+connectedUser);    
    
    //recieve client data
    socket.on('client_data', function(data){
      //trim string
      var cmd = data.letter.replace (/^\s+/, '').replace (/\s+$/, '');
    	if (cmd === '') {
        return;
    	}
	    	
      //split up in arrays
      var cmdarray = cmd.split(' ');
      var prog = cmdarray.shift(); // get first element from array (remove)
      var args = [comspecParam, cmd];
        
 	    console.log('execute <'+comspec+'> args: '+util.inspect(args));
      var subproc = spawn(comspec, args,
      {
			 env: process.env,
			 cwd: process.cwd()
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
			        	var n=prog.search('cd');
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
    }); //end client_data
    
    socket.on('disconnect', function () {
      connectedUser--;
      console.log('user disconnected, remaining clients: '+connectedUser);
      
    });
});
  
console.log('Server started on port '+port);

var isRunningOnWindows = os.platform().search('win32');
if (isRunningOnWindows>=0) {
  comspec = 'cmd.exe';
  comspecParam = '/c';
  console.log('detected windows system');
} else {
  comspec = '/bin/bash';
  comspecParam = '-c';
  console.log('detected *nix system');  
}

