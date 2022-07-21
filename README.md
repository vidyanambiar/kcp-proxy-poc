### Proxy requests from HAC Core to KCP (POC)

This is a small POC to attempt proxying requests from a locally running HAC Core application to KCP for development purposes. The proxy is needed to add CORS headers so that the KCP API server responds to requests from HAC Core.


```
npm install
```

The following environment variables need to be set:
```bash
# URL for KCP Server (eg. https://<kcp-host>/clusters/root:rh-sso-<org_id>).
export KCP_SERVER_URL=...
# Origin for HAC Core (eg. https://prod.foo.redhat.com:1337)
export HAC_CORE_ORIGIN=...
```

After setting the environment variables, run:
```
node server.js
```

This will start the proxy server on port 3000.
