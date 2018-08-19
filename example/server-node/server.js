const http = require('http');
const formidable = require('formidable');

const App = require('./app');

const serverFunc = (req, res) => {
  if (req.url !== '/') {
    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
    res.end();
  }
  if (req.url === '/' && req.method !== 'POST') {
    res.writeHead(405, { 'Access-Control-Allow-Origin': '*' });
    res.end();
  }

  const form = new formidable.IncomingForm();
  const app = new App();
  form.parse(req, (err, fields, files) => {
    try {
      app.upload(fields, files);
    } catch (uploadErr) {
      res.writeHead(500, { 'Access-Control-Allow-Origin': '*' });
      res.end();
    }

    res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
    res.end();
  });
};

http.createServer(serverFunc).listen(8080);
