# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Email the
maintainer directly (address in the repository profile) and allow time for a
fix before any disclosure.

You can expect an acknowledgement within 5 business days. We will share what is
being done and, when a fix lands, coordinate disclosure timing with you.

## Scope

This dashboard is a browser client over the IoTDB REST v2 API. In scope:

- Anything letting one user of the dashboard read data or run statements they
  should not be able to
- Credential leakage, SSRF through the connection form, or script injection into
  rendered query results
- Vulnerabilities introduced by this repository's own code or pinned dependencies

Out of scope: vulnerabilities in IoTDB server itself (report those to the Apache
IoTDB project at <https://www.apache.org/security/>), and findings that require
you to already control the victim's browser or machine.

## Known limitations, by design or currently unfixed

These follow directly from the current architecture. Read them before deploying
this against anything you care about.

1. **Credentials live in `localStorage`.** The connection store persists host,
   port, username and password under the `iotdb-connection` key, so any
   cross-site-scripting issue or anyone with access to the browser profile can
   read them in cleartext.
2. **HTTP Basic auth over plain HTTP by default.** The REST base URL is built
   as `http://<host>:<port>` with no TLS option, so credentials and query
   payloads cross the wire unprotected unless you terminate TLS and serve the
   app over HTTPS yourself.
3. **Default credentials are pre-filled** as `root` / `root` at
   `localhost:18080`, and nothing forces a change.
4. **Browser must reach the IoTDB node directly.** There is no backend proxy, so
   the practical fix for CORS is often to widen allowed origins, which expands
   the attack surface.
5. **No authentication or authorisation layer of its own.** Anyone who can load
   the app can use whatever IoTDB account is configured, and there is no
   per-user RBAC in the dashboard.

Items 1 and 2 are the ones to address first. A pull request that adds an
optional HTTPS/`https://` scheme choice and stops persisting the password by
default would be welcomed.

## Unverifiable claims

This project has no security audit history, no bug bounty, and no signed
release artifacts. Version tags are not currently cryptographically verified.
