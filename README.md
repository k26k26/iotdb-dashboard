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

## Interface preview

Every image below is a real 1920×911 capture against a running IoTDB 2.0.11 node — no mock data and no staged screens. The grouping follows the sidebar. Where a page shows a server refusal instead of a table, that is the honest result: IoTDB 2.0.11 simply has no such statement, and the app reports the rejection rather than painting an empty state.

### Core

**Home** — connection status plus storage group, device and timeseries counters.

![Home](doc/images/dashboard-home.png)

**SQL query** — statement editor, result grid and chart in one workbench.

![SQL query](doc/images/query-sql.png)

**Visualization** — saved boards rendering query results as charts.

![Visualization](doc/images/visualization-board.png)

**Path explorer** — metadata tree on the left, selected node on the right: schema, child paths, series counts, latest values and the last rows.

![Path explorer](doc/images/explorer-path-tree.png)

### Data management

**Database** — list databases, create them and edit TTL and schema mode.

![Database](doc/images/database-management.png)

**Timeseries** — browse and manage measurement paths.

![Timeseries](doc/images/timeseries-management.png)

**Latest values** — `SELECT LAST` across a path.

![Latest values](doc/images/latest-values.png)

**Import / export** — CSV in, query results out.

![Import / export](doc/images/data-import-export.png)

**Schema template** — templates and the paths they are attached to.

![Schema template](doc/images/template-management.png)

### Cluster

**Cluster management** — DataNode / ConfigNode lists, service status, running queries and live connections.

![Cluster management](doc/images/cluster-monitor.png)

**Query center** — queries in flight and their cost.

![Query center](doc/images/query-center.png)

**Pipe** — data pipeline tasks.

![Pipe](doc/images/pipe-management.png)

**External services** — links out to Grafana and other dashboards.

![External services](doc/images/external-service.png)

**Realtime monitoring** — rolling charts of node metrics.

![Realtime monitoring](doc/images/realtime-monitor.png)

### Advanced management

**Users & privileges** — users and per-user grants.

![Users & privileges](doc/images/auth-management.png)

**Trigger** — register and drop cluster triggers.

![Trigger](doc/images/trigger-management.png)

**Continuous query** — CQ list and CQ creation.

![Continuous query](doc/images/continuous-query.png)

**Index** — index list and index DDL.

![Index](doc/images/index-management.png)

**Function** — UDF registry.

![Function](doc/images/function-management.png)

**Configuration** — cluster parameters read back from the server.

![Configuration](doc/images/configuration.png)

### Analysis

**Alert** — alert rules, or the server's answer when the dialect has none.

![Alert](doc/images/alert-management.png)

**Lineage** — schema lineage walked from the database down.

![Lineage](doc/images/lineage-analysis.png)

**System info** — version, current user and database inventory.

![System info](doc/images/system-info.png)

**AI analysis** — a rule-based health check over a path: every finding is computed from statements the server actually answered, and each one expands to show the SQL and the raw rows behind it.

![AI analysis](doc/images/ai-analysis.png)

### Enterprise

**Tenant & quota** — one database per tenant, with the quota statements the server accepts.

![Tenant & quota](doc/images/tenant-quota.png)

**High availability** — running nodes and schema consensus.

![High availability](doc/images/high-availability.png)

**Audit log** — audit configuration and recorded events.

![Audit log](doc/images/audit-log.png)

**Backup & recovery** — loadable TsFiles and load tasks.

![Backup & recovery](doc/images/backup-restore.png)

**Performance tuning** — write and query statistics with the knobs that move them.

![Performance tuning](doc/images/performance-tuning.png)

### Settings

**Settings** — connection parameters and UI preferences.

![Settings](doc/images/settings.png)

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
- Default connection values are `192.168.77.245:18080` with `root/root` — the author's LAN development node, which you will not be able to reach. A host you saved earlier wins over these defaults and is kept in `localStorage` under the `iotdb-connection` key, so change it in the **连接配置** dialog in the header. Never point this app at a node you have not secured; the app does not force a credential change.
- The `/ai` page calls no model and no external service — it is a local rule-based health check over data the server already returned, so its findings are only as good as the sample you point it at. Every page imports the services layer, but how completely each call is wired has not been audited page by page, so treat a blank panel as "unverified", not "no results".
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
