# 通过浏览器辅助读取普通文档正文

这个脚本解决的是当前还存在的一个缺口：

- 你已经可以通过 MCP 浏览 workspace 和 node
- 但普通 DingTalk 文档正文，当前仍不能通过本项目使用的公开 OpenAPI 稳定读取

因此仓库附带了一个 **依赖受管浏览器 profile（或已有调试浏览器会话）** 的实验性补充脚本。

## 命令

```bash
npm run read:doc -- --url "https://alidocs.dingtalk.com/i/nodes/<dentryUuid>" --output ./tmp/doc.md
```

也可以直接传 `dentryUuid`：

```bash
npm run read:doc -- --dentry-uuid "<dentryUuid>" --output ./tmp/doc.md
```

## 脚本做的事情

1. 启动或复用本地带远程调试端口的 Edge
2. 打开目标 Alidocs 页面
3. 如果需要，等待你完成钉钉网页登录
4. 调用登录态下的 Alidocs 内部接口
5. 将正文渲染为 Markdown
6. 保存到本地

## 参数

- `--url`：完整的 Alidocs 节点链接
- `--dentry-uuid`：Alidocs 链接中的 node / dentry UUID
- `--output`：输出 Markdown 路径

## 可选环境变量

- `DINGTALK_EDGE_PATH`：自定义 Edge 路径
- `DINGTALK_BROWSER_PORT`：调试端口，默认 `9222`
- `DINGTALK_BROWSER_USER_DATA_DIR`：自定义浏览器用户目录
- `DINGTALK_LOGIN_WAIT_MS`：等待登录超时时间（毫秒）

## 注意事项

- 这个方案依赖受管浏览器 profile 的登录态，或已有调试浏览器会话
- 它 **不是官方公开 API 工作流**
- 更适合作为导出 / 同步场景下的实验性补充工具
- Notable / `.able` 表格仍建议继续使用仓库已有的官方 API 工具
