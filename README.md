Load the arduino sketch, it will stream json over serial. (optional)

npm install ecstatic imagemagick express socket.io socket.io-client json-scrape mailparser midi mime node-markdown serialport

node arrowdevices.js

edit config.json

sudo node index.js

point your browser to http://127.0.0.1:3000/

![Imgur](http://i.imgur.com/s5PXZ.png)

Features/todo list
=======

- [X] Persistent data through JSON.stringify and parse. 
- [X] User signup/login/logout
- [X] Sensor streaming
- [X] Ip block support for approximate latitude/longitude without 3rd party api
- [ ] Admin panel
- [ ] Markdown authoring/editing of content
- [ ] Upload of media with sensible resizing/compression through imagemagick
- [ ] OpenCV support for video feed processing
- [ ] Alarm/notification system through email/remote arduino led/speaker/motor or sms.
- [ ] Gps/event plotting in realtime world wide
- [ ] Email management interface
- [ ] Sensor configuration for max/min event triggers
- [ ] threejs hud for sensors with accel/gyro/humid/altitude streaming data
- [ ] Robots!
