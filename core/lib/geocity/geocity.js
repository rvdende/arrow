//http://dev.maxmind.com/geoip/geolite

var geocity = {}
geocity.blocks = {}
geocity.location = {}
geocity.ready = 0; //when == 2 all loaded;

geocity.lookupqueue = []

geocity.load = function () {
	var fs 			= require('fs')
	fs.readFile(__dirname + '/GeoLiteCity-Blocks.json', function(err,data) {
		if (err) console.log("Error loading config json" + err)
	  	if (data) {
			geocity.blocks = JSON.parse(data)
			//console.log(geocity.blocks.header);
			//console.log(geocity.blocks.lookup);
			geocity.ready++;
		}
	})

	fs.readFile(__dirname + '/GeoLiteCity-Location.json', function(err,data) {
		if (err) console.log("Error loading config json" + err)
	  	if (data) {
			geocity.location = JSON.parse(data)
			//console.log(geocity.location.header);
			//console.log(geocity.location.lookup);
			geocity.ready++;
		}
	})		
	console.log('GeoCity Loaded.')	

}


geocity.lookup = function(ip) {
	//LAT/LONG Database
	//http://dev.maxmind.com/geoip/csv	
	if (geocity.ready == 2) {
		var ip_prep = ip;
		ip_prep = ip_prep.split('.');            
	    var integer_ip = (16777216*ip_prep[0])+(65536*ip_prep[1])+(256*ip_prep[2])+(ip_prep[3]*1);

	    for (var c in geocity.blocks.database) {
	    	if (geocity.blocks.database[c][0] > integer_ip) { 
	    		var block = geocity.blocks.database[c-1]
	    		return geocity.location.database[block[2]-1];
	    		break; 
	    	}
	    }
	}
}


//geocity.load();
//geocity.lookup('197.169.82.224');
//geocity.process();

module.exports = geocity;