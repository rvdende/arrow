//Arrow arduino connector
// This connects to your arduino over serial, parses json sent from arduino 
// and relays to any listening node socket.io server

//DATA SAVE
var datasamples = [];

//TO DISC
var fs = require('fs') //filesystem

var savedatasamples = function() {
	fs.writeFile(__dirname + "/public/record.json", JSON.stringify(datasamples), 'utf8', function(err) {
		if (err) throw err;
		console.log('Saved '+__dirname + '/record.json  ('+datasamples.length+' entries)');
	})
}

//NETWORK SOCKETS

var io = require('socket.io-client');
var socket = io.connect('http://127.0.0.1:3000');
var SerialPort = require("serialport");

//FIND ARDUINO
var arduino = 'unset';
SerialPort.list( function (err, ports) {
	ports.forEach( function(port) {
		if (port.pnpId.indexOf('duino') > 0) {
			console.log('FOUND ARDUINO')
			console.log('PORT:'+port.comName);
			console.log('ID:'+port.pnpId);		
			//console.log(port.manufacturer);
			arduino = new SerialPort.SerialPort('/dev/serial/by-id/'+port.pnpId, {
			          baudrate: 115200 //Make sure your arduino is set to this rate
			        });			
			setup();
		} else {
			console.log('Unknown device! PORT:'+port.comName + 'ID:'+port.pnpId);					
		}		
	});
	if (arduino == 'unset') {
		console.log('COULD NOT FIND ARDUINO!')
	}
});

//CONNECTED ARDUINO STREAM
var setup = function() {
	var createScraper = require('json-scrape');
	var scraper = createScraper();
	var counter = 0;

	//Handle data from arduino serial connection
	arduino.on("data", function (data) { scraper.write(data); });
	console.log('Connected to Arduino!')

	scraper.on('data', function (obj) {
		//Add time data
		obj.uptime = process.uptime();
		obj.servertime = Date.now();
		obj.serverdate = new Date();
    	
		//Push to screen
    	console.log(obj)

    	//Save to datasamples (See top)
    	datasamples.push(obj);
    	if (datasamples.length % 1000 == 0) { // every x samples
    		console.dir('save to disc!');    
    		savedatasamples(); //store to disc
    	}
    	
	});
	

}

