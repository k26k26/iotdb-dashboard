/*
 * Copyright 2026 liuyu
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Catalog } from './types';

/** Connection modal, REST/firewall guide and LAN scanner. */
export const connection: Catalog = {
  'REST 服务是通的，但凭据被拒': 'The REST service is reachable, but the credentials were rejected',
  '节点已经应答了 /ping，只是不接受这个用户名/密码。改对账号即可，不用再动服务端配置。': 'The node already answered /ping, it just does not accept this username and password. Fix the account; no server-side setting needs to change.',
  '这个端口上有服务在应答，但它不是可用的 IoTDB REST': 'A service on this port is answering, but it is not a usable IoTDB REST',
  '收到的是 HTTP 错误而不是拒绝连接。多半端口指到了别的服务上，或该节点版本没有这个接口。': 'What came back is an HTTP error rather than a refused connection. Most likely the port points at another service, or this node version has no such endpoint.',
  '当前页面是 https，浏览器不允许它去连 http 的节点': 'This page is served over https, and the browser will not let it reach an http node',
  '这是浏览器自身的混合内容限制，和 IoTDB 无关。用 http 打开本应用，或给节点配好 TLS。': 'This is a mixed content restriction of the browser itself, nothing to do with IoTDB. Open this app over http, or set up TLS on the node.',
  '这个地址的端口上没有服务在监听': 'No service is listening on this address and port',
  '连接被立即拒绝。最常见的原因是 REST 服务没开，或端口填错了。': 'The connection was refused immediately. Most often the REST service is not enabled, or the port is wrong.',
  '等了很久没有回音': 'Waited a long time with no reply',
  '要么这个 IP 上没有机器，要么端口被防火墙静默丢包。先确认地址在同一网段，再检查放行规则。': 'Either there is no machine at this IP, or a firewall is silently dropping packets to the port. First confirm the address is in the same subnet, then check the allow rules.',
  '失败的地址：': 'Failed address: ',
  '（HTTP {status}）': ' (HTTP {status})',
  '连不上？按这三步排查': 'Cannot connect? Work through these three steps',
  '1. 确认服务端开启了 REST 服务': '1. Confirm the server has the REST service enabled',
  'IoTDB 默认': 'IoTDB ships with ',
  '关闭 REST': 'REST disabled',
  '，未开启时本应用的每个请求都会被拒。编辑': ', so until you enable it every request from this app is refused. Edit ',
  '加上下面几行，然后': 'and add the lines below, then ',
  '重启 IoTDB': 'restart IoTDB',
  '——改参数不重启不会生效。': ' — parameter changes take effect only after a restart.',
  '2. 放行 18080 端口': '2. Open port 18080',
  '节点与浏览器不在同一台机器时，主机防火墙通常是不通的原因：': 'When the node and the browser are not on the same machine, the host firewall is usually why nothing gets through:',
  '云主机还要在': 'Cloud hosts also need the same port opened in their ',
  '安全组': 'security group',
  '里放行同一端口；有 NAT 或容器桥接时，确认映射到的宿主机端口一致。': '; with NAT or container bridging, make sure the mapped host port matches.',
  '3. 确认浏览器能直连这个地址': '3. Confirm the browser can reach this address directly',
  '本项目': 'This project has ',
  '没有后端代理': 'no backend proxy',
  '，REST 地址由你填写的 host 和 port 直接拼出，所以是': ': the REST address is built straight from the host and port you enter, so it is the ',
  '浏览器': 'browser',
  '必须能访问到节点，并且响应要带上你浏览器接受的 CORS 头。': ' that must be able to reach the node, and the response must carry CORS headers your browser accepts.',
  '不确定节点在哪台机器上时，用下面的「扫描局域网」把网段里应答 18080 的地址找出来。': 'Not sure which machine the node is on? Use "Scan LAN" below to find the addresses in the subnet that answer on 18080.',
  '已连接 {host}:{port}（{ms}ms）': 'Connected to {host}:{port} ({ms}ms)',
  '连接失败，下面是对应的原因和排查步骤': 'Connection failed; the matching reason and the troubleshooting steps are below',
  '连接配置': 'Connection',
  '测试并连接': 'Test and connect',
  '请输入 Host': 'Enter the host',
  '请输入 Port': 'Enter the port',
  '请输入 Username': 'Enter the username',
  '请输入 Password': 'Enter the password',
  '扫描局域网，找出开着 REST 端口的机器': 'Scan the LAN for machines with the REST port open',
  '扫描不可用': 'Scan unavailable',
  '当前页面通过 https 提供，浏览器不允许它去连 http 的节点。用 http 打开本应用后再扫描。': 'This page is served over https, so the browser will not let it connect to an http node. Open this app over http, then scan again.',
  '网段前三段': 'First three octets of the subnet',
  '停止': 'Stop',
  '扫描局域网': 'Scan LAN',
  '扫完 {total} 个地址，没有任何一个在 {port} 上应答': 'Scanned {total} addresses and not one of them answered on {port}',
  '说明这个网段里没有开着该端口的 HTTP 服务。要么 REST 没开（见上面的三步排查），要么端口不是 18080，要么机器不在这个网段。': 'That means no HTTP service in this subnet has this port open. Either REST is not enabled (see the three steps above), or the port is not 18080, or the machine is not in this subnet.',
  '应答地址': 'Responding address',
  '响应 (ms)': 'Response (ms)',
  '用这个地址': 'Use this address',
  '浏览器只能靠 HTTP 应答判断端口通不通：列表里的地址确实在 {port} 端口上回应了请求，但不保证就是 IoTDB，也不保证 REST 已开启。扫描只会对本机内网网段发起请求。': 'The browser can only judge whether a port is open from an HTTP reply: the addresses listed here really did answer requests on port {port}, but that does not prove they are IoTDB, nor that REST is enabled. A scan only sends requests to the private subnet of this machine.',
  '请填写网段的前三段，例如 192.168.77': 'Enter the first three octets of the subnet, for example 192.168.77',
  '只能扫描内网网段（10.*、172.16-31.*、192.168.*）': 'Only private subnets can be scanned (10.*, 172.16-31.*, 192.168.*)',
  '端口需要是 1-65535 的整数': 'Port must be an integer from 1 to 65535',
};
