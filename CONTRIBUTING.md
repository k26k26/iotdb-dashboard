# Contributing to IoTDB Dashboard

Thanks for your interest. This document covers the practical steps; the
[Code of Conduct](./CODE_OF_CONDUCT.md) applies to all interactions here.

## Before you start

- Confirm your change fits the scope: a browser console over the IoTDB REST API.
- If the work is more than a trivial fix, open an issue first so effort isn't duplicated.
- Check existing issues and open pull requests before starting.

## Development setup

```bash
git clone https://github.com/k26k26/iotdb-dashboard.git
cd iotdb-dashboard
npm install
npm run dev
```

Point a local IoTDB at REST port `18080`, then connect from the app.

## Making changes

1. Branch from `main`: `git checkout -b feat/<short-topic>` or `fix/<short-topic>`.
2. Keep each commit to one logical change.
3. Run the checks locally before pushing:

   ```bash
   npm run lint
   npm run build
   npm run license:check
   ```

4. Push and open a pull request against `main`.

## License headers are mandatory

Every new source file must start with the Apache license header, and existing
headers must not be removed. This is checked in CI.

To stamp the header onto any new files automatically:

```bash
node scripts/license-headers.mjs
```

Because you are licensing your contribution to a project released under
Apache-2.0, contributing implies you have the right to grant that license and
are doing so. Do not paste code in from GPL or AGPL-licensed projects — that is
incompatible with Apache-2.0 and will be rejected.

## Pull request expectations

- Explain what changes and why; link the issue if there is one.
- For UI changes, include a screenshot or short recording.
- Note any change to how credentials, permissions or the REST contract are handled.

## Reporting bugs

Use the issue template. Include the IoTDB version, the browser, the exact page
route, and the failing REST request/response where you can. Sanitise hostnames
and credentials from anything you paste.
