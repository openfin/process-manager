const openfinLauncher = require('hadouken-js-adapter');
const express = require('express');
const http = require('http');
const path = require('path');

const port = process.env.PORT || 8085;
const mode = process.env.MODE;
const runtime = process.env.RUNTIME || '';
const launchApp = (mode === "run");

var app = express();

app.use(express.static('./build'));

http.createServer(app).listen(port, function(){
    console.log(`express server listening on port: ${port}`);
    if ( launchApp ) {
        const conf = (runtime !== '') ? `app.local.${runtime}.json` : 'app.local.json';
        console.log(`launching process manager with config: ${conf}`);
        const url = path.resolve(`./build/${conf}`);
        openfinLauncher.launch({ manifestUrl: url});
    }
});
