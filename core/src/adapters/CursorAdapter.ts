import { AICConfig, Adapter, ParseResult, SerializeResult, ToolType } from '../types';
import { Parser, ParseError } from '../parser/Parser';
import { Serializer, SerializeError } from '../serializer/Serializer';

export class CursorAdapter implements Adapter {
  readonly name = 'Cursor';
  readonly toolType: ToolType = 'cursor';
  readonly version = '1.0.0';
  readonly supportedFilePatterns = ['.cursorrules', '.cursor/rules.md'];

  private parser: CursorParser;
  private serializer: CursorSerializer;

  constructor() {
    this.parser = new CursorParser();
    this.serializer = new CursorSerializer();
  }

  async parse(content: string): Promise<ParseResult> {
    return this.parser.parse(content);
  }

  async serialize(config: AICConfig): Promise<SerializeResult> {
    return this.serializer.serialize(config);
  }
}

class CursorParser extends Parser {
  readonly toolType = 'cursor';
  readonly supportedPatterns = ['.cursorrules', '.cursor/rules.md'];

  async parse(content: string): Promise<ParseResult> {
    try {
      const config = this.createDefaultConfig();
      const warnings: string[] = [];

      const lines = content.split('\n');
      let currentSection = '';
      let currentContent: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('##')) {
          if (currentSection) {
            this.addRule(config, currentSection, currentContent.join('\n'));
          }
          currentSection = trimmedLine.slice(2).trim();
          currentContent = [];
        } else if (trimmedLine.startsWith('## ')) {
          if (currentSection) {
            this.addRule(config, currentSection, currentContent.join('\n'));
          }
          currentSection = trimmedLine.slice(3).trim();
          currentContent = [];
        } else if (trimmedLine.startsWith('- **Project Type:**') || trimmedLine.startsWith('**Project Type:**')) {
          const match = trimmedLine.match(/\*\*Project Type:\*\*\s*(.+)/);
          if (match) {
            config.context.projectType = match[1].trim();
          }
        } else if (trimmedLine.startsWith('- **') || trimmedLine.startsWith('**')) {
          if (currentContent.length > 0 || trimmedLine.length > 0) {
            currentContent.push(line);
          }
        } else {
          if (trimmedLine || currentContent.length > 0) {
            currentContent.push(line);
          }
        }
      }

      if (currentSection) {
        this.addRule(config, currentSection, currentContent.join('\n'));
      }

      if (config.rules.length === 0 && content.trim()) {
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

  private addRule(config: AICConfig, name: string, content: string): void {
    if (!content.trim()) return;

    const files = this.extractFilePatterns(content);
    const cleanedContent = this.removeFilePatterns(content);

    config.rules.push({
      name,
      files,
      content: cleanedContent.trim(),
    });
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

class CursorSerializer extends Serializer {
  readonly toolType = 'cursor';

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

      if (config.context.projectType) {
        lines.push(`- **Project Type:** ${config.context.projectType}`);
        lines.push('');
      }

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
          lines.push(`- ${server.name}: ${server.command} ${server.args.join(' ')}`);
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

export default CursorAdapter;
