const openfinLauncher = require('hadouken-js-adapter');
const express = require('express');
const http = require('http');
const path = require('path');

const port = process.env.PORT || 8085;
const mode = process.env.MODE;
const runtime = process.env.RUNTIME || 'stable';
const launchApp = (mode === "run");

var app = express();

app.use(express.static('./build'));

http.createServer(app).listen(port, function(){
    console.log(`express server listening on port: ${port}`);
    if ( launchApp ) {
        console.log(`launching process manager with runtime: ${runtime}`);
        const url = path.resolve(`./build/app.local.${runtime}.json`);
        openfinLauncher.launch({ manifestUrl: url});
    }
});
