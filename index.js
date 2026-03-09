#!/usr/bin/env node
/**
 * DingTalk Wiki MCP Server
 * 钉钉知识库 MCP 服务 - 支持读写操作
 * 
 * 基于钉钉 Wiki API v2.0
 * 文档: https://open.dingtalk.com/document/development/knowledge-base-overview
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');
const dotenv = require('dotenv');

// 钉钉 API 配置
const DINGTALK_API_BASE = 'https://oapi.dingtalk.com';
const DINGTALK_API_V2 = 'https://api.dingtalk.com';
const fs = require('fs');
const path = require('path');
const CONFIG_PATH = process.env.DINGTALK_WIKI_CONFIG_PATH || path.join(__dirname, 'config.json');

function loadEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return false;
  }

  dotenv.config({ path: filePath, override: false });
  return true;
}

const DOTENV_CANDIDATES = [
  process.env.DINGTALK_WIKI_ENV_PATH,
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '.env')
].filter(Boolean);

for (const candidate of DOTENV_CANDIDATES) {
  if (loadEnvFile(candidate)) {
    console.error(`[钉钉MCP] 已加载环境变量文件: ${candidate}`);
    break;
  }
}

// 加载配置文件
let userConfig = {};
try {
  if (fs.existsSync(CONFIG_PATH)) {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    userConfig = JSON.parse(configData);
    console.error('[钉钉MCP] 已加载用户配置');
  }
} catch (error) {
  console.error('[钉钉MCP] 配置文件加载失败:', error.message);
}

// 获取默认操作者 unionId
function getDefaultOperatorId() {
  if (userConfig.defaultUser && userConfig.users && userConfig.users[userConfig.defaultUser]) {
    return userConfig.users[userConfig.defaultUser].unionId;
  }
  return null;
}

// 环境变量配置
const DINGTALK_APP_KEY = process.env.DINGTALK_APP_KEY;
const DINGTALK_APP_SECRET = process.env.DINGTALK_APP_SECRET;
const DEFAULT_OPERATOR_ID = getDefaultOperatorId();

if (!DINGTALK_APP_KEY || !DINGTALK_APP_SECRET) {
  console.error('错误: 请设置环境变量 DINGTALK_APP_KEY 和 DINGTALK_APP_SECRET');
  process.exit(1);
}

// 钉钉 API 客户端
class DingTalkClient {
  constructor() {
    this.accessToken = null;
    this.tokenExpireTime = 0;
    this.operatorId = null;
  }

  // 获取 Access Token
  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.get(`${DINGTALK_API_BASE}/gettoken`, {
        params: {
          appkey: DINGTALK_APP_KEY,
          appsecret: DINGTALK_APP_SECRET
        }
      });

      if (response.data.errcode !== 0) {
        throw new Error(`获取 Token 失败: ${response.data.errmsg}`);
      }

      this.accessToken = response.data.access_token;
      // Token 7200 秒过期，提前 5 分钟刷新
      this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;
      return this.accessToken;
    } catch (error) {
      throw new Error(`获取 Access Token 失败: ${error.message}`);
    }
  }

  // 设置操作者 ID (unionid)
  setOperatorId(unionid) {
    this.operatorId = unionid;
    console.error(`[钉钉MCP] 操作者已设置: ${unionid}`);
    return true;
  }

  // 获取当前用户 unionid
  async getCurrentUserUnionId() {
    if (this.operatorId) {
      return this.operatorId;
    }
    // 如果没有设置，尝试获取管理员信息
    const token = await this.getAccessToken();
    try {
      const response = await axios({
        method: 'GET',
        url: `${DINGTALK_API_V2}/v1.0/im/sceneGroups/managers`,
        headers: {
          'x-acs-dingtalk-access-token': token
        }
      });
      if (response.data && response.data.userIds && response.data.userIds.length > 0) {
        // 获取第一个用户的 unionid
        const userResponse = await axios({
          method: 'POST',
          url: `${DINGTALK_API_BASE}/topapi/v2/user/get`,
          params: { access_token: token },
          data: { userid: response.data.userIds[0] }
        });
        if (userResponse.data && userResponse.data.result && userResponse.data.result.unionid) {
          this.operatorId = userResponse.data.result.unionid;
          return this.operatorId;
        }
      }
    } catch (error) {
      console.error('获取当前用户失败:', error.message);
    }
    return null;
  }

  // Wiki API v2.0 请求
  async wikiRequest(endpoint, params = {}) {
    const token = await this.getAccessToken();

    if (!this.operatorId) {
      await this.getCurrentUserUnionId();
    }

    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    }

    // 添加 operatorId
    if (this.operatorId) {
      queryParams.append('operatorId', this.operatorId);
    }

    const url = `${DINGTALK_API_V2}/v2.0/wiki/${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    try {
      const response = await axios({
        method: 'GET',
        url,
        headers: {
          'x-acs-dingtalk-access-token': token
        }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`${error.response.data?.message || error.message} (code: ${error.response.data?.code})`);
      }
      throw error;
    }
  }

  async resolveOperatorId(overrideOperatorId = null) {
    if (overrideOperatorId) {
      this.setOperatorId(overrideOperatorId);
      return this.operatorId;
    }

    if (!this.operatorId) {
      await this.getCurrentUserUnionId();
    }

    if (!this.operatorId) {
      throw new Error('未设置 operator_id，请传入 operator_id 或在配置文件中设置默认用户');
    }

    return this.operatorId;
  }

  async notableRequest(method, pathName, { operatorId = null, params = {}, data = null } = {}) {
    const token = await this.getAccessToken();
    const resolvedOperatorId = await this.resolveOperatorId(operatorId);
    const url = `${DINGTALK_API_V2}${pathName}`;

    try {
      const response = await axios({
        method,
        url,
        headers: {
          'x-acs-dingtalk-access-token': token,
          'Content-Type': 'application/json'
        },
        params: {
          ...params,
          operatorId: resolvedOperatorId
        },
        data
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`${error.response.data?.message || error.message} (code: ${error.response.data?.code})`);
      }
      throw error;
    }
  }

  // OAPI 请求
  async oapiRequest(apiName, data = null) {
    const token = await this.getAccessToken();
    const url = `${DINGTALK_API_BASE}/topapi/${apiName}`;
    
    const config = {
      method: data ? 'POST' : 'GET',
      url,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
      config.params = { access_token: token };
    } else {
      config.params = { access_token: token };
    }

    try {
      const response = await axios(config);
      if (response.data.errcode !== 0) {
        throw new Error(`${response.data.errmsg || '未知错误'} (错误码: ${response.data.errcode})`);
      }
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`钉钉 API 错误: ${error.response.data?.errmsg || error.message}`);
      }
      throw error;
    }
  }
}

const dingtalk = new DingTalkClient();

// MCP Server 定义
const server = new Server(
  {
    name: 'dingtalk-wiki-mcp',
    version: '1.1.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// 工具定义
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'set_operator',
        description: '设置操作者 unionid（用于访问 Wiki API）',
        inputSchema: {
          type: 'object',
          properties: {
            unionid: {
              type: 'string',
              description: '用户的 unionid'
            }
          },
          required: ['unionid']
        }
      },
      {
        name: 'show_config',
        description: '显示当前配置信息（默认用户和知识库列表）',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'list_wiki_workspaces',
        description: '列出用户有权限的知识库工作空间列表',
        inputSchema: {
          type: 'object',
          properties: {
            operator_id: {
              type: 'string',
              description: '操作者 unionid（不传则使用之前设置的）'
            }
          }
        }
      },
      {
        name: 'get_wiki_workspace',
        description: '获取知识库工作空间详情',
        inputSchema: {
          type: 'object',
          properties: {
            workspace_id: {
              type: 'string',
              description: '知识库工作空间 ID'
            }
          },
          required: ['workspace_id']
        }
      },
      {
        name: 'list_wiki_nodes',
        description: '列出知识库中的节点（文档和目录）',
        inputSchema: {
          type: 'object',
          properties: {
            workspace_id: {
              type: 'string',
              description: '知识库工作空间 ID'
            },
            parent_node_id: {
              type: 'string',
              description: '父节点 ID（不传则获取根目录）'
            }
          },
          required: ['workspace_id']
        }
      },
      {
        name: 'create_wiki_doc',
        description: '在知识库中创建新文档（需要 Document.WorkspaceDocument.Write 权限）',
        inputSchema: {
          type: 'object',
          properties: {
            workspace_id: {
              type: 'string',
              description: '知识库工作空间 ID'
            },
            name: {
              type: 'string',
              description: '文档名称'
            },
            doc_type: {
              type: 'string',
              description: '文档类型: DOC(文字), WORKBOOK(表格), MIND(脑图), FOLDER(文件夹)',
              enum: ['DOC', 'WORKBOOK', 'MIND', 'FOLDER'],
              default: 'DOC'
            },
            parent_node_id: {
              type: 'string',
              description: '父节点 ID（可选，不传则创建在根目录）'
            },
            name: {
              type: 'string',
              description: '文档名称'
            },
            content: {
              type: 'string',
              description: '文档内容（可选）'
            }
          },
          required: ['workspace_id', 'name']
        }
      },
      {
        name: 'get_wiki_node',
        description: '获取知识库节点详情',
        inputSchema: {
          type: 'object',
          properties: {
            node_id: {
              type: 'string',
              description: '节点 ID'
            }
          },
          required: ['node_id']
        }
      },
      {
        name: 'search_wiki',
        description: '搜索知识库内容',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: '搜索关键词'
            },
            workspace_id: {
              type: 'string',
              description: '指定知识库 ID（可选）'
            }
          },
          required: ['keyword']
        }
      },
      {
        name: 'list_departments',
        description: '列出钉钉组织架构中的部门列表',
        inputSchema: {
          type: 'object',
          properties: {
            fetch_child: {
              type: 'boolean',
              description: '是否递归获取子部门',
              default: true
            }
          }
        }
      },
      {
        name: 'get_department_users',
        description: '获取部门成员列表',
        inputSchema: {
          type: 'object',
          properties: {
            dept_id: {
              type: 'number',
              description: '部门 ID'
            },
            cursor: {
              type: 'number',
              description: '分页游标',
              default: 0
            },
            size: {
              type: 'number',
              description: '每页数量',
              default: 50
            }
          },
          required: ['dept_id']
        }
      },
      {
        name: 'get_user_info',
        description: '获取用户详细信息',
        inputSchema: {
          type: 'object',
          properties: {
            userid: {
              type: 'string',
              description: '用户 ID'
            }
          },
          required: ['userid']
        }
      },
      {
        name: 'list_notable_sheets',
        description: '读取 AI 表格 / Notable 的所有数据表。对于 .able 节点，直接使用 nodeId 作为 base_id。',
        inputSchema: {
          type: 'object',
          properties: {
            base_id: {
              type: 'string',
              description: 'Notable baseId。对 .able 节点来说，通常就是 nodeId。'
            },
            operator_id: {
              type: 'string',
              description: '操作者 unionid（不传则使用默认用户）'
            }
          },
          required: ['base_id']
        }
      },
      {
        name: 'list_notable_records',
        description: '读取 AI 表格 / Notable 某个数据表中的记录。',
        inputSchema: {
          type: 'object',
          properties: {
            base_id: {
              type: 'string',
              description: 'Notable baseId。对 .able 节点来说，通常就是 nodeId。'
            },
            sheet_id: {
              type: 'string',
              description: '数据表 ID，可先通过 list_notable_sheets 获取。'
            },
            max_results: {
              type: 'number',
              description: '返回记录数，默认 20',
              default: 20
            },
            next_token: {
              type: 'string',
              description: '分页 token，可选'
            },
            operator_id: {
              type: 'string',
              description: '操作者 unionid（不传则使用默认用户）'
            }
          },
          required: ['base_id', 'sheet_id']
        }
      }
    ]
  };
});

// 工具调用处理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'set_operator': {
        const { unionid } = args;
        dingtalk.setOperatorId(unionid);
        return {
          content: [{
            type: 'text',
            text: `✅ 操作者已设置为: ${unionid}`
          }]
        };
      }

      case 'show_config': {
        let output = '⚙️ 当前配置信息\n\n';
        
        output += '👤 默认用户:\n';
        if (userConfig.defaultUser && userConfig.users) {
          const user = userConfig.users[userConfig.defaultUser];
          output += `  姓名: ${user.name}\n`;
          output += `  User ID: ${user.userId}\n`;
          output += `  Union ID: ${user.unionId}\n`;
        } else {
          output += '  (未配置)\n';
        }
        
        output += '\n📚 知识库列表:\n';
        if (userConfig.workspaces) {
          Object.entries(userConfig.workspaces).forEach(([name, info], index) => {
            output += `  ${index + 1}. ${name}\n`;
            output += `     ID: ${info.id}\n`;
          });
        }
        
        output += '\n💡 使用提示:\n';
        output += '  - list_wiki_workspaces 和 list_wiki_nodes 会自动使用默认 operator_id\n';
        output += '  - 如需使用其他用户，可传入 operator_id 参数覆盖\n';
        
        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      }

      case 'list_wiki_workspaces': {
        // 如果传入了 operator_id，则使用传入的，否则使用默认值
        const operatorId = args.operator_id || DEFAULT_OPERATOR_ID;
        if (operatorId) {
          dingtalk.setOperatorId(operatorId);
        } else {
          throw new Error('未设置 operator_id，请传入 operator_id 或在配置文件中设置默认用户');
        }
        const result = await dingtalk.wikiRequest('workspaces');
        const workspaces = result.workspaces || [];
        
        let output = `📚 知识库工作空间列表 (${workspaces.length}个)\n\n`;
        workspaces.forEach((ws, index) => {
          output += `${index + 1}. ${ws.name}\n`;
          output += `   ID: ${ws.workspaceId}\n`;
          output += `   类型: ${ws.type}\n`;
          output += `   描述: ${ws.description || '无'}\n`;
          output += `   链接: ${ws.url}\n\n`;
        });
        
        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      }

      case 'get_wiki_workspace': {
        const { workspace_id } = args;
        // 通过列表获取详情
        const result = await dingtalk.wikiRequest('workspaces');
        const workspaces = result.workspaces || [];
        const workspace = workspaces.find(ws => ws.workspaceId === workspace_id);
        
        if (!workspace) {
          return {
            content: [{
              type: 'text',
              text: `⚠️ 未找到知识库: ${workspace_id}`
            }],
            isError: true
          };
        }
        
        return {
          content: [{
            type: 'text',
            text: `📚 知识库详情\n\n${JSON.stringify(workspace, null, 2)}`
          }]
        };
      }

      case 'list_wiki_nodes': {
        const { workspace_id, parent_node_id, operator_id } = args;
        const opId = operator_id || DEFAULT_OPERATOR_ID;
        if (opId) {
          dingtalk.setOperatorId(opId);
        } else {
          throw new Error('未设置 operator_id，请传入 operator_id 或在配置文件中设置默认用户');
        }
        
        const params = { workspaceId: workspace_id };
        if (parent_node_id) {
          params.parentNodeId = parent_node_id;
        } else {
          // 如果没有传入 parent_node_id，先获取 workspace 详情得到 rootNodeId
          const workspacesResult = await dingtalk.wikiRequest('workspaces');
          const workspace = workspacesResult.workspaces?.find(ws => ws.workspaceId === workspace_id);
          if (workspace && workspace.rootNodeId) {
            params.parentNodeId = workspace.rootNodeId;
          }
        }
        
        const result = await dingtalk.wikiRequest('nodes', params);
        const nodes = result.nodes || [];
        
        let output = `📄 知识库节点列表 (${nodes.length}个)\n\n`;
        nodes.forEach((node, index) => {
          const icon = node.type === 'FOLDER' ? '📁' : '📄';
          output += `${index + 1}. ${icon} ${node.name}\n`;
          output += `   ID: ${node.nodeId}\n`;
          output += `   类型: ${node.type}\n`;
          output += `   有子节点: ${node.hasChildren ? '是' : '否'}\n`;
          output += `   链接: ${node.url}\n\n`;
        });
        
        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      }

      case 'create_wiki_doc': {
        const { workspace_id, parent_node_id, name, doc_type = 'DOC', operator_id } = args;
        const opId = operator_id || DEFAULT_OPERATOR_ID;
        if (!opId) {
          throw new Error('未设置 operator_id，请传入 operator_id 或在配置文件中设置默认用户');
        }
        
        try {
          // 获取 access token
          const token = await dingtalk.getAccessToken();
          
          // 构建请求体 - 使用正确的 Document API v1.0
          const requestBody = {
            name: name,
            docType: doc_type,
            operatorId: opId
          };
          
          if (parent_node_id) {
            requestBody.parentNodeId = parent_node_id;
          }
          
          // 使用正确的 API 端点: POST /v1.0/doc/workspaces/{workspaceId}/docs
          const response = await axios({
            method: 'POST',
            url: `${DINGTALK_API_V2}/v1.0/doc/workspaces/${workspace_id}/docs`,
            headers: {
              'x-acs-dingtalk-access-token': token,
              'Content-Type': 'application/json'
            },
            data: requestBody
          });
          
          const doc = response.data;
          const typeLabels = {
            DOC: '文档',
            WORKBOOK: '表格',
            MIND: '脑图',
            FOLDER: '文件夹'
          };
          const typeIcons = {
            DOC: '📄',
            WORKBOOK: '📊',
            MIND: '🧠',
            FOLDER: '📁'
          };
          const typeLabel = typeLabels[doc_type] || '文档';
          const typeIcon = typeIcons[doc_type] || '📄';
          const lines = [
            `✅ ${typeLabel}创建成功！`,
            '',
            `${typeIcon} ${name}`,
            `🗂️ 类型: ${doc_type}`,
            `🆔 Node ID: ${doc.nodeId}`
          ];

          if (doc.docKey) {
            lines.push(`🔑 DocKey: ${doc.docKey}`);
          }
          if (doc.url) {
            lines.push(`🔗 链接: ${doc.url}`);
          }
          if (doc.workspaceId) {
            lines.push(`📂 Workspace ID: ${doc.workspaceId}`);
          }

          return {
            content: [{
              type: 'text',
              text: lines.join('\n')
            }]
          };
        } catch (error) {
          if (error.response?.data?.code === 'InvalidAuthentication') {
            return {
              content: [{
                type: 'text',
                text: `⚠️ Access Token 已过期或无效\n\n请稍后重试，或检查 AppKey/AppSecret 配置。`
              }],
              isError: true
            };
          }
          if (error.response?.data?.code === 'invalidRequest.workspaceNode.nameConflict') {
            return {
              content: [{
                type: 'text',
                text: `⚠️ 文档名称冲突\n\n知识库中已存在同名文档，请使用其他名称。`
              }],
              isError: true
            };
          }
          if (error.response?.data?.code?.includes('forbidden.accessDenied')) {
            return {
              content: [{
                type: 'text',
                text: `⚠️ 权限不足\n\n错误信息: ${error.response.data.message || error.message}\n\n需要申请的权限: Document.WorkspaceDocument.Write - 创建文档权限`
              }],
              isError: true
            };
          }
          throw error;
        }
      }

      case 'get_wiki_node': {
        const { node_id } = args;
        // 通过搜索或其他方式获取节点详情
        return {
          content: [{
            type: 'text',
            text: `📄 节点 ID: ${node_id}\n\n请使用 list_wiki_nodes 获取节点列表，然后通过节点链接访问详情。`
          }]
        };
      }

      case 'search_wiki': {
        const { keyword, workspace_id } = args;
        // Wiki 搜索 API 需要额外权限
        return {
          content: [{
            type: 'text',
            text: `🔍 搜索知识库: ${keyword}\n\n搜索功能需要 Wiki.Search 权限。\n\n请直接访问知识库网页版进行搜索：\nhttps://alidocs.dingtalk.com/i/spaces/${workspace_id || ''}/search?keyword=${encodeURIComponent(keyword)}`
          }]
        };
      }

      case 'list_departments': {
        const result = await dingtalk.oapiRequest('v2/department/listsub', {
          dept_id: 1,
          fetch_child: args.fetch_child !== false
        });
        
        return {
          content: [{
            type: 'text',
            text: `✅ 部门列表 (${result.result?.length || 0}个)\n\n${JSON.stringify(result.result || [], null, 2)}`
          }]
        };
      }

      case 'get_department_users': {
        const { dept_id, cursor = 0, size = 50 } = args;
        const result = await dingtalk.oapiRequest('v2/user/list', {
          dept_id,
          cursor,
          size
        });
        
        return {
          content: [{
            type: 'text',
            text: `✅ 部门成员列表\n\n${JSON.stringify(result.result || {}, null, 2)}`
          }]
        };
      }

      case 'get_user_info': {
        const { userid } = args;
        const result = await dingtalk.oapiRequest('v2/user/get', {
          userid
        });

        // 同时返回 unionid，方便设置 operator
        const userInfo = result.result || {};
        let output = `✅ 用户信息\n\n${JSON.stringify(userInfo, null, 2)}\n\n`;
        if (userInfo.unionid) {
          output += `💡 设置操作者命令:\nmcporter call dingtalk-wiki.set_operator unionid="${userInfo.unionid}"`;
        }

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      }

      case 'list_notable_sheets': {
        const { base_id, operator_id } = args;
        const result = await dingtalk.notableRequest('GET', `/v1.0/notable/bases/${base_id}/sheets`, {
          operatorId: operator_id || DEFAULT_OPERATOR_ID
        });
        const sheets = result.value || [];
        let output = `📊 数据表列表 (${sheets.length}个)\n\n`;
        sheets.forEach((sheet, index) => {
          output += `${index + 1}. ${sheet.name}\n`;
          output += `   ID: ${sheet.id}\n\n`;
        });
        if (!sheets.length) {
          output += '（没有返回任何数据表）';
        }
        output += `💡 说明: 对 .able 节点，通常直接使用 nodeId 作为 base_id。`;

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      }

      case 'list_notable_records': {
        const { base_id, sheet_id, max_results = 20, next_token, operator_id } = args;
        const payload = {
          maxResults: max_results
        };
        if (next_token) {
          payload.nextToken = next_token;
        }
        const result = await dingtalk.notableRequest('POST', `/v1.0/notable/bases/${base_id}/sheets/${sheet_id}/records/list`, {
          operatorId: operator_id || DEFAULT_OPERATOR_ID,
          data: payload
        });
        const records = result.records || [];
        let output = `📋 数据表记录 (${records.length}条)\n\n`;
        output += `${JSON.stringify(records, null, 2)}\n\n`;
        output += `hasMore: ${result.hasMore ? 'true' : 'false'}\n`;
        output += `nextToken: ${result.nextToken || ''}`;

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ 错误: ${error.message}`
      }],
      isError: true
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('钉钉 Wiki MCP Server 已启动 v2.0');
  console.error(`Config path: ${CONFIG_PATH}`);
}

main().catch(console.error);
