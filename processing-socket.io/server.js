//TODO cach date and temp values

var http = require('http');
var util = require('util');
var spawn = require("child_process").spawn;
var staticServ = require('node-static');
var events = require('events');
var file = new(staticServ.Server)('./clientfiles/');
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

//grab some raw data
function getJsonData(option, callback) {
  var req = http.request(option, function(res) {
    var body = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        body += chunk;
    });
    res.on('end', function() {
        callback(body);
    });
  });
  req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
  });
  req.end();  
}

//TODO make async function to get json data, handle response in a callback
function getHistoryAareData() {
  console.log('fetch initial data');
  getJsonData({ host: 'aare.schwumm.ch', path: '/api/archive' }, function(body) {
    var aareData = JSON.parse(body);

    var date = aareData.data.datetime;
    var values = aareData.data.temperature;

    for(var i = 0; i < date.length; i++) {
       if (date[i] !== null && values[i] !== null) {
         var sendData = {'temperature': values[i], 'date': new Date(Date.parse(date[i], "yyyy-MM-dd HH:mm:ss"))};
         console.log(sendData);
         newDataEmitter.emit('bang', sendData);
       }            
    }
    console.log('initial data fetch complete...');
  });
}

var lastDate=0;
function getCurrentAareData() { 
  getJsonData({ host: 'aare.schwumm.ch', path: '/aare.json' }, function(body) {  
    var aareData = JSON.parse(body);

    //parse date
    var newTimestamp  = new Date(Date.parse(aareData.date,"yyyy-MM-dd HH:mm:ss"));
    if (aareData.temperature > 0 && newTimestamp>lastDate) {          
        var sendData = {'temperature': aareData.temperature, 'date': newTimestamp};
        console.log(sendData);
        newDataEmitter.emit('bang', sendData);        
        lastDate = newTimestamp;        
    }  
  });
}

//get initial data
//setTimeout(getHistoryAareData(), 1000);
//get up to date data
setInterval(getCurrentAareData, 6000);


// use socket.io
var io = require('socket.io').listen(server);

//turn off debug
io.set('log level', 2);

// define interactions with client
io.sockets.on('connection', function(socket){   	   
    console.log('socket connection!');

    getHistoryAareData();

    newDataEmitter.addListener('bang', function (aareData) {
    	socket.emit('bang', {'temp': aareData.temperature, 'date': aareData.date });	
	});

	socket.on('disconnect', function () {
		console.log('socket disconnected');
	});
}); 
  
console.log('Server started on port '+port);

