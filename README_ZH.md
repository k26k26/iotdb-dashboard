[English](./README.md) | [中文](./README_ZH.md)

# IoTDB Dashboard

基于 [Apache IoTDB](https://iotdb.apache.org/) REST v2 接口的 Web 管理控制台，使用 React 19 + TypeScript + Vite + Ant Design 构建，用于在浏览器里浏览元数据、执行 SQL 和查看集群状态。

采用 Apache License 2.0 授权，见 [LICENSE](./LICENSE) 与 [NOTICE](./NOTICE)。

## 功能

| 分类 | 页面 |
|---|---|
| 查询 | IoTDB SQL 控制台、查询中心、最新值、数据浏览 |
| 模式 | 时序/元数据树、数据库、模板、索引 |
| 集群 | 节点状态、高可用、系统信息、实时监控 |
| 运维 | Pipe、触发器、连续查询（CQ）、UDF、参数配置、备份恢复、性能调优、审计日志、告警 |
| 权限 | 用户与权限、租户管理 |
| 其他 | 可视化工作台、外部服务（Grafana）、AI 分析 |
| 界面 | 中文 / English 全量双语，顶栏一键切换，选择与其他偏好一起记住 |

共 28 个页面目录 + 2 个内嵌组件，对应 30 条路由。

## 界面预览

下面每一张图都是在真实运行的 IoTDB 2.0.11 节点上截取的 1920×911 画面，没有假数据、没有摆拍的空白页。分组与左侧菜单一致。某些页面显示的是服务端拒绝而不是表格，这是真实结果：IoTDB 2.0.11 没有对应语句，应用把拒绝原因原样报出来，而不是画一个空状态糊过去。每张图顶部显示的是作者局域网里的开发节点地址，背后的数据是一个用完就可以扔掉的 `root.sg` 库（两台设备、九个测点，数值是造的），不是任何生产遥测数据，外部也访问不到。所有截图都是默认的中文界面，英文切换见「界面语言」。

### 核心功能

**首页** —— 连接状态，以及存储组、设备、时间序列的计数。

![首页](doc/images/dashboard-home.png)

**SQL 查询** —— 语句编辑器、结果表格与图表放在同一个工作台里。

![SQL 查询](doc/images/query-sql.png)

**可视化** —— 把查询结果渲染成图板的看板。

![可视化](doc/images/visualization-board.png)

**路径浏览器** —— 左侧元数据树、右侧节点详情：schema、子路径、下属序列计数、最新值与最近若干行数据。

![路径浏览器](doc/images/explorer-path-tree.png)

### 数据管理

**数据库管理** —— 查看数据库，创建并修改 TTL 与模式模式。

![数据库管理](doc/images/database-management.png)

**测点管理** —— 浏览并管理测点路径。

![测点管理](doc/images/timeseries-management.png)

**最新值** —— 对整个路径执行 `SELECT LAST`。

![最新值](doc/images/latest-values.png)

**数据导入导出** —— CSV 导入，查询结果导出。

![数据导入导出](doc/images/data-import-export.png)

**Schema 模板** —— 模板本身以及挂载它的路径。

![Schema 模板](doc/images/template-management.png)

### 集群运维

**集群管理** —— DataNode / ConfigNode 列表、服务状态、运行中查询与当前连接。

![集群管理](doc/images/cluster-monitor.png)

**查询中心** —— 正在执行的查询及其耗时。

![查询中心](doc/images/query-center.png)

**数据管道** —— Pipe 任务。

![数据管道](doc/images/pipe-management.png)

**外部服务** —— 跳转 Grafana 等外部面板。

![外部服务](doc/images/external-service.png)

**实时监控** —— 节点指标的滚动曲线。

![实时监控](doc/images/realtime-monitor.png)

### 高级管理

**权限管理** —— 用户与逐个用户的授权。

![权限管理](doc/images/auth-management.png)

**触发器** —— 注册与删除集群侧触发器。

![触发器](doc/images/trigger-management.png)

**连续查询** —— CQ 列表与创建。

![连续查询](doc/images/continuous-query.png)

**索引管理** —— 索引列表与索引 DDL。

![索引管理](doc/images/index-management.png)

**函数管理** —— UDF 注册表。

![函数管理](doc/images/function-management.png)

**配置管理** —— 从服务端读回的集群参数。

![配置管理](doc/images/configuration.png)

### 智能分析

**告警管理** —— 告警规则；当方言里根本没有这个对象时，显示服务端的答复。

![告警管理](doc/images/alert-management.png)

**血缘分析** —— 从数据库往下走的 schema 血缘。

![血缘分析](doc/images/lineage-analysis.png)

**系统信息** —— 版本、当前用户与数据库清单。

![系统信息](doc/images/system-info.png)

**AI 分析** —— 对一条路径做基于规则的体检：每条结论都由服务端真实返回的数据算出，展开即可看到依据的语句和原始行。

![AI 分析](doc/images/ai-analysis.png)

### 企业特性

**租户与配额** —— 以一个一级数据库为租户边界，加上服务端接受的配额语句。

![租户与配额](doc/images/tenant-quota.png)

**高可用监控** —— 运行中节点与 Schema 共识。

![高可用监控](doc/images/high-availability.png)

**审计日志** —— 审计开关与已记录的事件。

![审计日志](doc/images/audit-log.png)

**备份恢复** —— 可加载的 TsFile 与 LOAD 任务。

![备份恢复](doc/images/backup-restore.png)

**性能调优** —— 写入与查询统计，以及影响它们的参数。

![性能调优](doc/images/performance-tuning.png)

### 系统设置

**系统设置** —— 连接参数与界面偏好。

![系统设置](doc/images/settings.png)

## 环境要求

- Node.js **20 及以上** 与 npm。Vite 8 / rolldown 在 Node 18 下会直接报 `node:util` 未导出 `styleText` 而中断，此时只有 `tsc -b` 能过，产物构建不了。
- 一个 IoTDB 2.x 实例，并按下文「关于连接方式」开启 REST 服务（默认端口 `18080`）。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
```

打开页面后，在顶栏「连接配置」里填写 host / port / username / password 即可。默认指向 `127.0.0.1:18080`，你保存的地址会以 `iotdb-connection` 为键持久化在浏览器 `localStorage` 中。

不想每台机器都手输，就把自己的节点写进不进版本库的 `.env.local`：

```bash
cp .env.example .env.local   # 然后设置 VITE_IOTDB_HOST / VITE_IOTDB_PORT
```

连接测试失败时，弹窗会说明失败的是哪一类——凭据被拒、端口上没人监听、还是完全没有应答——然后给出服务端要开的配置项、这个端口的防火墙命令，以及一个「扫描局域网」输入框：你给出网段前缀，它把 `1–255` 逐个试一遍（仅限 RFC 1918 私有网段），列出 REST 端口上有应答的地址。

顶栏那个信号图标不是需要你手动拨开的开关：应用启动时探测一次节点，之后按你真正发出的请求所拿到的响应更新。刷新后仍显示「未连接」，就是这次探测没能连上该地址。

```bash
npm run build           # 类型检查 + 产出 dist/
npm run lint            # oxlint
npm run license:check   # 校验所有源文件的许可证头
npm run i18n:check      # 校验屏幕上出现的中文都有对应英文词条
```

## 界面语言

顶栏有一个 **中 / EN** 切换，一次切换 30 条路由的全部文案：菜单、表格、告警、连接弹窗与局域网扫描，连 `/ai` 体检结论的措辞也一起换。Ant Design 自带组件（日期选择器、表格筛选、分页）跟随同一个开关。语言与其他偏好一起存在 `iotdb-settings` 键下。服务端的内容不翻译——库名、测点名、SQL 文本和 IoTDB 的报错原样显示。

英文文案放在以中文原文为键的字典里（`src/i18n/en/`，按领域分片），没有引入任何 i18n 运行时库。这个设计让覆盖率是可校验的，而不是靠感觉：`npm run i18n:check` 会扫遍 `src/` 下的每个文件，去掉已经用 `t()` / `tx()` 包住的部分，只要还有中文残留在字典之外就报错。新页面忘记包文案时，会直接让这条检查挂掉，而不是让英文用户看到半屏中文。

## 关于连接方式

服务端的 REST 服务**默认是关闭的**，未经配置的 IoTDB 会拒绝本应用的每一个请求。在 `conf/iotdb-system.properties` 中开启并重启：

```properties
####################
### REST Service Configuration
####################
enable_rest_service=true
rest_service_port=18080
```

之后 REST 请求地址由你在应用里填写的 host 和 port 直接拼出，**项目没有配置 Vite 开发代理**，因此浏览器必须能直连 IoTDB 节点，且响应需带上你浏览器接受的 CORS 头；若不满足，就把本应用放在同源下、由网关反向代理到 IoTDB。

## 已知限制

部署到任何你在意的环境之前，请先读完这一节。

- **不适合直接暴露在公网上。** 凭据以明文存放在 `localStorage`，且默认走 HTTP Basic over 明文 HTTP；除非你自己终结 TLS 并以 HTTPS 提供本应用，否则凭据和查询内容都是可被截获的。
- 应用默认指向 `127.0.0.1:18080`，只有 IoTDB 就跑在你浏览器这台机器上时才连得通；请在顶栏「连接配置」里改成你自己的节点，或者在不进版本库的 `.env.local` 里设置 `VITE_IOTDB_HOST` / `VITE_IOTDB_PORT`，免得每次重填。你在「连接配置」里保存过的地址优先级高于默认值，存在 `localStorage` 的 `iotdb-connection` 键下。应用不会强制要求修改凭据，也请不要把它指向未加固的节点。
- `/ai` 页面不调用任何模型、也没有外部服务中转，它是拿服务端已经返回的数据做本地规则体检，结论的好坏取决于你圈定的样本量。其余页面均已引入 services 层，但**每个页面的接口覆盖程度没有逐页核验过**，看到空白面板请理解为「未验证」而不是「无数据」。
- 尚无单元测试。CI 只覆盖类型检查、lint、许可证头、构建与文案覆盖检查。

优先要补的是前两条：提供 `https://` 方案选项、以及不再默认持久化密码。欢迎提 PR。

## 目录结构

```
src/
  pages/        每个功能页面一个目录（28 个）
  components/   公共布局、数据表格、图表
  i18n/         以中文原文为键的英文字典，按领域分片
  services/     IoTDB REST / 元数据 / Grafana 接口封装
  stores/       zustand 状态（connection、query、settings）含 persist
  types/        接口类型定义
  utils/        格式化工具
```

## 参与贡献

见 [CONTRIBUTING.md](./CONTRIBUTING.md)。所有参与者须遵守[行为准则](./CODE_OF_CONDUCT.md)，且每个源文件都必须保留 Apache 许可证头。

发现安全问题请按 [SECURITY.md](./SECURITY.md) 的方式私下上报，不要开公开 issue。

## 许可证

Copyright 2026 liuyu

采用 Apache License, Version 2.0 授权，全文见 [LICENSE](./LICENSE)。

---

本项目是独立的社区软件。「Apache」、「Apache IoTDB」及 Apache 羽毛标志均为 [Apache 软件基金会](https://www.apache.org/) 的商标，本项目未获 ASF 认可，也与 ASF 及 Apache IoTDB 项目管理委员会无任何关联。
