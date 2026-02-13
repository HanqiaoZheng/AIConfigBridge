import { AICConfig, Adapter, ParseResult, SerializeResult, ToolType } from '../types';
import { Parser } from '../parser/Parser';
import { Serializer } from '../serializer/Serializer';

export class CopilotAdapter implements Adapter {
  readonly name = 'GitHub Copilot';
  readonly toolType: ToolType = 'copilot';
  readonly version = '1.0.0';
  readonly supportedFilePatterns = ['.copilot.json', 'copilot.json', '.github/copilot-instructions.md'];

  private parser: CopilotParser;
  private serializer: CopilotSerializer;

  constructor() {
    this.parser = new CopilotParser();
    this.serializer = new CopilotSerializer();
  }

  async parse(content: string): Promise<ParseResult> {
    return this.parser.parse(content);
  }

  async serialize(config: AICConfig): Promise<SerializeResult> {
    return this.serializer.serialize(config);
  }
}

class CopilotParser extends Parser {
  readonly toolType = 'copilot';
  readonly supportedPatterns = ['.copilot.json', 'copilot.json', '.github/copilot-instructions.md'];

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

    if (json.instructions) {
      const instructions = Array.isArray(json.instructions) 
        ? json.instructions 
        : [json.instructions];
      
      for (const inst of instructions) {
        if (typeof inst === 'string') {
          config.rules.push({ name: 'Instructions', content: inst });
        } else if (typeof inst === 'object') {
          config.rules.push({
            name: inst.title || 'Instructions',
            content: inst.content || '',
          });
        }
      }
    }

    if (json.versions) {
      config.version = json.versions?.copilot || '1.0.0';
    }

    return { success: true, config };
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
          name: 'Instructions',
          content: trimmed,
        });
      }
    }

    if (config.rules.length === 0) {
      config.rules.push({
        name: 'Instructions',
        content: content.trim(),
      });
      warnings.push('No section headers found, treating content as single rule');
    }

    return { success: true, config, warnings: warnings.length > 0 ? warnings : undefined };
  }
}

class CopilotSerializer extends Serializer {
  readonly toolType = 'copilot';

  async serialize(config: AICConfig): Promise<SerializeResult> {
    try {
      const errors = this.validateConfig(config);
      
      if (errors.length > 0) {
        return { success: false, error: errors.join('; ') };
      }

      const output: Record<string, unknown> = {
        versions: {
          copilot: config.version,
        },
        instructions: config.rules.map(r => ({
          title: r.name,
          content: r.content,
        })),
      };

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

export default CopilotAdapter;
