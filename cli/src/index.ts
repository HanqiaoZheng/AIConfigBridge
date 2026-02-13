#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { homedir } from 'os';
import * as readline from 'readline';
import {
  AdapterFactory,
  CursorAdapter,
  WindsurfAdapter,
  ZedAdapter,
  BoltAdapter,
  CopilotAdapter,
  ClaudeCodeAdapter,
  OpenCodeAdapter,
  AiderAdapter,
  ToolType,
} from '@aiconfigbridge/core';

const factory = new AdapterFactory();
factory.register(new CursorAdapter());
factory.register(new WindsurfAdapter());
factory.register(new ZedAdapter());
factory.register(new BoltAdapter());
factory.register(new CopilotAdapter());
factory.register(new ClaudeCodeAdapter());
factory.register(new OpenCodeAdapter());
factory.register(new AiderAdapter());

interface CLIConfig {
  defaultFrom?: string;
  defaultTo?: string;
  defaultOutput?: string;
  lastDirectory?: string;
}

function getConfigPath(): string {
  return join(homedir(), '.aiconfigbridge.json');
}

function loadConfig(): CLIConfig {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveConfig(config: CLIConfig): void {
  try {
    writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
  } catch (error) {
    console.warn('无法保存配置文件:', error);
  }
}

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function interactiveMode(): Promise<void> {
  console.log('\n=== AIConfigBridge 交互式模式 ===\n');
  console.log('欢迎使用AI配置转换工具！\n');

  const config = loadConfig();
  const tools = factory.getSupportedTools();

  console.log('支持的工具:');
  tools.forEach((tool, i) => console.log(`  ${i + 1}. ${tool}`));
  console.log('');

  const fromAnswer = await question(`请选择源工具 (1-${tools.length}) [默认: ${config.defaultFrom || '1'}]: `);
  const fromIndex = fromAnswer ? parseInt(fromAnswer) - 1 : (tools.findIndex(t => t === config.defaultFrom) || 0);
  const fromTool = tools[fromIndex] || tools[0];

  const toAnswer = await question(`请选择目标工具 (1-${tools.length}) [默认: ${config.defaultTo || tools[1] || tools[0]}]: `);
  const toIndex = toAnswer ? parseInt(toAnswer) - 1 : 1;
  const toTool = tools[toIndex] || tools[1] || tools[0];

  const inputAnswer = await question('请输入配置文件路径: ');
  const inputPath = resolve(inputAnswer.trim());

  if (!existsSync(inputPath)) {
    console.error('文件不存在:', inputPath);
    process.exit(1);
  }

  const content = readFileSync(inputPath, 'utf-8');
  console.log(`\n正在将 ${fromTool} 配置转换为 ${toTool} 配置...\n`);

  try {
    const transformer = factory.getTransformer();
    const result = await transformer.convert(content, fromTool as ToolType, toTool as ToolType);

    if (!result.success) {
      console.error('转换失败:', result.error);
      process.exit(1);
    }

    const targetAdapter = factory.get(toTool as ToolType);
    if (!targetAdapter) {
      console.error('不支持的目标工具:', toTool);
      process.exit(1);
    }

    const serializeResult = await targetAdapter.serialize(result.config!);

    if (!serializeResult.success) {
      console.error('序列化失败:', serializeResult.error);
      process.exit(1);
    }

    const outputAnswer = await question('请输入输出文件路径 [直接回车显示结果]: ');
    let outputPath = outputAnswer.trim();

    if (outputPath) {
      outputPath = resolve(outputPath);
      writeFileSync(outputPath, serializeResult.content!);
      console.log(`\n已保存到: ${outputPath}`);
    } else {
      console.log('\n=== 转换结果 ===\n');
      console.log(serializeResult.content);
    }

    if (result.warnings && result.warnings.length > 0) {
      console.log('\n警告:');
      result.warnings.forEach(w => console.log(`  - ${w}`));
    }

    const saveAnswer = await question('\n是否保存为默认配置? (y/n): ');
    if (saveAnswer.toLowerCase() === 'y') {
      config.defaultFrom = fromTool;
      config.defaultTo = toTool;
      if (outputPath) {
        config.defaultOutput = outputPath;
      }
      saveConfig(config);
      console.log('配置已保存');
    }

  } catch (error) {
    console.error('错误:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const program = new Command();

program
  .name('aiconfigbridge')
  .description('AI编程工具配置统一管理工具')
  .version('1.0.0');

program
  .command('interactive', { isDefault: false })
  .description('交互式模式')
  .action(interactiveMode);

program
  .command('convert')
  .description('转换配置格式')
  .requiredOption('-i, --input <file>', '输入文件路径')
  .requiredOption('-f, --from <tool>', '源工具')
  .requiredOption('-t, --to <tool>', '目标工具')
  .option('-o, --output <file>', '输出文件路径')
  .action(async (options) => {
    try {
      const inputPath = resolve(options.input);
      const content = readFileSync(inputPath, 'utf-8');
      
      const transformer = factory.getTransformer();
      const result = await transformer.convert(content, options.from as ToolType, options.to as ToolType);
      
      if (!result.success) {
        console.error('转换失败:', result.error);
        process.exit(1);
      }
      
      const targetAdapter = factory.get(options.to as ToolType);
      if (!targetAdapter) {
        console.error('不支持的目标工具:', options.to);
        process.exit(1);
      }
      
      const serializeResult = await targetAdapter.serialize(result.config!);
      
      if (!serializeResult.success) {
        console.error('序列化失败:', serializeResult.error);
        process.exit(1);
      }
      
      if (options.output) {
        const outputPath = resolve(options.output);
        writeFileSync(outputPath, serializeResult.content!);
        console.log(`已保存到: ${outputPath}`);
      } else {
        console.log(serializeResult.content);
      }
      
      if (result.warnings) {
        for (const warning of result.warnings) {
          console.warn('警告:', warning);
        }
      }
    } catch (error) {
      console.error('错误:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('parse')
  .description('解析配置文件为统一格式')
  .requiredOption('-i, --input <file>', '输入文件路径')
  .option('-t, --tool <tool>', '工具类型 (自动检测)')
  .option('-o, --output <file>', '输出文件路径 (JSON)')
  .action(async (options) => {
    try {
      const inputPath = resolve(options.input);
      const content = readFileSync(inputPath, 'utf-8');
      
      let toolType = options.tool as ToolType | undefined;
      
      if (!toolType) {
        const detected = factory.detectToolFromFile(inputPath);
        if (!detected) {
          console.error('无法自动检测工具类型，请使用 -t 指定');
          process.exit(1);
        }
        toolType = detected;
      }
      
      const result = await factory.parse(content, toolType);
      
      if (!result.success) {
        console.error('解析失败:', result.error);
        process.exit(1);
      }
      
      const json = JSON.stringify(result.config, null, 2);
      
      if (options.output) {
        const outputPath = resolve(options.output);
        writeFileSync(outputPath, json);
        console.log(`已保存到: ${outputPath}`);
      } else {
        console.log(json);
      }
    } catch (error) {
      console.error('错误:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('列出支持的工具')
  .action(() => {
    const tools = factory.getSupportedTools();
    console.log('支持的工具:');
    for (const tool of tools) {
      const adapter = factory.get(tool);
      console.log(`  - ${tool}: ${adapter?.supportedFilePatterns.join(', ')}`);
    }
  });

program
  .command('detect')
  .description('检测配置文件类型')
  .requiredOption('-i, --input <file>', '输入文件路径')
  .action(async (options) => {
    try {
      const inputPath = resolve(options.input);
      const detected = factory.detectToolFromFile(inputPath);
      
      if (detected) {
        console.log(`检测到工具类型: ${detected}`);
      } else {
        console.log('无法识别工具类型');
      }
    } catch (error) {
      console.error('错误:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('管理CLI配置')
  .action(() => {
    const config = loadConfig();
    console.log('当前配置:');
    console.log(JSON.stringify(config, null, 2));
  });

program.parse();
