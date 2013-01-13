console.log('loading arrow/core/index.js');

var arrow = {}
arrow.datainterval = 10000;
arrow.dataunsaved = false; //Flags true when our memory changes and causes a disc write; defaults to false when idle.

//useful for country lookup
var maxmind = require("./lib/geo/maxmind.js");
arrow.geo = new maxmind.GeoIP();
if (arrow.geo.getCountry("41.133.21.167") == "South Africa")  { arrow.geoEnabled = true; } else { arrow.geoEnabled = false; };

//lat/long and city lookup
arrow.geocity = require("./lib/geocity/geocity.js");
arrow.geocity.load();



arrow.status = function(database, req) {

	var os = require('os');
	var user = {}

	if (req.session.loggedin) {
		user.name = req.session.loggedin.name;
		user.hash = req.session.loggedin.hash;
	} else {
		user.name = 'guest'
		user.hash = ''
	}

	//GET GEO
	var geoloc = arrow.geo.getCountry(req.ip);
	if (geoloc == '') {geoloc = 'unknown'}

	var geofull = arrow.geocity.lookup(req.ip);
	var geo = {
  		country : geofull[1],
  		region : geofull[2],
  		city : geofull[3],
  		postalCode : geofull[4],
  		latitude : geofull[5],
  		longitude : geofull[6],
  		metroCode : geofull[7],
  		areaCode : geofull[8]
	}
	
    //logged in?
	req.session.loggedin = req.session.loggedin ? req.session.loggedin : 0;

	//finds earliest date in database
	var datastart = Date.now();
	for (var entry in database) {
		if (database[entry].timestamp < datastart) {datastart = database[entry].timestamp};
	}

	return {
		type: "api",
		ip: req.ip,
		country: geoloc,
		geo: geo,
		name: user.name,
		hash: user.hash,
		pid: process.pid, 
		referer: req.header('Referer'),
		host : req.headers.host,
		useragent: req.headers['user-agent'],		
		memory: process.memoryUsage().rss/1024/1024,
		memoryusage: process.memoryUsage(),
		uptime: process.uptime(),
		osuptime: new Date(Date.now() - (os.uptime()*1000)),
		servertime: Date.now(),
		serverdate:  new Date(),
		started: new Date(Date.now() - (process.uptime()*1000)),
		datastart: datastart,
		dataentries: database.length,
		os: { 
			hostname: os.hostname(),
			type: os.type(),
			platform: os.platform(),
			arch: os.arch(),
			release: os.release(),
			uptime: os.uptime(),
			loadavg: os.loadavg(),
			totalmem: os.totalmem(),
			freemem: os.freemem(),
			cpus: os.cpus(),
			networkInterfaces: os.networkInterfaces()
		},		
		//connections: server.connections,
	}
}

arrow.fs = function(dir, done) {
	var fs = require('fs');
	var results = [];
	  fs.readdir(dir, function(err, list) {
	    if (err) return done(err);
	    var pending = list.length;
	    if (!pending) return done(null, results);
	    list.forEach(function(file) {
	    	var name = file;
	    	
	      file = dir + '/' + file;
	      fs.stat(file, function(err, stat) {
	        if (stat && stat.isDirectory()) {
	        	//console.log(name)
	          arrow.fs(file, function(err, res) {
	            results = results.concat(res);
	            if (!--pending) done(null, results);
	          });
	        } else {
	          results.push(file);
	          if (!--pending) done(null, results);
	        }
	      });
	    });
	  });
};



arrow.eventmake = function(req) {
	arrow.dataunsaved = true; //event occured, so it will be logged to disc
	//LOGGEDIN?
	req.session.loggedin = req.session.loggedin ? req.session.loggedin : 0;

	//GET GEO
	var geoloc = arrow.geo.getCountry(req.ip);
	if (geoloc == '') {geoloc = 'unknown'}

	if (req.session.loggedin.name === undefined) {
		
	};
	
	var arrowevent = {
		type: "visit",
		ip: req.ip,
		country: geoloc,
		referer: req.header('Referer'),
		host : req.headers.host,
		//hosta: req.host,
		useragent: req.headers['user-agent'],
		timestamp: Date.now(),
		datestamp: new Date(),
		url: req.url,
		method: req.method,
		name : req.session.loggedin.name
		}
		
	if (req.body) {
		for (var item in req.body) {
			arrowevent[item] = req.body[item];
		}
	}
		
	if (req.session.loggedin.name === undefined) {
		arrowevent.name = 'guest';
	};
		
	//console.log(arrowevent);	
	return arrowevent;
}

arrow.record = function(database, entry) {
	//macro to save to the database
	//todo add auth/duplicate/checking etc
	console.log('!')
	database.push(entry)
}

arrow.secureuserhash = function(user, salt){
  //takes in a string and spits out a md5 hash
  //todo: retrieve salted hash from arduino/external physical device
  var secret = salt;  
  var crypto = require('crypto');
  var md5sum = crypto.createHash('md5');
  md5sum.update(user.username + user.password + secret);
  return md5sum.digest('hex');
 }

arrow.signup = function(database, user) {
	//Checks if its fine if user signs up to database
	var exists = 0;
	for (var entry in database) {
		if (database[entry].type == "signup") {
			if (database[entry].username == user.username) {				
				exists += 1;
				return exists;				
			} 
		}
	}
	return exists;
}



arrow.save = function(database, jsonfile) {
	var fs = require('fs');
	arrow.dataunsaved = false; //NO UNSAVED DATA LEFT
	fs.writeFile(__dirname + "/../"+jsonfile, JSON.stringify(database), 'utf8', function(err) {
		if (err) throw err;
		console.log('Saved : ' + database.length + ' entries' );
	})
}



module.exports = arrow;


