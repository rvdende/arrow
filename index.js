'use strict';

var database = [];				//all in memory. yes. srsly. its fast.
var core = require('./core'); 	//arrow core functions

var config = {}
var fs 			= require('fs')
fs.readFile(__dirname + '/config.json', function(err,data) {
	if (err) console.log("Error loading config json" + err)
  	if (data) {
		config = JSON.parse(data)
		startserver();
		startmailserver(); 
	}
})	

//LOAD MODULES
//npm install express 
//npm install imagemagick   //this also requires the imagemagick binary tool
var http 		= require('http');
var https 		= require('https');
var ecstatic 	= require('ecstatic');
var im 			= require('imagemagick'); 
var util 		= require('util');
var express 	= require('express');

var app 		= express();


//When everything is loaded we call startserver()
function startserver() {
	console.log(config);

	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({cookie: { path: '/', httpOnly: true, maxAge: 9999999 }, secret: config.sessionsecret }));

	var server 		= app.listen(config.httpport, config.domain);
	var io 			= require('socket.io').listen(server);	

	io.set('log level', 1);

	io.sockets.on('connection', function(socket) {
	  	socket.on('data', function(data) {
	  		console.log(data);
	    	database.push(data);
	    	io.sockets.emit('data',  data);	
	  	});
	});


	app.get('/', function(req,res) {
		var arrowevent = core.eventmake(req);	
		core.record(database, arrowevent);
		io.sockets.emit('event',  arrowevent );	
		if (req.session.loggedin) {
			//logged in users
			var site = fs.createReadStream('public/dash.html');
			site.readable = true;
			site.pipe(res, {end: true}); 	
		} else {
			//visiting guests/anon
			var site = fs.createReadStream('public/index.html');
			site.readable = true;
			site.pipe(res, {end: true}); 	
		}
	})


	/////////////
	/////////////   ADMIN
	/////////////

	app.get('/admin', function (req, res) {
		if (req.session.loggedin) {
			var arrowevent = core.eventmake(req);	
			core.record(database, arrowevent);
			io.sockets.emit('event',  arrowevent );	
			var site = fs.createReadStream('public/admin/index.html');
			site.readable = true;
			site.pipe(res, {end: true}); 
		} else {
			res.redirect('/login')
		}
	});

	app.get('/admin/mailtest', function (req, res) {
		mailbotsender();
		res.send('mail test sent');
	});	

	/////////////
	/////////////   ACCOUNTS
	/////////////

	app.get('/login', function (req, res) {
		//login page
		var readStream = fs.createReadStream('public/login.html')
		readStream.pipe(res);
	})

	app.post('/login', function (req, res) {
		//login request post
		var user = {
			username: req.body.username,
			password: req.body.password
		}
		//generate a secure hash for this person, we do not save the password.
		user.hash = core.secureuserhash(user, config.dbhashsecret )
		delete user.password;
		delete req.body.password;

		user.type = "login"
		for (var entry in database) {
			if (database[entry].type == "signup") {
				if (database[entry].username == user.username) {
					//username found
					user.exists = true;
					if (database[entry].hash == user.hash) {
						user.auth = true;
						req.session.loggedin = {username: user.username, hash: user.hash }
						res.redirect('/')
					}
				}
			}
		}
	})

	app.get('/signup', function (req, res) {
		//signup form
		var readStream = fs.createReadStream('public/signup.html');
		readStream.pipe(res);
	});

	app.get('/signup/taken', function (req, res) {
		//signup was taken form
		var readStream = fs.createReadStream('public/signuptaken.html');
		readStream.pipe(res);
	});

	app.post('/signup', function (req, res) {
		//we get a request for a new account from a user
		//req.body is from a html form
		var user = {
			username: req.body.username,
			password: req.body.password
		}
		//generate a secure hash for this person, we do not save the password.
		var hash = core.secureuserhash(user, config.dbhashsecret )
		delete user.password;
		delete req.body.password;
		user.hash = hash;
		var arrowevent = core.eventmake(req);
		
		if (core.signup(database, user) == 0) {
			arrowevent.type = "signup";
			arrowevent.name = user.username;
			arrowevent.hash = user.hash;
			core.record(database,arrowevent);
			req.session.loggedin = {};
			req.session.loggedin.name = user.username;
			req.session.loggedin.hash = user.hash;
			res.redirect('/');

		} else { res.redirect('/signup/taken');}
	});

	app.get('/logout', function(req, res) {
		delete req.session.loggedin;
		res.redirect('/')
	});

	/////////////
	/////////////   SYSTEM API
	/////////////

	app.post('/api', function(req, res) {
		var query = req.body;
		
		if (query.type == "search") {
			var search = query.search;
			var result = [];
			for (var entry in database)	{ //Cycle over database
				var perfectmatch = 0;
				var counter = 0;
				for (var property in search) { //Do matching
					counter++;
					if ((typeof(database[entry][property]) == 'string') && (query.matchcase == "false")) {						
						//Case insenstive

						if (database[entry][property].toLowerCase() == search[property].toLowerCase()) {
							perfectmatch ++;
						}
					} 
					else 
					{						
						//console.log('test '+ database[entry][property] + ' == ' + search[property])
						//Case sensitive
						if (database[entry][property] == search[property]) {
							perfectmatch ++;
						}	
					}
				}//end matching

				//add if matched successfuly
				if ((counter > 0) &&(perfectmatch == counter)) {
					result.push(database[entry])
				}
			}//cycled over em all

			//send it!! it is done.
			res.send(result);
		}//end "search"

		//add more types

		//add more types

		//add more types

	})

	app.get('/api/database', function(req,res) {
		res.send(database)
	})

	app.get('/api/status', function(req, res) {
		res.send(core.status(database, req));
	});

	app.get('/api/fs', function(req, res) {
		//this lists all the public files in an array, to be used with editor later
		core.fs(__dirname + "/public", function(err, results) {
	  		if (err) throw err;
	  		res.send(results);  		
		});
	});


	/////////////
	/////////////   STATIC FILES 
	/////////////

	app.use(ecstatic(__dirname + '/public', { showdir : true }));

	console.log("Webserver started.")
}
//END startserver() function

