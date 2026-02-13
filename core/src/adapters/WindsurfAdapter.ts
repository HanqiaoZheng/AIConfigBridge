import { AICConfig, Adapter, ParseResult, SerializeResult, ToolType } from '../types';
import { Parser } from '../parser/Parser';
import { Serializer } from '../serializer/Serializer';

export class WindsurfAdapter implements Adapter {
  readonly name = 'Windsurf';
  readonly toolType: ToolType = 'windsurf';
  readonly version = '1.0.0';
  readonly supportedFilePatterns = ['.windsurfrules', '.windsurf/rules.md'];

  private parser: WindsurfParser;
  private serializer: WindsurfSerializer;

  constructor() {
    this.parser = new WindsurfParser();
    this.serializer = new WindsurfSerializer();
  }

  async parse(content: string): Promise<ParseResult> {
    return this.parser.parse(content);
  }

  async serialize(config: AICConfig): Promise<SerializeResult> {
    return this.serializer.serialize(config);
  }
}

class WindsurfParser extends Parser {
  readonly toolType = 'windsurf';
  readonly supportedPatterns = ['.windsurfrules', '.windsurf/rules.md'];

  async parse(content: string): Promise<ParseResult> {
    try {
      const config = this.createDefaultConfig();
      const warnings: string[] = [];

      const sections = content.split(/(?=^#{1,3}\s)/m);
      let hasRules = false;

      for (const section of sections) {
        const trimmed = section.trim();
        if (!trimmed) continue;

        const lines = trimmed.split('\n');
        const titleMatch = lines[0].match(/^#{1,3}\s+(.+)/);

        if (titleMatch) {
          hasRules = true;
          const title = titleMatch[1].trim().toLowerCase();
          const sectionContent = lines.slice(1).join('\n').trim();

          if (title.includes('project') || title.includes('context')) {
            this.parseContext(config, sectionContent);
          } else if (title.includes('mcp') || title.includes('server')) {
            this.parseMcpServers(config, sectionContent);
          } else {
            const files = this.extractFilePatterns(sectionContent);
            const cleanedContent = this.removeFilePatterns(sectionContent);

            config.rules.push({
              name: titleMatch[1].trim(),
              files,
              content: cleanedContent,
            });
          }
        } else if (config.rules.length === 0 && trimmed) {
          hasRules = true;
          config.rules.push({
            name: 'General',
            content: trimmed,
          });
        }
      }

      if (!hasRules && content.trim()) {
        config.rules.push({
          name: 'General Rules',
          content: content.trim(),
        });
        warnings.push('No section headers found, treating all content as single rule');
      }

      return {
        success: true,
        config,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parse error',
      };
    }
  }

  private parseContext(config: AICConfig, content: string): void {
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('- **') || trimmed.startsWith('**')) {
        const match = trimmed.match(/\*\*([^:]+):\*\*\s*(.+)/);
        if (match) {
          const [, key, value] = match;
          
          if (key.toLowerCase().includes('type')) {
            config.context.projectType = value.trim();
          } else if (key.toLowerCase().includes('standard') || key.toLowerCase().includes('style')) {
            config.context.codingStandards.push(value.trim());
          } else if (key.toLowerCase().includes('command')) {
            config.context.allowedCommands.push(value.trim());
          }
        }
      }
    }
  }

  private parseMcpServers(config: AICConfig, content: string): void {
    const lines = content.split('\n');
    const serverLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('```')) {
        serverLines.push(trimmed);
      }
    }

    if (serverLines.length > 0) {
      config.mcpServers = config.mcpServers || [];
      
      for (const line of serverLines) {
        const cleanLine = line.replace(/^- \*/, '').trim();
        if (cleanLine && cleanLine.startsWith('```')) continue;
        
        const parts = cleanLine.split(/\s+/);
        if (parts.length >= 2) {
          config.mcpServers.push({
            name: parts[0],
            command: parts[1],
            args: parts.slice(2),
          });
        }
      }
    }
  }

  private extractFilePatterns(content: string): string[] {
    const patterns: string[] = [];
    const regex = /@(\S+\.\w+|\*\.\w+|\S+\/\*\*)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      patterns.push(match[1]);
    }

    return [...new Set(patterns)];
  }

  private removeFilePatterns(content: string): string {
    return content.replace(/@\S+\.\w+/g, '').replace(/@\S+\/\*\*/g, '').trim();
  }
}

class WindsurfSerializer extends Serializer {
  readonly toolType = 'windsurf';

  async serialize(config: AICConfig): Promise<SerializeResult> {
    try {
      const errors = this.validateConfig(config);
      
      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join('; '),
        };
      }

      const lines: string[] = [];
      lines.push(`# ${config.meta.name}`);
      lines.push('');

      if (config.meta.description) {
        lines.push(config.meta.description);
        lines.push('');
      }

      lines.push('## Project Context');
      lines.push('');
      
      if (config.context.projectType) {
        lines.push(`- **Project Type:** ${config.context.projectType}`);
      }
      
      if (config.context.codingStandards.length > 0) {
        for (const standard of config.context.codingStandards) {
          lines.push(`- **Coding Standard:** ${standard}`);
        }
      }
      
      if (config.context.allowedCommands.length > 0) {
        for (const cmd of config.context.allowedCommands) {
          lines.push(`- **Allowed Command:** ${cmd}`);
        }
      }
      
      lines.push('');

      for (const rule of config.rules) {
        lines.push(`## ${rule.name}`);
        lines.push('');

        if (rule.files && rule.files.length > 0) {
          const fileRef = rule.files.map(f => `@${f}`).join(' ');
          lines.push(fileRef);
          lines.push('');
        }

        if (rule.content) {
          lines.push(rule.content);
          lines.push('');
        }
      }

      if (config.mcpServers && config.mcpServers.length > 0) {
        lines.push('## MCP Servers');
        lines.push('');
        
        for (const server of config.mcpServers) {
          const argsStr = server.args.length > 0 ? ` ${server.args.join(' ')}` : '';
          lines.push(`- ${server.name}: ${server.command}${argsStr}`);
        }
        
        lines.push('');
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

export default WindsurfAdapter;
