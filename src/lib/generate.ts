import type AnthropicType from '@anthropic-ai/sdk'
import { buildPrompt, buildImportPrompt } from './prompt'
import { parseStoryJson } from './importStory'
import type { Story } from './types'

const KEY = 'gr.apiKey'

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function setApiKey(key: string) {
  localStorage.setItem(KEY, key.trim())
}

/** Call Claude with a prompt and parse the story JSON out of the answer. */
async function runPrompt(
  apiKey: string,
  prompt: string,
  onProgress?: (chars: number) => void,
): Promise<{ story: Story } | { error: string }> {
  // the SDK is loaded lazily so it doesn't weigh down the initial bundle
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  let text: string
  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 32000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }],
    })
    let chars = 0
    stream.on('text', (delta) => {
      chars += delta.length
      onProgress?.(chars)
    })
    const message = await stream.finalMessage()
    if (message.stop_reason === 'max_tokens')
      return { error: 'Ответ оборвался на лимите токенов. Попробуй текст покороче.' }
    if (message.stop_reason === 'refusal')
      return { error: 'Claude отказался отвечать на этот запрос. Попробуй ещё раз.' }
    text = message.content
      .filter((b): b is AnthropicType.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError)
      return { error: 'Ключ не подошёл. Проверь API-ключ и сохрани его заново.' }
    if (e instanceof Anthropic.RateLimitError)
      return { error: 'Слишком много запросов. Подожди минуту и попробуй снова.' }
    if (e instanceof Anthropic.APIConnectionError)
      return { error: 'Не получилось связаться с API. Проверь интернет и попробуй снова.' }
    if (e instanceof Anthropic.APIError)
      return { error: `Ошибка API (${e.status ?? '?'}): ${e.message}` }
    return { error: 'Что-то пошло не так. Попробуй ещё раз.' }
  }

  return parseStoryJson(text)
}

/**
 * Generate a personalized story by calling Claude directly from the browser.
 * Reuses the same prompt as the copy-paste flow, so the story is calibrated
 * to the reader's feedback and vocabulary.
 */
export function generateStory(
  apiKey: string,
  onProgress?: (chars: number) => void,
): Promise<{ story: Story } | { error: string }> {
  return runPrompt(apiKey, buildPrompt(), onProgress)
}

/**
 * Mark up an existing German text the reader found elsewhere: Claude keeps
 * the text verbatim and only adds glosses, the dict, and metadata.
 */
export function importTextAsStory(
  apiKey: string,
  sourceText: string,
  onProgress?: (chars: number) => void,
): Promise<{ story: Story } | { error: string }> {
  return runPrompt(apiKey, buildImportPrompt(sourceText), onProgress)
}
