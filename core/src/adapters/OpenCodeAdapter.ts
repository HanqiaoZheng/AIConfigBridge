import { AICConfig, Adapter, ParseResult, SerializeResult, ToolType } from '../types';
import { Parser } from '../parser/Parser';
import { Serializer } from '../serializer/Serializer';

export class OpenCodeAdapter implements Adapter {
  readonly name = 'OpenCode';
  readonly toolType: ToolType = 'opencode';
  readonly version = '1.0.0';
  readonly supportedFilePatterns = ['opencode.json', '.opencode.json'];

  private parser: OpenCodeParser;
  private serializer: OpenCodeSerializer;

  constructor() {
    this.parser = new OpenCodeParser();
    this.serializer = new OpenCodeSerializer();
  }

  async parse(content: string): Promise<ParseResult> {
    return this.parser.parse(content);
  }

  async serialize(config: AICConfig): Promise<SerializeResult> {
    return this.serializer.serialize(config);
  }
}

class OpenCodeParser extends Parser {
  readonly toolType = 'opencode';
  readonly supportedPatterns = ['opencode.json', '.opencode.json'];

  async parse(content: string): Promise<ParseResult> {
    try {
      const config = this.createDefaultConfig();
      const warnings: string[] = [];

      const json = JSON.parse(content);

      if (json.model) {
        const modelStr = Array.isArray(json.model) ? json.model[0] : json.model;
        const parts = modelStr.split('/');
        config.model = {
          provider: parts[0] || 'anthropic',
          model: parts[1] || modelStr,
        };
      }

      if (json.systemPrompt || json.prompt) {
        const prompt = json.systemPrompt || json.prompt;
        const promptStr = Array.isArray(prompt) ? prompt[0] : prompt;
        if (promptStr.startsWith('{file:')) {
          const fileMatch = promptStr.match(/\{file:(.+?)\}/);
          config.rules.push({
            name: 'System Prompt',
            content: `[From file: ${fileMatch?.[1]}]`,
          });
        } else {
          config.rules.push({
            name: 'System Prompt',
            content: promptStr,
          });
        }
      }

      if (json.agent) {
        const agents = json.agent;
        for (const [name, agentConfig] of Object.entries(agents)) {
          const agent = agentConfig as Record<string, unknown>;
          if (agent.prompt) {
            let promptContent = agent.prompt as string;
            if (promptContent.startsWith('{file:')) {
              const fileMatch = promptContent.match(/\{file:(.+?)\}/);
              promptContent = `[From file: ${fileMatch?.[1]}]`;
            }
            config.rules.push({
              name: `Agent: ${name}`,
              content: promptContent,
            });
          }
          if (agent.model) {
            const modelStr = (agent.model as string).split('/');
            config.model = {
              provider: modelStr[0] || 'anthropic',
              model: modelStr[1] || agent.model as string,
            };
          }
        }
      }

      if (json.mcpServers || json.mcp) {
        const servers = json.mcpServers || json.mcp;
        if (Array.isArray(servers)) {
          config.mcpServers = servers.map((s: string | Record<string, unknown>) => {
            if (typeof s === 'string') {
              const parts = s.split(/\s+/);
              return { name: parts[0], command: parts[0], args: parts.slice(1) };
            }
            return s as { name: string; command: string; args: string[] };
          });
        } else if (typeof servers === 'object') {
          config.mcpServers = Object.entries(servers).map(([name, cfg]) => {
            const c = cfg as Record<string, unknown>;
            return {
              name,
              command: (c.command as string) || name,
              args: Array.isArray(c.args) ? c.args as string[] : [],
            };
          });
        }
      }

      if (json.theme) {
        config.meta.description = `Theme: ${json.theme}`;
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

class OpenCodeSerializer extends Serializer {
  readonly toolType = 'opencode';

  async serialize(config: AICConfig): Promise<SerializeResult> {
    try {
      const errors = this.validateConfig(config);
      
      if (errors.length > 0) {
        return { success: false, error: errors.join('; ') };
      }

      const output: Record<string, unknown> = {
        $schema: 'https://opencode.ai/config.json',
      };

      if (config.model) {
        output.model = `${config.model.provider}/${config.model.model}`;
      }

      if (config.rules.length > 0) {
        const systemPromptRule = config.rules.find(r => r.name.toLowerCase().includes('system'));
        if (systemPromptRule) {
          output.systemPrompt = systemPromptRule.content;
        }
        
        const agentRules = config.rules.filter(r => r.name.toLowerCase().startsWith('agent:'));
        if (agentRules.length > 0) {
          output.agent = {};
          for (const rule of agentRules) {
            const agentName = rule.name.replace(/^agent:/i, '').trim();
            (output.agent as Record<string, unknown>)[agentName] = {
              prompt: rule.content,
            };
          }
        }
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

export default OpenCodeAdapter;
