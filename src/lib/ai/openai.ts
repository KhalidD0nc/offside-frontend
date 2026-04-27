import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export function getCoachModel() {
  return process.env.OPENAI_MODEL || 'gpt-5.2';
}