/////////////
/////////////   	MAIL SERVER adapted from mailbot
/////////////		
/////////////		https://github.com/fluentart/mailbot
/////////////   
/////////////

function startmailserver() {
	var net = require('net');
	var mailbot = net.createServer(function (socket) {
		socket.write('220 '+config.domain+' ESMTP ArrowMailbot\n')
		var incmail = {}
		var recievingdata = false;
		incmail.rcpt = [];
		incmail.message = "";
	    socket.on("data", function(data) {
	        var datastr = data.toString();
	        if (datastr.indexOf("EHLO") == 0) {
	        	incmail.client = datastr.slice(5,datastr.length)
	        	incmail.client = incmail.client.replace(/(\r\n|\n|\r)/gm," "); //CLEAN
	        	socket.write('250 Hello '+incmail.client+', whats up?\n')
	        }

	        if (datastr.indexOf("MAIL FROM:") == 0) {
	        	incmail.from = datastr.slice(datastr.indexOf("<")+1, datastr.indexOf(">"))
	        	incmail.from = incmail.from.replace(/(\r\n|\n|\r)/gm," ");
	        	socket.write('250 Ok\n')
	        }

	        if(datastr.indexOf("RCPT TO:") == 0) {
	        	var rcpt = datastr.slice(datastr.indexOf("<")+1, datastr.indexOf(">"))
	        	incmail.rcpt.push(rcpt);
	        	socket.write('250 Ok\n')	
	        }

	        if(datastr.indexOf("DATA") == 0) {
	        	recievingdata = true;
	        	socket.write('354 End data with <CR><LF>.<CR><LF>\n');
	        }

	        if (recievingdata == true) { incmail.message += datastr; }

	        if (datastr.indexOf("\r\n.\r\n") >= 0) {
	        	recievingdata = false;
	        	socket.write('250 Ok: queued as 12345\n')	
	            var MailParser = require("mailparser").MailParser;
	            var mailparser = new MailParser();
	            
	            mailparser.on("headers", function(headers){
	            	console.log(headers.received);
	            });

	            mailparser.on("end", function(mail){
	            	//final parsed email so this goes into the database
	            	database.push(mail);	            
	            });
	          
	          mailparser.write(incmail.message);
	          mailparser.end();
	       	  console.log('new mail.')
	        }

			if (datastr.indexOf("QUIT") == 0) {
	        	socket.write('221 Bye\n')	
	        	socket.end();
	        }

	    });
	});

	mailbot.listen(config.mailport, config.domain);
	console.log("Mailserver started.")
}

