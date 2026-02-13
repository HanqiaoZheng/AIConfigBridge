import { AICConfig, Adapter, ParseResult, SerializeResult, ToolType } from '../types';
import { Parser } from '../parser/Parser';
import { Serializer } from '../serializer/Serializer';

export class ClaudeCodeAdapter implements Adapter {
  readonly name = 'Claude Code';
  readonly toolType: ToolType = 'claude-code';
  readonly version = '1.0.0';
  readonly supportedFilePatterns = [
    'settings.json',
    '.claude/settings.json',
    '.claude/settings.local.json',
    '.claude.json'
  ];

  private parser: ClaudeCodeParser;
  private serializer: ClaudeCodeSerializer;

  constructor() {
    this.parser = new ClaudeCodeParser();
    this.serializer = new ClaudeCodeSerializer();
  }

  async parse(content: string): Promise<ParseResult> {
    return this.parser.parse(content);
  }

  async serialize(config: AICConfig): Promise<SerializeResult> {
    return this.serializer.serialize(config);
  }
}

class ClaudeCodeParser extends Parser {
  readonly toolType = 'claude-code';
  readonly supportedPatterns = [
    'settings.json',
    '.claude/settings.json',
    '.claude/settings.local.json',
    '.claude.json'
  ];

  async parse(content: string): Promise<ParseResult> {
    try {
      const config = this.createDefaultConfig();
      const warnings: string[] = [];

      const json = JSON.parse(content);

      if (json.model) {
        const modelStr = Array.isArray(json.model) ? json.model[0] : json.model;
        const parts = modelStr.split(':');
        config.model = {
          provider: parts[0] || 'anthropic',
          model: parts[1] || modelStr,
        };
      }

      if (json.projectInstructions || json.instructions) {
        const instructions = json.projectInstructions || json.instructions;
        const instList = Array.isArray(instructions) ? instructions : [instructions];
        for (const inst of instList) {
          if (typeof inst === 'string') {
            config.rules.push({ name: 'Instructions', content: inst });
          } else if (typeof inst === 'object') {
            config.rules.push({
              name: inst.title || inst.name || 'Instructions',
              content: inst.description || inst.content || '',
            });
          }
        }
      }

      if (json.permissions?.allow) {
        const allowList = json.permissions.allow;
        for (const perm of allowList) {
          if (typeof perm === 'string') {
            if (perm.includes('Bash') || perm.includes('Bash(*)')) {
              config.context.allowedCommands.push(perm);
            } else {
              config.context.codingStandards.push(perm);
            }
          }
        }
      }

      if (json.mcpServers) {
        const servers = json.mcpServers;
        config.mcpServers = Array.isArray(servers) ? servers : [servers];
      }

      if (json.env) {
        config.meta.description = Object.entries(json.env)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
      }

      return { success: true, config, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parse error',
      };
    }
  }
}

class ClaudeCodeSerializer extends Serializer {
  readonly toolType = 'claude-code';

  async serialize(config: AICConfig): Promise<SerializeResult> {
    try {
      const errors = this.validateConfig(config);
      
      if (errors.length > 0) {
        return { success: false, error: errors.join('; ') };
      }

      const output: Record<string, unknown> = {};

      if (config.model) {
        output.model = `${config.model.provider}:${config.model.model}`;
      }

      if (config.rules.length > 0) {
        output.projectInstructions = config.rules.map(r => ({
          title: r.name,
          content: r.content,
        }));
      }

      if (config.context.allowedCommands.length > 0 || config.context.codingStandards.length > 0) {
        output.permissions = {
          allow: [
            ...config.context.allowedCommands,
            ...config.context.codingStandards,
          ],
        };
      }

      if (config.mcpServers && config.mcpServers.length > 0) {
        output.mcpServers = config.mcpServers;
      }

      return {
        success: true,
        content: JSON.stringify(output, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown serialize error',
      };
    }
  }
}

export default ClaudeCodeAdapter;
