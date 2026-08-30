// Centralized Groq API Configuration
const getGroqApiKey = (): string => {
  return (
    process.env.EXPO_PUBLIC_GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    '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'
  );
};

export const GROQ_CONFIG = {
  // Free-tier API key read from environment variables (.env)
  get apiKey(): string {
    return getGroqApiKey();
  },
  apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'groq/compound',
  fallbackModels: ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'groq/compound-mini'],
  maxTokens: 1024,
  temperature: 0.2, // Low temperature for consistent medical report extraction
};

export const IS_GROQ_CONFIGURED = (): boolean => {
  const key = GROQ_CONFIG.apiKey;
  return typeof key === 'string' && key.startsWith('gsk_');
};
