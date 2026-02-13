import { AICConfig, Adapter, ParseResult, SerializeResult, ToolType } from '../types';
import { Parser } from '../parser/Parser';
import { Serializer } from '../serializer/Serializer';

export class BoltAdapter implements Adapter {
  readonly name = 'Bolt';
  readonly toolType: ToolType = 'bolt';
  readonly version = '1.0.0';
  readonly supportedFilePatterns = ['bolt.json', '.bolt.json'];

  private parser: BoltParser;
  private serializer: BoltSerializer;

  constructor() {
    this.parser = new BoltParser();
    this.serializer = new BoltSerializer();
  }

  async parse(content: string): Promise<ParseResult> {
    return this.parser.parse(content);
  }

  async serialize(config: AICConfig): Promise<SerializeResult> {
    return this.serializer.serialize(config);
  }
}

class BoltParser extends Parser {
  readonly toolType = 'bolt';
  readonly supportedPatterns = ['bolt.json', '.bolt.json'];

  async parse(content: string): Promise<ParseResult> {
    try {
      const config = this.createDefaultConfig();
      const warnings: string[] = [];

      const json = JSON.parse(content);

      if (json.name) {
        config.meta.name = json.name;
      }

      if (json.description) {
        config.meta.description = json.description;
      }

      if (json.projectType) {
        config.context.projectType = json.projectType;
      }

      if (json.instructions) {
        const instructions = Array.isArray(json.instructions) 
          ? json.instructions 
          : [json.instructions];
        
        for (const inst of instructions) {
          if (typeof inst === 'string') {
            config.rules.push({ name: 'Instruction', content: inst });
          } else if (typeof inst === 'object') {
            config.rules.push({
              name: inst.title || inst.name || 'Instruction',
              description: inst.description,
              files: inst.files,
              content: inst.content || inst.text || '',
            });
          }
        }
      }

      if (json.rules) {
        const rules = Array.isArray(json.rules) ? json.rules : [json.rules];
        for (const rule of rules) {
          if (typeof rule === 'string') {
            config.rules.push({ name: 'Rule', content: rule });
          } else if (typeof rule === 'object') {
            config.rules.push({
              name: rule.name || 'Rule',
              content: rule.content || rule.rule || '',
              files: rule.files,
            });
          }
        }
      }

      if (json.shell) {
        if (json.shell.commands || json.shell.command) {
          const cmds = json.shell.commands || [json.shell.command];
          config.context.allowedCommands.push(...cmds);
        }
      }

      if (json.mcpServers) {
        config.mcpServers = Array.isArray(json.mcpServers) 
          ? json.mcpServers 
          : [json.mcpServers];
      }

      if (json.model) {
        if (typeof json.model === 'string') {
          const parts = json.model.split(':');
          config.model = {
            provider: parts[0] || 'anthropic',
            model: parts[1] || json.model,
          };
        } else {
          config.model = json.model;
        }
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

class BoltSerializer extends Serializer {
  readonly toolType = 'bolt';

  async serialize(config: AICConfig): Promise<SerializeResult> {
    try {
      const errors = this.validateConfig(config);
      
      if (errors.length > 0) {
        return { success: false, error: errors.join('; ') };
      }

      const output: Record<string, unknown> = {
        name: config.meta.name,
        description: config.meta.description,
        projectType: config.context.projectType,
      };

      if (config.rules.length > 0) {
        output.instructions = config.rules.map(r => ({
          title: r.name,
          content: r.content,
          files: r.files,
        }));
      }

      if (config.context.allowedCommands.length > 0) {
        output.shell = {
          commands: config.context.allowedCommands,
        };
      }

      if (config.mcpServers && config.mcpServers.length > 0) {
        output.mcpServers = config.mcpServers;
      }

      if (config.model) {
        output.model = `${config.model.provider}:${config.model.model}`;
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

export default BoltAdapter;
