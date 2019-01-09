const openfinLauncher = require('hadouken-js-adapter');
const express = require('express');
const http = require('http');
const path = require('path');

const port = process.env.PORT || 8085;
const mode = process.env.MODE;
const launchApp = (mode === "run");

var app = express();

app.use(express.static('./build'));

http.createServer(app).listen(port, function(){
    console.log('Express server listening on port ' + port);
    
    if ( launchApp ) {
        const url = path.resolve('./app_local.json');
        openfinLauncher.launch({ manifestUrl: url});
    }
});
