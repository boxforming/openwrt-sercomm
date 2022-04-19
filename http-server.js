import http from 'http';
import path from 'path';
import fs from 'fs';

const host = '192.168.1.2';
const port = 5000;

http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);

    // parse URL
    const parsedUrl = new URL(req.url, `http://${host}:${port}`);
    // extract URL path
    const pathname = path.join(process.cwd(), 'www', path.resolve('/', parsedUrl.pathname));
    // based on the URL path, extract the file extension. e.g. .js, .doc, ...
    const ext = path.parse(pathname).ext;


    const stream = fs.createReadStream(pathname);
    stream.on('error', err => {
        res.statusCode = 404;
        res.end(`File ${pathname} not found!`);
        return;
    });

    stream.on('open', () => {
        fs.stat(pathname, (err, stats) => {
            if (err) {
                res.statusCode = 500;
                res.end();
                return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Length', stats.size)
            stream.pipe(res);
            // stream.resume();
        });
    });

}).listen(parseInt(port), host);

console.log(`Server listening on ${host}:${port}`);