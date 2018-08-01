const openfinLauncher = require('hadouken-js-adapter');
const express = require('express');
const http = require('http');
const path = require('path');

/* process.env.PORT is used in case you want to push to Heroku, for example, here the port will be dynamically allocated */
var port = process.env.PORT || 5040;

var app = express();

app.use(express.static('./build'));

http.createServer(app).listen(port, function(){
    console.log('Express server listening on port ' + port);
    
    const confPath  = path.resolve('./app_local.json');
    openfinLauncher.launch({ manifestUrl: confPath }).catch(err => console.log(err));

});
