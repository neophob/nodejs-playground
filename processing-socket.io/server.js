
var http = require('http');
var util = require('util');
var spawn = require("child_process").spawn;
var static = require('node-static');
var events = require('events');
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

var newDataEmitter = new events.EventEmitter();

//TODO make async function to get json data, handle response in a callback
function getHistoryAareData() { 	
	var req = http.request({ host: 'aare.schwumm.ch', path: '/api/archive' }, function(res) {
		var body = '';
  		res.setEncoding('utf8');
  		res.on('data', function (chunk) {
    		body += chunk;
    		//console.log(body);
  		});
	    res.on('end', function() {
      		var aareData = JSON.parse(body);

          var date = aareData.data.datetime;
          var values = aareData.data.temperature;

          for(var i = 0; i < date.length; i++) {
            if (date[i] !== null && values[i] !== null) {
              var sendData = {'temperature': values[i], 'date': date[i]};
              console.log(sendData);
              newDataEmitter.emit('bang', sendData);
            }            
          }
      		//TODO
    	});
	});
	req.on('error', function(e) {
  		console.log('problem with request: ' + e.message);
	});
	req.end();	
}


function getCurrentAareData() { 
	var req = http.request({ host: 'aare.schwumm.ch', path: '/aare.json' }, function(res) {
		var body = '';
  		res.setEncoding('utf8');
  		res.on('data', function (chunk) {
    		body += chunk;
  		});
	    res.on('end', function() {
          console.log(body);
      		var aareData = JSON.parse(body);
            if (aareData.temperature > 0) {  
                console.log(util.inspect(aareData));
                newDataEmitter.emit('bang', aareData);
            }  
    	});
	});
	req.on('error', function(e) {
  		console.log('problem with request: ' + e.message);
	});
	req.end();	
}
//setInterval(getCurrentAareData, 1000);
setInterval(getHistoryAareData, 3000);

// use socket.io
var io = require('socket.io').listen(server);

//turn off debug
io.set('log level', 2);

// define interactions with client
io.sockets.on('connection', function(socket){   	   
    console.log('socket connection!');

    newDataEmitter.addListener('bang', function (aareData) {
    	socket.emit('bang', {'temp': aareData.temperature });	
	});

	socket.on('disconnect', function () {
		console.log('socket disconnected');
	});
}); 
  
console.log('Server started on port '+port);

