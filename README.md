## Proxy requests from HAC Core to KCP (POC)

This is a small POC to attempt proxying requests from a locally running HAC Core application to KCP for development purposes. The proxy is needed to add CORS headers so that the KCP API server responds to requests from HAC Core.


```
npm install
```

#### Environment variables

```bash
# URL for KCP Server (eg. https://<kcp-host>/clusters/root.. - value of cluster.server in the KUBECONFIG for setting up KCP). See note on Workspace Context below.
export KCP_SERVER_URL=...
# Origin for HAC Core (eg. https://prod.foo.redhat.com:1337)
export HAC_CORE_ORIGIN=...
```

#### Workspace context
Depending on the KUBECONFIG you are using for KCP, your context will by default be `root:rh-sso-<org_id>` or `root` (final path segment of `KCP_SERVER_URL`). However, you need to switch this context to match your "home" workspace so that you have permissions to create workspaces.

To get the value for the home workspace:
- Switch to your home workspace using `kubectl ws '~'`
- Get the workspace path using `kubectl ws .`

Replace this path in the last segment of the `KCP_SERVER_URL` environment variable.
eg: `https://<kcp-host>/clusters/<home_workspace_context>`

#### Starting the server

After setting the environment variables, run:
```
node server.js
```

This will start the proxy server on port 3000.
