#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const puppeteer = require('puppeteer-core');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const ALIDOCS_BASE = 'https://alidocs.dingtalk.com';
const REPO_ROOT = path.join(__dirname, '..');
const DEFAULT_BROWSER_PORT = Number(process.env.DINGTALK_BROWSER_PORT || 9222);
const DEFAULT_BROWSER_USER_DATA_DIR = path.join(REPO_ROOT, '.browser', 'EdgeUserData');
const DEFAULT_OUTPUT_DIR = path.join(REPO_ROOT, '.output', 'docs');
const LOGIN_WAIT_MS = Number(process.env.DINGTALK_LOGIN_WAIT_MS || 10 * 60 * 1000);
const BROWSER_URL = `http://127.0.0.1:${DEFAULT_BROWSER_PORT}`;
const BROWSER_USER_DATA_DIR = process.env.DINGTALK_BROWSER_USER_DATA_DIR || DEFAULT_BROWSER_USER_DATA_DIR;
const EDGE_CANDIDATES = [
  process.env.DINGTALK_EDGE_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe')
].filter(Boolean);

function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      result[key] = true;
      continue;
    }

    result[key] = next;
    index += 1;
  }

  return result;
}

function printUsageAndExit() {
  console.error(
    [
      'Usage:',
      '  npm run read:doc -- --url "https://alidocs.dingtalk.com/i/nodes/<dentryUuid>" --output ./tmp/doc.md',
      '  npm run read:doc -- --dentry-uuid "<dentryUuid>" --output ./tmp/doc.md'
    ].join('\n')
  );
  process.exit(1);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function decodeHtml(input) {
  return String(input || '')
    .replace(/&amp;#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\u00A0/g, ' ');
}

function escapePipe(text) {
  return String(text || '').replace(/\|/g, '\\|');
}

function sanitizeSegment(input) {
  return String(input || '')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '') || 'untitled';
}

function stringifyYamlValue(value) {
  if (value == null || value === '') {
    return '""';
  }

  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function renderInline(node) {
  if (node == null) {
    return '';
  }

  if (typeof node === 'string') {
    return decodeHtml(node);
  }

  if (!Array.isArray(node)) {
    return '';
  }

  const tag = node[0];
  const props = node[1] && typeof node[1] === 'object' && !Array.isArray(node[1]) ? node[1] : {};
  const children = props === node[1] ? node.slice(2) : node.slice(1);
  let text = children.map(renderInline).join('');

  if (props.href) {
    text = `[${text}](${props.href})`;
  }
  if (props.bold) {
    text = `**${text}**`;
  }
  if (props.italic) {
    text = `*${text}*`;
  }
  if (props.strike) {
    text = `~~${text}~~`;
  }
  if (props.code) {
    text = `\`${text}\``;
  }
  if (tag === 'br') {
    return '  \n';
  }

  return text;
}

function renderCell(node) {
  if (!Array.isArray(node)) {
    return '';
  }

  const props = node[1] && typeof node[1] === 'object' && !Array.isArray(node[1]) ? node[1] : {};
  const children = props === node[1] ? node.slice(2) : node.slice(1);
  const parts = [];

  for (const child of children) {
    if (Array.isArray(child)) {
      const tag = child[0];
      if (tag === 'p' || /^h[1-6]$/.test(tag) || tag === 'span') {
        parts.push(renderInline(child).trim());
      } else {
        parts.push(renderCell(child).trim());
      }
    } else if (typeof child === 'string') {
      parts.push(decodeHtml(child).trim());
    }
  }

  return parts.filter(Boolean).join('<br>');
}

function renderTable(node) {
  const props = node[1] && typeof node[1] === 'object' && !Array.isArray(node[1]) ? node[1] : {};
  const children = props === node[1] ? node.slice(2) : node.slice(1);
  const rows = children
    .filter(child => Array.isArray(child) && child[0] === 'tr')
    .map(row => {
      const rowProps = row[1] && typeof row[1] === 'object' && !Array.isArray(row[1]) ? row[1] : {};
      return (rowProps === row[1] ? row.slice(2) : row.slice(1))
        .filter(cell => Array.isArray(cell) && cell[0] === 'tc')
        .map(renderCell);
    })
    .filter(row => row.length > 0);

  if (!rows.length) {
    return '';
  }

  const header = rows[0];
  const body = rows.slice(1);
  const lines = [
    `| ${header.map(escapePipe).join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...body.map(row => `| ${row.map(escapePipe).join(' | ')} |`)
  ];

  return `${lines.join('\n')}\n\n`;
}

function renderBlock(node) {
  if (!Array.isArray(node)) {
    return '';
  }

  const tag = node[0];
  const props = node[1] && typeof node[1] === 'object' && !Array.isArray(node[1]) ? node[1] : {};
  const children = props === node[1] ? node.slice(2) : node.slice(1);

  if (tag === 'root') {
    return `${children.map(renderBlock).join('')}`.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  if (/^h[1-6]$/.test(tag)) {
    return `${'#'.repeat(Number(tag.slice(1)))} ${renderInline(node).trim()}\n\n`;
  }
  if (tag === 'p') {
    const text = renderInline(node).trim();
    if (!text) {
      return '';
    }

    if (props.list) {
      const indent = '  '.repeat(props.list.level || 0);
      const prefix = props.list.isOrdered ? '1.' : '-';
      return `${indent}${prefix} ${text}\n`;
    }

    return `${text}\n\n`;
  }
  if (tag === 'table') {
    return renderTable(node);
  }
  if (tag === 'hr') {
    return '---\n\n';
  }
  if (tag === 'blockquote') {
    const text = renderInline(node).trim();
    return text ? `> ${text}\n\n` : '';
  }
  if (tag === 'img') {
    const alt = props.alt || 'image';
    const src = props.src || '';
    return src ? `![${alt}](${src})\n\n` : `![${alt}]()\n\n`;
  }
  if (tag === 'span') {
    return renderInline(node);
  }

  return children.map(renderBlock).join('');
}

function parseJsonMaybe(input) {
  if (input == null) {
    return null;
  }
  return typeof input === 'string' ? JSON.parse(input) : input;
}

function renderDocPackageToMarkdown(checkpointContent) {
  const packageData = parseJsonMaybe(checkpointContent);
  const main = packageData?.parts?.[packageData?.main];
  const body = main?.data?.body;
  if (!body) {
    return '_(empty body)_';
  }

  return renderBlock(body).trim() || '_(empty body)_';
}

function buildOutputMarkdown(dentryInfo, markdown, sourceUrl) {
  const lines = [
    '---',
    'tags:',
    '  - dingtalk',
    '  - doc',
    '  - browser-assisted',
    `title: ${stringifyYamlValue(dentryInfo.name || 'Untitled document')}`,
    `dentry_uuid: ${stringifyYamlValue(dentryInfo.dentryUuid || '')}`,
    `dentry_key: ${stringifyYamlValue(dentryInfo.dentryKey || '')}`,
    `doc_key: ${stringifyYamlValue(dentryInfo.docKey || '')}`,
    `source_url: ${stringifyYamlValue(sourceUrl || '')}`,
    'sync_method: "browser-internal-api"',
    '---',
    '',
    `# ${dentryInfo.name || 'Untitled document'}`,
    '',
    markdown.trim(),
    ''
  ];

  return lines.join('\n');
}

function extractDentryUuidFromUrl(input) {
  const match = String(input || '').match(/\/i\/nodes\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

function findEdgeExecutable() {
  const executablePath = EDGE_CANDIDATES.find(candidate => candidate && fs.existsSync(candidate));
  if (!executablePath) {
    throw new Error('Microsoft Edge was not found. Set DINGTALK_EDGE_PATH to continue.');
  }
  return executablePath;
}

async function isDebugEndpointAlive() {
  try {
    await axios.get(`${BROWSER_URL}/json/version`, { timeout: 1500 });
    return true;
  } catch {
    return false;
  }
}

async function waitForDebugEndpoint(timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isDebugEndpointAlive()) {
      return;
    }
    await sleep(500);
  }

  throw new Error(`Browser debug endpoint was not ready: ${BROWSER_URL}`);
}

async function ensureManagedBrowser(entryUrl) {
  if (await isDebugEndpointAlive()) {
    return { launchedManagedBrowser: false };
  }

  ensureDir(BROWSER_USER_DATA_DIR);
  const executablePath = findEdgeExecutable();
  const args = [
    `--remote-debugging-port=${DEFAULT_BROWSER_PORT}`,
    `--user-data-dir=${BROWSER_USER_DATA_DIR}`,
    '--no-first-run',
    '--new-window',
    entryUrl
  ];

  const child = spawn(executablePath, args, {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  await waitForDebugEndpoint(20000);
  return { launchedManagedBrowser: true };
}

async function pickAlidocsPage(browser) {
  const pages = await browser.pages();
  const alidocsPage = pages.find(page => {
    const currentUrl = page.url();
    return currentUrl.startsWith(ALIDOCS_BASE) || currentUrl.startsWith('https://login.dingtalk.com');
  });
  return alidocsPage || browser.newPage();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dentryUuid = args['dentry-uuid'] || extractDentryUuidFromUrl(args.url);
  const sourceUrl = args.url || (dentryUuid ? `${ALIDOCS_BASE}/i/nodes/${dentryUuid}` : null);

  if (!dentryUuid || !sourceUrl) {
    printUsageAndExit();
  }

  const { launchedManagedBrowser } = await ensureManagedBrowser(sourceUrl);
  const browser = await puppeteer.connect({ browserURL: BROWSER_URL, defaultViewport: null });

  try {
    let page = await pickAlidocsPage(browser);
    await page.bringToFront().catch(() => {});
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});

    const rawFetch = async (relativeUrl, init = {}) => {
      const targetUrl = new URL(relativeUrl, ALIDOCS_BASE).toString();
      return page.evaluate(
        async ({ targetUrl: browserTargetUrl, init: requestInit }) => {
          const response = await fetch(browserTargetUrl, {
            credentials: 'include',
            ...requestInit,
            headers: requestInit.headers || {}
          });
          const text = await response.text();
          let data = text;
          try {
            data = JSON.parse(text);
          } catch {}

          return {
            ok: response.ok,
            status: response.status,
            data
          };
        },
        { targetUrl, init }
      );
    };

    const startedAt = Date.now();
    let prompted = false;

    while (Date.now() - startedAt < LOGIN_WAIT_MS) {
      const pages = await browser.pages();
      const candidate = pages.find(currentPage => {
        const currentUrl = currentPage.url();
        return currentUrl.startsWith(ALIDOCS_BASE) || currentUrl.startsWith('https://login.dingtalk.com');
      });

      if (candidate) {
        page = candidate;
      }

      if (!prompted) {
        if (launchedManagedBrowser) {
          console.log(`A managed Edge profile was started at ${BROWSER_USER_DATA_DIR}. If a DingTalk login page appears there, finish login in that browser window. The script will continue automatically.`);
        } else {
          console.log('A browser with remote debugging is already available. If a DingTalk login page appears there, finish login in that browser window. The script will continue automatically.');
        }
        prompted = true;
      }

      const probe = await rawFetch(`/box/api/v2/dentry/info?dentryUuid=${encodeURIComponent(dentryUuid)}`);
      if (probe.ok && probe.data?.isSuccess) {
        const dentryInfo = probe.data.data;
        const documentData = await rawFetch('/api/document/data', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'a-dentry-key': dentryInfo.dentryKey,
            'source_doc_app': 'doc',
            'color-theme': 'light'
          },
          body: JSON.stringify({ fetchBody: true })
        });

        if (!documentData.ok || !documentData.data?.isSuccess) {
          throw new Error(`Failed to read document body for dentryKey=${dentryInfo.dentryKey}`);
        }

        const checkpointContent = documentData.data?.data?.documentContent?.checkpoint?.content;
        const markdownBody = renderDocPackageToMarkdown(checkpointContent);
        const fullMarkdown = buildOutputMarkdown(dentryInfo, markdownBody, sourceUrl);
        const outputPath = path.resolve(
          args.output || path.join(DEFAULT_OUTPUT_DIR, `${sanitizeSegment(dentryInfo.name || dentryUuid)}.md`)
        );

        ensureDir(path.dirname(outputPath));
        fs.writeFileSync(outputPath, fullMarkdown, 'utf8');

        console.log(
          JSON.stringify(
            {
              ok: true,
              dentryUuid,
              name: dentryInfo.name,
              outputPath,
              relativeOutputPath: normalizeRelativePath(path.relative(REPO_ROOT, outputPath))
            },
            null,
            2
          )
        );
        return;
      }

      await sleep(5000);
    }

    throw new Error('Timed out waiting for DingTalk web login.');
  } finally {
    browser.disconnect();
  }
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
