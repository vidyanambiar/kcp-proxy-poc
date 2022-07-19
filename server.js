import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import url from 'url';

const app = express();

app.use(cors({
  origin: 'https://prod.foo.redhat.com:1337',
  credentials: true
}));

const apiProxy = proxy('https://kcp-stable.apps.kcp-internal-1.52p3.p1.openshiftapps.com/clusters/root:rh-sso-15850190', {
  proxyReqPathResolver: req => url.parse(req.originalUrl).path
});

app.use('/apis*', apiProxy);

app.listen(3000, () => {
  console.log('Proxy server listening on port 3000');
});