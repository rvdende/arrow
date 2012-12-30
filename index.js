'use strict';

var acore = require('./core');

//LOAD MODULES
//npm install express 
//npm install imagemagick   //this also requires the imagemagick binary tool
var http 		= require('http');
var https 		= require('https');
var fs 			= require('fs')
var ecstatic 	= require('ecstatic');
var im 			= require('imagemagick'); 
var util 		= require('util');
var express 	= require('express');

var app 		= express();
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({cookie: { path: '/', httpOnly: true, maxAge: 9999999 }, secret: '12345'}));

//app.use(ecstatic(__dirname + '/public', { showdir : true }));
app.use(ecstatic(__dirname + '/public', { showdir : true }));

var server 		= app.listen(3000, '127.0.0.1');
var io 			= require('socket.io').listen(server);

io.set('log level', 1);

io.sockets.on('connection', function(socket) {
	console.log('socket connected!')
  
  	//socket.emit('news', { hello: 'world' });
  
  	socket.on('data', function(data) {
    	console.log(data);
  	});
});