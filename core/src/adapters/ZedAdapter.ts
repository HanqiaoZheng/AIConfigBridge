import { AICConfig, Adapter, ParseResult, SerializeResult, ToolType } from '../types';
import { Parser } from '../parser/Parser';
import { Serializer } from '../serializer/Serializer';

export class ZedAdapter implements Adapter {
  readonly name = 'Zed';
  readonly toolType: ToolType = 'zed';
  readonly version = '1.0.0';
  readonly supportedFilePatterns = ['config.json', '.zedrules', 'zed.rules'];

  private parser: ZedParser;
  private serializer: ZedSerializer;

  constructor() {
    this.parser = new ZedParser();
    this.serializer = new ZedSerializer();
  }

  async parse(content: string): Promise<ParseResult> {
    return this.parser.parse(content);
  }

  async serialize(config: AICConfig): Promise<SerializeResult> {
    return this.serializer.serialize(config);
  }
}

class ZedParser extends Parser {
  readonly toolType = 'zed';
  readonly supportedPatterns = ['config.json', '.zedrules', 'zed.rules'];

  async parse(content: string): Promise<ParseResult> {
    try {
      const config = this.createDefaultConfig();
      const warnings: string[] = [];

      const isJson = content.trim().startsWith('{');
      
      if (isJson) {
        return this.parseJson(content, config, warnings);
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

  private parseJson(content: string, config: AICConfig, warnings: string[]): ParseResult {
    const json = JSON.parse(content);

    if (json.version) {
      config.version = json.version;
    }

    if (json.name) {
      config.meta.name = json.name;
    }

    if (json.description) {
      config.meta.description = json.description;
    }

    if (json.project_type || json.projectType) {
      config.context.projectType = json.project_type || json.projectType;
    }

    if (json.rules) {
      const rules = Array.isArray(json.rules) ? json.rules : [json.rules];
      for (const rule of rules) {
        if (typeof rule === 'string') {
          config.rules.push({ name: 'Rule', content: rule });
        } else if (typeof rule === 'object') {
          config.rules.push({
            name: rule.name || 'Rule',
            description: rule.description,
            files: rule.files,
            content: rule.content || rule.rule || '',
            priority: rule.priority,
          });
        }
      }
    }

    if (json.allowed_commands || json.allowedCommands) {
      config.context.allowedCommands = json.allowed_commands || json.allowedCommands;
    }

    if (json.mcp_servers || json.mcpServers) {
      const servers = json.mcp_servers || json.mcpServers;
      config.mcpServers = Array.isArray(servers) ? servers : [servers];
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
  }

  private parseMarkdown(content: string, config: AICConfig, warnings: string[]): ParseResult {
    const sections = content.split(/(?=^#{1,3}\s)/m);

    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) continue;

      const lines = trimmed.split('\n');
      const titleMatch = lines[0].match(/^#{1,3}\s+(.+)/);

      if (titleMatch) {
        const title = titleMatch[1].trim().toLowerCase();
        const sectionContent = lines.slice(1).join('\n').trim();

        if (title.includes('project') || title.includes('context')) {
          this.parseContext(config, sectionContent);
        } else if (title.includes('mcp')) {
          this.parseMcp(config, sectionContent);
        } else if (title.includes('model')) {
          this.parseModel(config, sectionContent);
        } else {
          config.rules.push({
            name: titleMatch[1].trim(),
            content: sectionContent,
          });
        }
      }
    }

    return { success: true, config, warnings: warnings.length > 0 ? warnings : undefined };
  }

  private parseContext(config: AICConfig, content: string): void {
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/\*\*([^:]+):\*\*\s*(.+)/);
      if (match) {
        const [, key, value] = match;
        const lowerKey = key.toLowerCase();
        
        if (lowerKey.includes('type')) {
          config.context.projectType = value.trim();
        } else if (lowerKey.includes('command')) {
          config.context.allowedCommands.push(value.trim());
        } else if (lowerKey.includes('standard') || lowerKey.includes('style')) {
          config.context.codingStandards.push(value.trim());
        }
      }
    }
  }

  private parseMcp(config: AICConfig, content: string): void {
    const lines = content.split('\n');
    const serverRegex = /-\s*(\S+):\s*(.+)/;
    
    for (const line of lines) {
      const match = line.match(serverRegex);
      if (match) {
        const args = match[2].split(/\s+/).filter(Boolean);
        config.mcpServers = config.mcpServers || [];
        config.mcpServers.push({
          name: match[1],
          command: args[0] || '',
          args: args.slice(1),
        });
      }
    }
  }

  private parseModel(config: AICConfig, content: string): void {
    const match = content.match(/\*\*Model:\*\*\s*(.+)/);
    if (match) {
      const modelStr = match[1].trim();
      const parts = modelStr.split(':');
      config.model = {
        provider: parts[0] || 'anthropic',
        model: parts[1] || modelStr,
      };
    }
  }
}

class ZedSerializer extends Serializer {
  readonly toolType = 'zed';

  async serialize(config: AICConfig): Promise<SerializeResult> {
    try {
      const errors = this.validateConfig(config);
      
      if (errors.length > 0) {
        return { success: false, error: errors.join('; ') };
      }

      const output: Record<string, unknown> = {
        version: config.version,
        name: config.meta.name,
        description: config.meta.description,
        project_type: config.context.projectType,
        rules: config.rules.map(r => ({
          name: r.name,
          content: r.content,
          files: r.files,
          priority: r.priority,
        })),
      };

      if (config.context.allowedCommands.length > 0) {
        output.allowed_commands = config.context.allowedCommands;
      }

      if (config.context.codingStandards.length > 0) {
        output.coding_standards = config.context.codingStandards;
      }

      if (config.mcpServers && config.mcpServers.length > 0) {
        output.mcp_servers = config.mcpServers;
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

export default ZedAdapter;
