import { AICConfig, Adapter, ParseResult, SerializeResult, ToolType } from '../types';
import { Parser } from '../parser/Parser';
import { Serializer } from '../serializer/Serializer';

export class AiderAdapter implements Adapter {
  readonly name = 'Aider';
  readonly toolType: ToolType = 'aider';
  readonly version = '1.0.0';
  readonly supportedFilePatterns = [
    '.aider.conf.yml',
    'aider.conf.yml',
    '.aider.conf.yaml',
    'aider.conf.yaml',
    'CONVENTIONS.md'
  ];

  private parser: AiderParser;
  private serializer: AiderSerializer;

  constructor() {
    this.parser = new AiderParser();
    this.serializer = new AiderSerializer();
  }

  async parse(content: string): Promise<ParseResult> {
    return this.parser.parse(content);
  }

  async serialize(config: AICConfig): Promise<SerializeResult> {
    return this.serializer.serialize(config);
  }
}

class AiderParser extends Parser {
  readonly toolType = 'aider';
  readonly supportedPatterns = [
    '.aider.conf.yml',
    'aider.conf.yml',
    '.aider.conf.yaml',
    'aider.conf.yaml',
    'CONVENTIONS.md'
  ];

  async parse(content: string): Promise<ParseResult> {
    try {
      const config = this.createDefaultConfig();
      const warnings: string[] = [];

      const isYaml = content.trim().startsWith('#') || content.includes(':');

      if (isYaml) {
        return this.parseYaml(content, config, warnings);
      } else {
        return this.parseMarkdown(content, config, warnings);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parse error',
      };
    }
  }

  private parseYaml(content: string, config: AICConfig, warnings: string[]): ParseResult {
    const lines = content.split('\n');
    let currentKey = '';
    let currentList: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      if (trimmed.includes(':')) {
        if (currentKey) {
          this.applyYamlKey(config, currentKey, currentList);
        }
        const [key, ...valueParts] = trimmed.split(':');
        currentKey = key.trim();
        currentList = valueParts.length > 0 ? [valueParts.join(':').trim()] : [];
      } else if (trimmed.startsWith('-')) {
        currentList.push(trimmed.slice(1).trim());
      }
    }

    if (currentKey) {
      this.applyYamlKey(config, currentKey, currentList);
    }

    return { success: true, config, warnings: warnings.length > 0 ? warnings : undefined };
  }

  private applyYamlKey(config: AICConfig, key: string, values: string[]): void {
    const lowerKey = key.toLowerCase();

    if (lowerKey === 'model') {
      const modelStr = values[0] || '';
      const parts = modelStr.split('/');
      config.model = {
        provider: parts[0] || 'openai',
        model: parts[1] || modelStr,
      };
    } else if (lowerKey === 'read' || lowerKey === 'read-whole-prompt') {
      for (const val of values) {
        if (val.endsWith('.md') || val.endsWith('.txt')) {
          config.rules.push({
            name: `Read: ${val}`,
            content: `[File: ${val}]`,
          });
        }
      }
    } else if (lowerKey === 'user-prompt' || lowerKey === 'system-prompt') {
      config.rules.push({
        name: key,
        content: values.join(' '),
      });
    } else if (lowerKey.includes('command') || lowerKey.includes('bash')) {
      config.context.allowedCommands.push(...values);
    } else if (lowerKey.includes('api') || lowerKey.includes('key')) {
      // Skip API keys
    } else if (values.length > 0) {
      config.context.codingStandards.push(`${key}: ${values.join(', ')}`);
    }
  }

  private parseMarkdown(content: string, config: AICConfig, warnings: string[]): ParseResult {
    const sections = content.split(/(?=^#{1,3}\s)/m);

    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) continue;

      const lines = trimmed.split('\n');
      const titleMatch = lines[0].match(/^#{1,3}\s+(.+)/);

      if (titleMatch) {
        config.rules.push({
          name: titleMatch[1].trim(),
          content: lines.slice(1).join('\n').trim(),
        });
      } else if (config.rules.length === 0) {
        config.rules.push({
          name: 'Conventions',
          content: trimmed,
        });
      }
    }

    return { success: true, config, warnings: warnings.length > 0 ? warnings : undefined };
  }
}

class AiderSerializer extends Serializer {
  readonly toolType = 'aider';

  async serialize(config: AICConfig): Promise<SerializeResult> {
    try {
      const errors = this.validateConfig(config);
      
      if (errors.length > 0) {
        return { success: false, error: errors.join('; ') };
      }

      const lines: string[] = [];

      lines.push('# Aider Configuration');
      lines.push('');

      if (config.model) {
        lines.push(`model: ${config.model.provider}/${config.model.model}`);
        lines.push('');
      }

      if (config.context.allowedCommands.length > 0) {
        lines.push('allowed-commands:');
        for (const cmd of config.context.allowedCommands) {
          lines.push(`  - ${cmd}`);
        }
        lines.push('');
      }

      const fileReadRules = config.rules.filter(r => r.name.startsWith('Read:'));
      if (fileReadRules.length > 0) {
        lines.push('read:');
        for (const rule of fileReadRules) {
          const fileMatch = rule.content.match(/\[File: (.+)\]/);
          if (fileMatch) {
            lines.push(`  - ${fileMatch[1]}`);
          }
        }
        lines.push('');
      }

      if (config.rules.length > 0) {
        lines.push('# Project-specific rules should be in CONVENTIONS.md');
        lines.push('# See: https://aider.chat/docs/config.html');
      }

      return {
        success: true,
        content: lines.join('\n').trim(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown serialize error',
      };
    }
  }
}

export default AiderAdapter;
