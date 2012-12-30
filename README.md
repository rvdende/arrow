arrow
=====

WARNING: very early in development!

Nodejs system combining express, socketio, processingjs with an efficient in memory store and arduino integration.

So we can graph RF now!

![arrowgraph1](https://raw.github.com/fluentart/arrow/master/examples/graph1.png)
![arrowgraph2](https://raw.github.com/fluentart/arrow/master/examples/graph2.png)
![arrowgraph3](https://raw.github.com/fluentart/arrow/master/examples/graph3.png)

Todo
==========

lots!


Howto
=========

Load the arduino sketch, it will stream json over serial.

Get arduino.js working, it should log data to /public/record.json

```
node arduino.js
```

Load up the node server.. its basicly just a static server at the moment.

```
node index.js
```

http://127.0.0.1:3000/sensor.htm will plot it out for you.


Arduino.js
==========

This is basicly a data logger at the moment that tags data using very fine uptime clock. To be used with the arduino sketch. 

![arrowterminal](https://github.com/fluentart/arrow/blob/master/examples/termdata.png?raw=true)

You can also use the arduino serial connector, it is made to connect 
to the arrow platform. In future we'll have bi-directional, possibly through firmata. 
