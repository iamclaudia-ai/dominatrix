#!/usr/bin/env bun
/**
 * DOMINATRIX CLI
 * "She sees everything. She controls everything. She owns the DOM."
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { DominatrixClient } from './client.js';

const program = new Command();

// Create client instance
const client = new DominatrixClient();

/**
 * Helper to connect to server
 */
async function ensureConnected() {
  if (!client.isConnected()) {
    const spinner = ora('Connecting to DOMINATRIX server...').start();
    try {
      await client.connect();
      spinner.succeed(chalk.green('Connected to server'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to connect to server'));
      console.error(chalk.red('\n❌ Make sure the server is running:'));
      console.error(chalk.yellow('   dominatrix-server\n'));
      process.exit(1);
    }
  }
}

/**
 * Format output nicely
 */
function output(data: any, json = false) {
  if (json) {
    console.log(JSON.stringify(data, null, 2));
  } else if (typeof data === 'string') {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * CLI Program Setup
 */
program
  .name('dominatrix')
  .description(chalk.red.bold('🔥 DOMINATRIX') + chalk.gray(' - She owns the DOM'))
  .version('0.5.0');

/**
 * Tab Management Commands
 */
program
  .command('tabs')
  .description('List all connected browser tabs across all profiles')
  .option('--pretty', 'Output formatted text instead of JSON')
  .option('-p, --profile <email>', 'Filter tabs by profile email')
  .action(async (options) => {
    await ensureConnected();
    const spinner = ora('Fetching tabs...').start();

    try {
      const tabs = await client.sendCommand('listTabs', { profileId: options.profile });
      spinner.stop();

      if (options.pretty) {
        // Group tabs by profile
        const profileGroups = new Map<string, any[]>();
        tabs.forEach((tab: any) => {
          const profileName = tab.profileName || 'Unknown Profile';
          if (!profileGroups.has(profileName)) {
            profileGroups.set(profileName, []);
          }
          profileGroups.get(profileName)!.push(tab);
        });

        console.log(chalk.bold(`\n📑 Connected Tabs (${tabs.length} total):\n`));

        // Display tabs grouped by profile
        profileGroups.forEach((profileTabs, profileName) => {
          console.log(chalk.bold.magenta(`\n🔷 ${profileName} (${profileTabs.length} tabs):`));
          profileTabs.forEach((tab: any, index: number) => {
            console.log(
              `  ${chalk.cyan(index + 1)}. ${chalk.bold(tab.title)}` +
              `\n     ${chalk.gray(tab.url)}` +
              `\n     ${tab.active ? chalk.green('● Active') : chalk.gray('○ Inactive')}` +
              `\n`
            );
          });
        });
      } else {
        // Default: JSON output (for AI consumption)
        output(tabs, true);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch tabs'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

/**
 * DOM Snapshot Command
 */
program
  .command('snapshot')
  .description('Get DOM snapshot of current page')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .option('-v, --verbose', 'Include all node details')
  .option('--pretty', 'Output formatted text instead of JSON')
  .action(async (options) => {
    await ensureConnected();
    const spinner = ora('Building DOM snapshot...').start();

    try {
      const snapshot = await client.sendCommand('snapshot', { tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      if (options.pretty) {
        console.log(chalk.bold('\n🌳 DOM Snapshot:\n'));
        printNode(snapshot, 0);
      } else {
        // Default: JSON output (for AI consumption)
        output(snapshot, true);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to get snapshot'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

function printNode(node: any, depth: number) {
  const indent = '  '.repeat(depth);
  const uid = chalk.gray(`[${node.uid}]`);
  const tag = chalk.cyan(node.tagName || node.role);
  const name = node.name ? chalk.white(` "${node.name}"`) : '';
  const classes = node.classList ? chalk.yellow(`.${node.classList.join('.')}`) : '';

  console.log(`${indent}${uid} ${tag}${classes}${name}`);

  if (node.children) {
    node.children.forEach((child: any) => printNode(child, depth + 1));
  }
}

/**
 * Script Execution Commands
 */
program
  .command('exec <script>')
  .description('Execute JavaScript in page context')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .option('--pretty', 'Output formatted text instead of JSON')
  .action(async (script, options) => {
    await ensureConnected();
    const spinner = ora('Executing script...').start();

    try {
      const result = await client.sendCommand('executeScript', { script, tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      console.log(chalk.bold('\n✨ Script Result:\n'));
      output(result, options.json);
    } catch (error) {
      spinner.fail(chalk.red('Script execution failed'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

program
  .command('eval <expression>')
  .description('Evaluate JavaScript expression and return result')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .option('--pretty', 'Output formatted text instead of JSON')
  .action(async (expression, options) => {
    await ensureConnected();
    const spinner = ora('Evaluating expression...').start();

    try {
      const result = await client.sendCommand('evaluateExpression', { expression, tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      console.log(chalk.bold('\n💎 Result:\n'));
      output(result, options.json);
    } catch (error) {
      spinner.fail(chalk.red('Evaluation failed'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

/**
 * Screenshot Command
 */
program
  .command('screenshot')
  .description('Capture screenshot of current page (auto-saves as JPG)')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .option('-f, --full', 'Capture full page')
  .action(async (options) => {
    await ensureConnected();
    const spinner = ora('Capturing screenshot...').start();

    try {
      const dataUrl = await client.sendCommand('screenshot', { fullPage: options.full, tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      // Auto-save to temp directory as JPG
      const timestamp = Date.now();
      const tempDir = '/tmp/dominatrix-screenshots';
      await Bun.write(`${tempDir}/.keep`, ''); // Ensure directory exists
      const filename = `screenshot-${timestamp}.jpg`;
      const filepath = `${tempDir}/${filename}`;

      // Convert PNG data URL to JPG
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Write as JPG (Bun will handle the conversion if needed)
      await Bun.write(filepath, buffer);

      // Return the filepath in JSON format for easy consumption
      output({
        filepath,
        message: 'Screenshot captured and saved'
      }, true);
    } catch (error) {
      spinner.fail(chalk.red('Screenshot failed'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

/**
 * Console Commands
 */
program
  .command('console')
  .description('Show console messages')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .option('--pretty', 'Output formatted text instead of JSON')
  .option('-l, --limit <number>', 'Limit number of logs shown', '50')
  .option('--type <type>', 'Filter by log type (log, info, warn, error, debug)')
  .option('-f, --filter <keyword>', 'Filter messages containing keyword')
  .option('--errors', 'Show only errors')
  .option('--warnings', 'Show only warnings')
  .action(async (options) => {
    await ensureConnected();
    const spinner = ora('Fetching console logs...').start();

    try {
      let logs = await client.sendCommand('getConsoleLogs', { tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      // Apply filters
      if (options.type) {
        logs = logs.filter((l: any) =>
          l.type?.toLowerCase() === options.type.toLowerCase()
        );
      }

      if (options.errors) {
        logs = logs.filter((l: any) => l.type === 'error');
      }

      if (options.warnings) {
        logs = logs.filter((l: any) => l.type === 'warn');
      }

      if (options.filter) {
        const keyword = options.filter.toLowerCase();
        logs = logs.filter((l: any) =>
          l.message?.toLowerCase().includes(keyword)
        );
      }

      // Limit results
      const limit = parseInt(options.limit);
      const total = logs.length;
      logs = logs.slice(0, limit);

      if (options.pretty) {
        console.log(chalk.bold(`\n📋 Console Logs (${logs.length}${total > limit ? ` of ${total}` : ''}):\n`));

        if (logs.length === 0) {
          console.log(chalk.gray('  No logs match filters'));
        } else {
          logs.forEach((log: any) => {
            const icon = getLogIcon(log.type);
            const timestamp = new Date(log.timestamp).toLocaleTimeString();
            const message = log.message.length > 150
              ? log.message.substring(0, 147) + '...'
              : log.message;

            console.log(
              `${icon} ${chalk.gray(timestamp)} ${message}`
            );
          });

          if (total > limit) {
            console.log(chalk.gray(`\n  ... ${total - limit} more (use --limit to see more)`));
          }
        }
      } else {
        // Default: JSON output (for AI consumption)
        output({ total, limit, logs }, true);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch console logs'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

function getLogIcon(type: string): string {
  switch (type) {
    case 'error': return chalk.red('✘');
    case 'warn': return chalk.yellow('⚠');
    case 'info': return chalk.blue('ℹ');
    case 'debug': return chalk.gray('🐛');
    default: return chalk.white('▸');
  }
}

/**
 * Network Commands
 */
program
  .command('network')
  .description('Show network requests')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .option('--pretty', 'Output formatted text instead of JSON')
  .option('-l, --limit <number>', 'Limit number of requests shown', '20')
  .option('--type <type>', 'Filter by resource type (xhr, fetch, script, stylesheet, image, etc.)')
  .option('-s, --status <code>', 'Filter by status code (200, 404, etc.)')
  .option('-f, --filter <keyword>', 'Filter URLs containing keyword')
  .option('--failed', 'Show only failed requests (4xx, 5xx)')
  .action(async (options) => {
    await ensureConnected();
    const spinner = ora('Fetching network requests...').start();

    try {
      let requests = await client.sendCommand('listNetworkRequests', { tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      // Apply filters
      if (options.type) {
        requests = requests.filter((r: any) =>
          r.type?.toLowerCase() === options.type.toLowerCase()
        );
      }

      if (options.status) {
        const statusCode = parseInt(options.status);
        requests = requests.filter((r: any) => r.status === statusCode);
      }

      if (options.filter) {
        const keyword = options.filter.toLowerCase();
        requests = requests.filter((r: any) =>
          r.url?.toLowerCase().includes(keyword)
        );
      }

      if (options.failed) {
        requests = requests.filter((r: any) =>
          r.status && r.status >= 400
        );
      }

      // Limit results
      const limit = parseInt(options.limit);
      const total = requests.length;
      requests = requests.slice(0, limit);

      if (options.pretty) {
        console.log(chalk.bold(`\n🌐 Network Requests (${requests.length}${total > limit ? ` of ${total}` : ''}):\n`));

        if (requests.length === 0) {
          console.log(chalk.gray('  No requests match filters'));
        } else {
          requests.forEach((req: any) => {
            const method = chalk.bold(req.method);
            const status = req.status
              ? req.status >= 200 && req.status < 300
                ? chalk.green(req.status)
                : req.status >= 400
                ? chalk.red(req.status)
                : chalk.yellow(req.status)
              : chalk.gray('pending');

            // Shorten URL for display
            const url = req.url.length > 100
              ? req.url.substring(0, 97) + '...'
              : req.url;

            const type = req.type ? chalk.cyan(`[${req.type}]`) : '';

            console.log(`${method} ${status} ${type} ${chalk.gray(url)}`);
          });

          if (total > limit) {
            console.log(chalk.gray(`\n  ... ${total - limit} more (use --limit to see more)`));
          }
        }
      } else {
        // Default: JSON output (for AI consumption)
        output({ total, limit, requests }, true);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch network requests'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

/**
 * Storage Commands
 */
program
  .command('storage')
  .description('Show localStorage and sessionStorage')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .option('--pretty', 'Output formatted text instead of JSON')
  .action(async (options) => {
    await ensureConnected();
    const spinner = ora('Fetching storage...').start();

    try {
      const storage = await client.sendCommand('getStorage', { tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      if (options.pretty) {
        console.log(chalk.bold('\n💾 Local Storage:\n'));
        Object.entries(storage.localStorage).forEach(([key, value]) => {
          console.log(`  ${chalk.cyan(key)}: ${chalk.white(value)}`);
        });

        console.log(chalk.bold('\n🔐 Session Storage:\n'));
        Object.entries(storage.sessionStorage).forEach(([key, value]) => {
          console.log(`  ${chalk.cyan(key)}: ${chalk.white(value)}`);
        });
      } else {
        // Default: JSON output (for AI consumption)
        output(storage, true);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch storage'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

program
  .command('cookies')
  .description('Show cookies for current page')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .option('--pretty', 'Output formatted text instead of JSON')
  .action(async (options) => {
    await ensureConnected();
    const spinner = ora('Fetching cookies...').start();

    try {
      const cookies = await client.sendCommand('getCookies', { tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      if (options.pretty) {
        console.log(chalk.bold('\n🍪 Cookies:\n'));
        cookies.forEach((cookie: any) => {
          console.log(
            `  ${chalk.cyan(cookie.name)}: ${chalk.white(cookie.value)}` +
            `\n    ${chalk.gray(`Domain: ${cookie.domain}, Path: ${cookie.path}`)}\n`
          );
        });
      } else {
        // Default: JSON output (for AI consumption)
        output(cookies, true);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch cookies'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

/**
 * Navigation Commands
 */
program
  .command('navigate <url>')
  .description('Navigate to URL')
  .option('-p, --profile <email>', 'Profile to navigate in (required when multiple profiles connected)')
  .action(async (url, options) => {
    await ensureConnected();
    const spinner = ora(`Navigating to ${url}...`).start();

    try {
      await client.sendCommand('navigate', { url, profileId: options.profile });
      spinner.succeed(chalk.green(`Navigated to ${url}`));
    } catch (error) {
      spinner.fail(chalk.red('Navigation failed'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

/**
 * HTML Command
 */
program
  .command('html [selector]')
  .description('Get HTML of element or whole page')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .option('--pretty', 'Output formatted text instead of JSON')
  .action(async (selector, options) => {
    await ensureConnected();
    const spinner = ora('Fetching HTML...').start();

    try {
      const html = await client.sendCommand('getHTML', { selector, tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      if (options.pretty) {
        console.log(chalk.bold('\n📄 HTML:\n'));
        console.log(html);
      } else {
        // Default: JSON output (for AI consumption)
        output({ html }, true);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch HTML'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

/**
 * Text Command
 */
program
  .command('text')
  .description('Get plain text content of page (innerText)')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .action(async (options) => {
    await ensureConnected();
    const spinner = ora('Fetching text...').start();

    try {
      const text = await client.sendCommand('getText', { tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      // Always output as JSON for token efficiency
      output({ text }, true);
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch text'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

/**
 * Markdown Command
 */
program
  .command('markdown')
  .description('Get page content as Markdown (preserves structure)')
  .option('-t, --tab-id <id>', 'Tab ID to target (required for multi-profile)')
  .action(async (options) => {
    await ensureConnected();
    const spinner = ora('Converting to Markdown...').start();

    try {
      const markdown = await client.sendCommand('getMarkdown', { tabId: options.tabId ? parseInt(options.tabId) : undefined });
      spinner.stop();

      // Always output as JSON for token efficiency
      output({ markdown }, true);
    } catch (error) {
      spinner.fail(chalk.red('Failed to convert to Markdown'));
      console.error(error);
      process.exit(1);
    }

    client.disconnect();
  });

/**
 * ASCII Art Banner
 */
if (process.argv.length === 2) {
  console.log(chalk.red.bold(`
╔═══════════════════════════════════════════════╗
║                                               ║
║    🔥 D O M I N A T R I X 🔥                 ║
║                                               ║
║    "She sees everything.                      ║
║     She controls everything.                  ║
║     She owns the DOM."                        ║
║                                               ║
╚═══════════════════════════════════════════════╝
`));
  console.log(chalk.gray('Run with --help to see available commands\n'));
}

program.parse();
