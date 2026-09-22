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

共 28 个页面目录 + 2 个内嵌组件，对应 30 条路由。

## 环境要求

- Node.js **20 及以上** 与 npm。Vite 8 / rolldown 在 Node 18 下会直接报 `node:util` 未导出 `styleText` 而中断，此时只有 `tsc -b` 能过，产物构建不了。
- 一个 IoTDB 2.x 实例，并按下文「关于连接方式」开启 REST 服务（默认端口 `18080`）。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
```

打开页面后，在连接页填写 host / port / username / password 即可。连接配置以 `iotdb-connection` 为键持久化在浏览器 `localStorage` 中。

```bash
npm run build           # 类型检查 + 产出 dist/
npm run lint            # oxlint
npm run license:check   # 校验所有源文件的许可证头
```

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
- 默认连接值为 `192.168.77.245:18080` + `root/root`，这是作者局域网里的开发节点，你那边连不上；请在顶栏「连接配置」里改成你自己的节点。之前打开过本应用的浏览器会一直沿用它自己存下的 host，直到你在那里重新保存。应用不会强制要求修改凭据，也请不要把它指向未加固的节点。
- `/ai` 页面是占位实现，只会提示「AI 分析功能开发中，敬请期待」，不调用任何接口。其余页面均已引入 services 层，但**每个页面的接口覆盖程度没有逐页核验过**，看到空白面板请理解为「未验证」而不是「无数据」。
- 尚无单元测试。CI 只覆盖类型检查、lint、许可证头与构建。

优先要补的是前两条：提供 `https://` 方案选项、以及不再默认持久化密码。欢迎提 PR。

## 目录结构

```
src/
  pages/        每个功能页面一个目录（28 个）
  components/   公共布局、数据表格、图表
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
