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
	.option('-f --from <from>', 'Search word. That word would be searched'
		+ ' throughout the whole response body and replaced to the "to" option.'
		+ ' RegExp supported.')
	.option('-t --to <to>', 'New word')
	.parse(process.argv);

var site = program.site ? program.site : 'lenta.ru';
var from = program.from ? program.from : 'Россия';
var to = program.to ? program.to : 'Америка';
var re = new RegExp(from, 'gi');
var match = site.match(/^https?:\/\//);

if ( match != null ) {
	console.log('Do not use protocol');
	process.exit();
}

var options = {
	key: fs.readFileSync('./server.key', 'utf8'),
	cert: fs.readFileSync('./server.crt', 'utf8')
};
var proxyOptions = {
	hostRewrite: 'localhost',
	protocolRewrite: 'https',
	changeOrigin: true,
	preserveHeaderKeyCase: true
};

function replace(html) {
	return html.replace(re, to);
}

var proxy = httpProxy.createProxyServer({});

app.use('/', function(req, res) {
	proxyOptions['target'] = req.protocol + '://' + site;
	proxy.web(req, res, proxyOptions);
});

proxy.on('proxyReq', function(proxyReq, req, res, options) {
  proxyReq.setHeader('Accept-Encoding', 'gzip;q=0,deflate,sdch');
});

proxy.on('proxyRes', function (proxyRes, request, response) {
	var _end = response.end;
	var _writeHead = response.writeHead;
	var _write = response.write;
	var chunks;
	if( proxyRes.headers &&
		proxyRes.headers[ 'content-type' ] &&
		proxyRes.headers[ 'content-type' ].match('text/html') ) {
			response.writeHead = function() {
				response.setHeader('transfer-encoding', '');
				response.setHeader('cache-control', 'no-cache');
				_writeHead.apply(this, arguments);
			};

			response.write = function(data) {
				if( chunks ) {
					chunks += data;
				} else {
					chunks = data;
				}
			};

			response.end = function() {
				if( chunks && chunks.toString ) {
					_write.apply(this, [ replace(chunks.toString()) ]);
				} else {
					_end.apply(this, arguments);
				}
			};
		}
});

console.log('proxying to ' + site);
http.createServer(app).listen(80, function() {
	console.log('starting http server');
});
https.createServer(options, app).listen(443, function() {
	console.log('starting https server');
});
