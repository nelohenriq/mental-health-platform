import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq';

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export class AIProviderManager {
  private providers: Map<AIProvider, any> = new Map();

  constructor(configs: Record<AIProvider, AIProviderConfig>) {
    this.initializeProviders(configs);
  }

  private initializeProviders(configs: Record<AIProvider, AIProviderConfig>) {
    if (configs.openai) {
      this.providers.set('openai', new OpenAI({
        apiKey: configs.openai.apiKey,
      }));
    }

    if (configs.anthropic) {
      this.providers.set('anthropic', new Anthropic({
        apiKey: configs.anthropic.apiKey,
      }));
    }

    if (configs.google) {
      this.providers.set('google', new GoogleGenerativeAI(configs.google.apiKey));
    }

    if (configs.groq) {
      // Groq uses OpenAI-compatible API
      this.providers.set('groq', new OpenAI({
        apiKey: configs.groq.apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      }));
    }
  }

  async generateResponse(
    provider: AIProvider,
    messages: AIMessage[],
    config: Partial<AIProviderConfig> = {}
  ): Promise<AIResponse> {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`AI provider ${provider} not configured`);
    }

    switch (provider) {
      case 'openai':
        return this.callOpenAI(providerInstance, messages, config);
      case 'anthropic':
        return this.callAnthropic(providerInstance, messages, config);
      case 'google':
        return this.callGoogle(providerInstance, messages, config);
      case 'groq':
        return this.callGroq(providerInstance, messages, config);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  private async callOpenAI(client: OpenAI, messages: AIMessage[], config: Partial<AIProviderConfig>): Promise<AIResponse> {
    const response = await client.chat.completions.create({
      model: config.model || 'gpt-4',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: response.choices[0]?.finish_reason || undefined,
    };
  }

  private async callAnthropic(client: Anthropic, messages: AIMessage[], config: Partial<AIProviderConfig>): Promise<AIResponse> {
    // Convert messages to Anthropic format
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    const response = await client.messages.create({
      model: config.model || 'claude-3-sonnet-20240229',
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      system: systemMessage?.content,
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
    });

    return {
      content: response.content[0]?.type === 'text' ? response.content[0].text : '',
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
      finishReason: response.stop_reason || undefined,
    };
  }

  private async callGoogle(client: GoogleGenerativeAI, messages: AIMessage[], config: Partial<AIProviderConfig>): Promise<AIResponse> {
    const model = client.getGenerativeModel({ model: config.model || 'gemini-pro' });

    // Convert messages to Google format
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });

    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;

    return {
      content: response.text(),
      usage: {
        promptTokens: 0, // Google doesn't provide token counts in the same way
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  private async callGroq(client: OpenAI, messages: AIMessage[], config: Partial<AIProviderConfig>): Promise<AIResponse> {
    // Groq uses OpenAI-compatible API
    return this.callOpenAI(client, messages, config);
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  isProviderAvailable(provider: AIProvider): boolean {
    return this.providers.has(provider);
  }
}

// Default configurations (should be loaded from environment variables)
export const defaultProviderConfigs: Record<AIProvider, AIProviderConfig> = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    maxTokens: 1000,
    temperature: 0.7,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 1000,
    temperature: 0.7,
  },
  google: {
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
    model: 'gemini-pro',
    maxTokens: 1000,
    temperature: 0.7,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: 'llama2-70b-4096',
    maxTokens: 1000,
    temperature: 0.7,
  },
};

// Singleton instance
let aiProviderManager: AIProviderManager | null = null;

export function getAIProviderManager(): AIProviderManager {
  if (!aiProviderManager) {
    aiProviderManager = new AIProviderManager(defaultProviderConfigs);
  }
  return aiProviderManager;
}