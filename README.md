[English](./README.md) | [中文](./README_ZH.md)

# IoTDB Dashboard

A web management console for [Apache IoTDB](https://iotdb.apache.org/), built with React 19, TypeScript, Vite and Ant Design. It talks to the IoTDB REST v2 API so you can browse metadata, run SQL and watch cluster state from a browser.

Licensed under the Apache License 2.0 — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

## Features

| Area | Pages |
|---|---|
| Query | IoTDB SQL console, query center, latest values, data browse |
| Schema | Timeseries / metadata tree, database, template, index |
| Cluster | Node status, high availability, system info, realtime monitoring |
| Operations | Pipe, trigger, continuous query (CQ), UDF, config, backup, performance tuning, audit logs, alerts |
| Security | Users & privileges, tenant management |
| Extras | Visualization workbench, external services (Grafana), AI analysis |

## Requirements

- Node.js 20+ and npm
- A running IoTDB 2.x instance with its REST service switched on — see [Connecting to IoTDB](#connecting-to-iotdb) for the exact properties (default port `18080`).

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Then open the app and fill in host / port / username / password on the connection page. The config is persisted in `localStorage` under the `iotdb-connection` key.

```bash
npm run build    # type-check + production bundle into dist/
npm run lint     # oxlint
npm run license:check
```

## Connecting to IoTDB

The REST service is **off by default** on the server side, so a stock IoTDB install will refuse every request from this app. Enable it in `conf/iotdb-system.properties` and restart:

```properties
####################
### REST Service Configuration
####################
enable_rest_service=true
rest_service_port=18080
```

The REST base URL is then built directly from the host and port you enter in the app — there is no Vite dev proxy, so the browser must be able to reach the IoTDB node itself. That means the response has to carry CORS headers your browser accepts; if it does not, serve this app behind a same-origin reverse proxy in front of the same host instead.

## Known limitations

Please read before pointing this at anything that matters:

- **Not production-ready for exposed networks.** Credentials are held in `localStorage` and sent as HTTP Basic auth over plain HTTP unless you terminate TLS yourself.
- Default connection values are `localhost:18080` with `root/root`; the app never forces a credential change.
- The `/ai` page is a stub — it shows "AI 分析功能开发中，敬请期待" and calls no API. Every other page imports the services layer, but how completely each call is wired has not been audited page by page, so treat a blank panel as "unverified", not "no results".
- No unit tests yet. CI covers type-checking, linting, build and license headers only.

Contributions that address any of these are especially welcome.

## Repository layout

```
src/
  pages/        one directory per feature page (30 routes)
  components/   shared layout, data tables, charts
  services/     IoTDB REST / metadata / Grafana API clients
  stores/       zustand state (connection, query, settings) with persist
  types/        API type definitions
  utils/        formatting helpers
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All participants agree to the [Code of Conduct](./CODE_OF_CONDUCT.md), and every source file must keep its Apache license header.

## License

Copyright 2026 liuyu

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE).

---

This project is independent community software. "Apache", "Apache IoTDB" and the Apache feather logo are trademarks of the [Apache Software Foundation](https://www.apache.org/); this project is not endorsed by or affiliated with the ASF.
