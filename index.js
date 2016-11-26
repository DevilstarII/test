const express = require('express');
const request = require('request');
const program = require('commander');
const app = express();

program
	.version('0.0.1')
	.option('-p --port <n>', 'Port which your local server will listen to', parseInt)
	.option('-f --proxyport <n>', 'Proxy port. Use 443 for https sites, 80 for http', parseInt)
	.option('-s --site <site>', 'Site, eg: http://www.lenta.ru')
	.parse(process.argv);

const port = program.port ? program.port : 3000;
const proxyPort = program.proxyport ? program.proxyport : 80;
const site = program.site ? program.site : 'http://www.lenta.ru';

app.use('/', (req, res) => {
	let url = `${site}:${proxyPort}${req.url}`;
	req.pipe(request({ 'qs': req.query, 'uri': url })).pipe(res);
});

app.listen(port, () => console.log(`starting server on ${port} port, proxying to ${site}:${proxyPort}`));
