// Arrow command line relay
// this program scans for connected devices and relays communication to a socket server

var datasamples = []; //we'll save our data in here

var config = {}
var fs 			= require('fs')
fs.readFile(__dirname + '/config.json', function(err,data) {
	if (err) console.log("Error loading config json" + err)
  	if (data) {
		config = JSON.parse(data)
		startarduino();
		startmidi(); 
	}
})	

//
////////// ARDUINO ////////////////////////////////////////////////////////////////
//

function startarduino() {
	var io = require('socket.io-client');
	var socket = io.connect('http://'+config.domain+':'+config.httpport);
	var SerialPort = require("serialport"); //so we can access the serial port

	var arduino = 'unset';
	SerialPort.list( function (err, ports) {
		ports.forEach( function(port) {
			if (port.pnpId.indexOf('duino') > 0) {
				console.log('FOUND ARDUINO')
				//console.log('PORT:'+port.comName);
				//console.log('ID:'+port.pnpId);		
				//console.log(port.manufacturer);
				arduino = new SerialPort.SerialPort('/dev/serial/by-id/'+port.pnpId, {
				          baudrate: 115200 //Make sure your arduino is set to this rate
				        });			
				setup();
			} else {
				//console.log('Unknown device! PORT:'+port.comName + 'ID:'+port.pnpId);					
			}		
		});
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
			obj.type = "adc";
	    	
			//Push to screen
	    	console.log(obj)
	    	socket.emit('data', obj);
	    	//Save to datasamples (See top)
	    	datasamples.push(obj);
	    	if (datasamples.length % 1000 == 0) { // every x samples
	    		console.dir('save to disc!');    
	    		//savedatasamples(); //store to disc
	    	}
	    	
		});
	}
}
//
////////// MIDI ////////////////////////////////////////////////////////////////
//
function startmidi() {
	var midi = require('midi');

	// Set up a new input.
	var input = new midi.input();

	// Count the available input ports.
	//console.log('input.getPortCount();' + input.getPortCount() )

	for (var i = 0; i < input.getPortCount(); i++)
	{
		console.log('input.getPortName('+i+')' + input.getPortName(i) )
	}

	if (input.getPortCount() > 0) {
		input.openPort(input.getPortCount()-1); //Select midi device number CONFIG THIS!

		input.on('message', function(time, data) {
			var obj = {}
			obj.type = "midi"
			obj.uptime = process.uptime();
			obj.servertime = Date.now();
			obj.serverdate = new Date();
			obj.midi = {data: data, time: time}
			obj.midiparse = {}
			if (data[0]==144) {obj.midiparse.press = "down"}
			if (data[0]==128) {obj.midiparse.press = "up"}
			obj.midiparse.key = data[1];
			obj.midiparse.speed = data[2];
			obj.midiparse.time = time;
		  	console.log(obj)
		  	socket.emit('data', obj);
		}); 
	}
}

//
///////// LOCAL STORAGE ////////////////////////////////////////////////////////////
//

var fs = require('fs') //so we can use the filesystem
var savedatasamples = function() {
	//save to local disc
	fs.writeFile(__dirname + "/record.json", JSON.stringify(datasamples), 'utf8', function(err) {
		if (err) throw err;
		console.log('Saved '+__dirname + '/record.json  ('+datasamples.length+' entries)');
	})
}
