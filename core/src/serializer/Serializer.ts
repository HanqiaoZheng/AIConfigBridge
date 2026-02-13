import { AICConfig, SerializeResult } from '../types';

export class SerializeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerializeError';
  }
}

export abstract class Serializer {
  abstract readonly toolType: string;

  abstract serialize(config: AICConfig): Promise<SerializeResult>;

  async serializeAsync(config: AICConfig): Promise<SerializeResult> {
    try {
      return await this.serialize(config);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown serialize error',
      };
    }
  }

  protected validateConfig(config: AICConfig): string[] {
    const errors: string[] = [];

    if (!config.version) {
      errors.push('Missing required field: version');
    }
    if (!config.meta) {
      errors.push('Missing required field: meta');
    } else {
      if (!config.meta.name) {
        errors.push('Missing required field: meta.name');
      }
    }
    if (!config.context) {
      errors.push('Missing required field: context');
    }

    return errors;
  }

  protected formatRulesAsMarkdown(rules: AICConfig['rules']): string {
    if (!rules || rules.length === 0) {
      return '';
    }

    const parts: string[] = [];

    for (const rule of rules) {
      const header = rule.name ? `## ${rule.name}` : '## Rule';
      parts.push(header);
      
      if (rule.description) {
        parts.push(rule.description);
      }
      
      if (rule.files && rule.files.length > 0) {
        parts.push(`\n**Files:** ${rule.files.join(', ')}`);
      }
      
      if (rule.content) {
        parts.push(`\n${rule.content}`);
      }
      
      parts.push('');
    }

    return parts.join('\n');
  }

  protected formatContextAsMarkdown(context: AICConfig['context']): string {
    const parts: string[] = ['## Context'];

    if (context.projectType) {
      parts.push(`- **Project Type:** ${context.projectType}`);
    }

    if (context.codingStandards.length > 0) {
      parts.push('\n### Coding Standards');
      for (const standard of context.codingStandards) {
        parts.push(`- ${standard}`);
      }
    }

    if (context.allowedCommands.length > 0) {
      parts.push('\n### Allowed Commands');
      for (const cmd of context.allowedCommands) {
        parts.push(`- ${cmd}`);
      }
    }

    if (context.customInstructions && context.customInstructions.length > 0) {
      parts.push('\n### Custom Instructions');
      for (const instruction of context.customInstructions) {
        parts.push(`- ${instruction}`);
      }
    }

    return parts.join('\n');
  }
}