/////////////
/////////////   	MAIL Sender adapted from mailbot
/////////////		
/////////////		https://github.com/fluentart/mailbot
/////////////   
/////////////

function mailbotsender() {
	  //todo
      var mailbot = {}
      // mail.yourdomain.com   or just   yourdomain.com   check your domain mx record
      mailbot.server = config.maildomain; //this should be our server we are sending from (mx) check config.json

      //EMAIL START
      var email = {}
      email.from = "test@fluentart.com";
      email.rcpt = "rouan@8bo.org";
      email.data = 'From: "Test" <test@fluentart.com>\n';
      email.data += 'To: "Rouan van der Ende" <rouan@8bo.org>\n';
      email.data += 'Date: Sun, 6 January 2013 23:25:23 +0200\n';
      email.data += 'Subject: Test mail!\n';
      email.data += '\nHello Rouan.\n';
      email.data += 'Test maaaail incoming!\n\n\r\n.\r\n';
      //EMAIL END

      email.rcptdomain = email.rcpt;
      email.rcptdomain = email.rcptdomain.slice(email.rcptdomain.indexOf('@')+1, email.rcptdomain.length);
      console.log(email.rcptdomain)

      var dns = require('dns');
      var mx = []

      dns.resolveMx(email.rcptdomain, function(err, data) {
        if (data) {
          mx = data;
          sendemail();
        }  
      })

      var smtpserver = {}
      var sending = 0;
      var wait = 1;

      function sendemail() {
        console.log(mx[0].exchange)
        var net = require('net');
        var client = net.connect({host: mx[0].exchange, port: 25}, function() { //'connect' listener
          console.log('client connected');
          //client.write('world!\r\n');
        });

        client.on('data', function(data) {
          var datastr = data.toString();
          console.log('S:'+datastr);
          wait = 0;

          if (datastr.indexOf("220") == 0) { 
            smtpserver.host = datastr.slice(datastr.indexOf(' ')+1, datastr.indexOf('ESMTP')-1);
            var msg = 'HELO '+mailbot.server+'\n'
            console.log(msg); client.write(msg); wait = 1;
          };

          if ((datastr.indexOf("250") == 0)&&(sending==0)&&(wait==0)) { 
            var msg = 'MAIL FROM: <'+email.from+'>\n'
            console.log(msg); client.write(msg); 
            sending = 1; wait = 1;
          }

          if ((datastr.indexOf("250") == 0) && (sending==1)&&(wait==0)) {
            var msg = "RCPT TO:<"+email.rcpt+">\n";
            console.log(msg); client.write(msg);
            sending=2; wait = 1;
          }

          if ((datastr.indexOf("250")== 0) && (sending==2)&&(wait==0)) {
            var msg = "DATA\n";
            console.log(msg); client.write(msg);
            sending=3; wait = 1;
          }    
          
          if ((datastr.indexOf("354")== 0) && (sending==3)&&(wait==0)) {
            var msg = email.data;
            console.log(msg); client.write(msg);      
            sending=4; wait = 1;
          } 

          if ((datastr.indexOf("250")== 0) && (sending==4)&&(wait==0)) {
            var msg = "QUIT\n"
            console.log(msg); client.write(msg);
            sending=5; wait = 1;
          }        

          if ((datastr.indexOf("221")== 0) && (sending==5)&&(wait==0)) {
            console.log('END Successfully mailed it seems.');
            client.end();
          }        
        });
        
        client.on('end', function() {
          console.log('client disconnected');
        });
      }

}

/////////////
/////////////   SYSTEM MEMORY DATABASE
/////////////

//LOADS .json file from disc to memory
fs.readFile(__dirname + '/db.json', function(err,data) {
	if (err) console.log("Arrow: Error loading data json" + err)
  	if (data) {
		//succeeded in reading data, put it in arrow.
		database = JSON.parse(data)
		console.log('Loaded : ' + database.length + ' entries');
	}
})	

//autosave
setInterval( function() { 
if (core.dataunsaved == true) { 
	core.save(database, "db.json"); } 
} , core.datainterval)
////


