import { AICConfig, ParseResult, Rule, Context } from '../types';

export class ParseError extends Error {
  constructor(message: string, public readonly line?: number, public readonly column?: number) {
    super(message);
    this.name = 'ParseError';
  }
}

export abstract class Parser {
  abstract readonly toolType: string;
  abstract readonly supportedPatterns: string[];

  protected createDefaultConfig(): AICConfig {
    return {
      version: '1.0.0',
      meta: {
        name: 'Untitled',
        description: '',
      },
      rules: [],
      context: {
        projectType: 'general',
        codingStandards: [],
        allowedCommands: [],
      },
    };
  }

  protected parseRuleContent(content: string): Partial<Rule>[] {
    const rules: Partial<Rule>[] = [];
    const sections = content.split(/(?=^#{1,3}\s)/m).filter(Boolean);

    for (const section of sections) {
      const lines = section.trim().split('\n');
      const titleMatch = lines[0].match(/^#{1,3}\s+(.+)/);
      
      if (titleMatch) {
        rules.push({
          name: titleMatch[1].trim(),
          content: lines.slice(1).join('\n').trim(),
        });
      }
    }

    return rules;
  }

  protected parseContextFromRules(rules: string[]): Context {
    const context: Context = {
      projectType: 'general',
      codingStandards: [],
      allowedCommands: [],
    };

    const standardsKeywords = ['coding standard', 'code style', 'convention', 'lint', 'format'];
    const commandKeywords = ['command', 'shell', 'execute', 'run'];

    for (const rule of rules) {
      const lowerRule = rule.toLowerCase();
      
      if (standardsKeywords.some(k => lowerRule.includes(k))) {
        context.codingStandards.push(rule);
      }
      if (commandKeywords.some(k => lowerRule.includes(k))) {
        context.allowedCommands.push(rule);
      }
    }

    return context;
  }

  abstract parse(content: string): Promise<ParseResult>;

  async parseAsync(content: string): Promise<ParseResult> {
    try {
      return await this.parse(content);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parse error',
      };
    }
  }

  canParse(filePath: string): boolean {
    return this.supportedPatterns.some(pattern => {
      if (pattern.startsWith('*')) {
        return filePath.endsWith(pattern.slice(1));
      }
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(filePath);
      }
      return filePath === pattern;
    });
  }
}
