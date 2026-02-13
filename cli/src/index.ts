#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  AdapterFactory,
  CursorAdapter,
  WindsurfAdapter,
  ZedAdapter,
  BoltAdapter,
  CopilotAdapter,
  ToolType,
} from '@aiconfigbridge/core';

const factory = new AdapterFactory();
factory.register(new CursorAdapter());
factory.register(new WindsurfAdapter());
factory.register(new ZedAdapter());
factory.register(new BoltAdapter());
factory.register(new CopilotAdapter());

const program = new Command();

program
  .name('aiconfigbridge')
  .description('AI编程工具配置统一管理工具')
  .version('1.0.0');

program
  .command('convert')
  .description('转换配置格式')
  .requiredOption('-i, --input <file>', '输入文件路径')
  .requiredOption('-f, --from <tool>', '源工具 (cursor|windsurf|zed|bolt|copilot)')
  .requiredOption('-t, --to <tool>', '目标工具 (cursor|windsurf|zed|bolt|copilot)')
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

program.parse();
