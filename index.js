'use strict';
var fs = require('fs');
var express = require('express');
var program = require('commander');
var http = require('http');
var https = require('https');
var app = express();
var httpProxy = require('http-proxy');

program
	.version('0.0.1')
	.option('-s --site <site>', 'Site without protocol, eg: lenta.ru')
	.parse(process.argv);

var site = program.site ? program.site : 'lenta.ru';
var match = site.match(/^https?:\/\//);

if ( match != null ) {
	console.log('Do not use protocol');
	process.exit();
}

var options = {
	key: fs.readFileSync('./server.key', 'utf8'),
	cert: fs.readFileSync('./server.crt', 'utf8')
};
var proxy = httpProxy.createProxyServer({});

app.use('/', function(req, res) {
	proxy.web(req, res, { target: req.protocol + '://' + site, hostRewrite: 'localhost', protocolRewrite: 'https', changeOrigin: true, preserveHeaderKeyCase: true});
});

console.log('proxying to ' + site);
http.createServer(app).listen(80, function(){
	console.log('starting http server');
});
https.createServer(options, app).listen(443, function(){
	console.log('starting https server');
});
