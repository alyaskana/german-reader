import type AnthropicType from '@anthropic-ai/sdk'
import { buildPrompt } from './prompt'
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

/**
 * Generate a personalized story by calling Claude directly from the browser.
 * Reuses the same prompt as the copy-paste flow, so the story is calibrated
 * to the reader's feedback and vocabulary.
 */
export async function generateStory(
  apiKey: string,
  onProgress?: (chars: number) => void,
): Promise<{ story: Story } | { error: string }> {
  // the SDK is loaded lazily so it doesn't weigh down the initial bundle
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  let text: string
  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: buildPrompt() }],
    })
    let chars = 0
    stream.on('text', (delta) => {
      chars += delta.length
      onProgress?.(chars)
    })
    const message = await stream.finalMessage()
    if (message.stop_reason === 'max_tokens')
      return { error: 'Ответ оборвался на лимите токенов. Попробуй ещё раз.' }
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
