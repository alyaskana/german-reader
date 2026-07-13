import { useState } from 'react'
import type { Story } from '../lib/types'
import { buildPrompt, buildImportPrompt } from '../lib/prompt'
import { parseStoryJson } from '../lib/importStory'
import { generateStory, importTextAsStory, getApiKey, setApiKey } from '../lib/generate'
import { addCustomStory, removeCustomStory } from '../lib/storage'

interface Props {
  customStories: Story[]
  onCustomStoriesChange: (stories: Story[]) => void
  onOpenStory: (id: string) => void
  onBack: () => void
}

export function AddStory({ customStories, onCustomStoriesChange, onOpenStory, onBack }: Props) {
  const [copied, setCopied] = useState(false)
  const [json, setJson] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [apiKey, setApiKeyState] = useState(getApiKey())
  const [keyInput, setKeyInput] = useState('')
  const [showKeyForm, setShowKeyForm] = useState(!getApiKey())
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [genError, setGenError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)

  const [showImport, setShowImport] = useState(false)
  const [sourceText, setSourceText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importError, setImportError] = useState<string | null>(null)
  const [importCopied, setImportCopied] = useState(false)

  function saveKey() {
    const key = keyInput.trim()
    if (!key) return
    setApiKey(key)
    setApiKeyState(key)
    setKeyInput('')
    setShowKeyForm(false)
    setGenError(null)
  }

  async function generate() {
    setGenerating(true)
    setGenError(null)
    setProgress(0)
    const result = await generateStory(apiKey, setProgress)
    setGenerating(false)
    if ('error' in result) {
      setGenError(result.error)
      return
    }
    onCustomStoriesChange(addCustomStory(result.story))
    onOpenStory(result.story.id)
  }

  async function importText() {
    setImporting(true)
    setImportError(null)
    setImportProgress(0)
    const result = await importTextAsStory(apiKey, sourceText, setImportProgress)
    setImporting(false)
    if ('error' in result) {
      setImportError(result.error)
      return
    }
    onCustomStoriesChange(addCustomStory(result.story))
    setSourceText('')
    onOpenStory(result.story.id)
  }

  async function copyImportPrompt() {
    await navigator.clipboard.writeText(buildImportPrompt(sourceText))
    setImportCopied(true)
    setTimeout(() => setImportCopied(false), 2500)
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(buildPrompt())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function addStory() {
    const result = parseStoryJson(json)
    if ('error' in result) {
      setError(result.error)
      return
    }
    onCustomStoriesChange(addCustomStory(result.story))
    setJson('')
    setError(null)
    onOpenStory(result.story.id)
  }

  return (
    <div className="add-story">
      <header className="reader-header">
        <button type="button" className="back" onClick={onBack}>
          ← Истории
        </button>
      </header>

      <h1>Новая история под тебя</h1>
      <p className="add-intro">
        История подбирается под твои оценки сложности, слова, которые ты учишь, и слова, которые ты
        уже знаешь.
      </p>

      {showKeyForm ? (
        <section className="api-key-form">
          <p>
            Чтобы истории создавались в один клик, вставь свой{' '}
            <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer">
              Anthropic API-ключ
            </a>{' '}
            — он сохранится только в этом браузере.
          </p>
          <input
            type="password"
            className="api-key-input"
            placeholder="sk-ant-..."
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveKey()}
          />
          <div className="api-key-actions">
            <button type="button" className="generate-btn" onClick={saveKey} disabled={!keyInput.trim()}>
              Сохранить ключ
            </button>
            {apiKey && (
              <button type="button" className="back" onClick={() => setShowKeyForm(false)}>
                Отмена
              </button>
            )}
          </div>
        </section>
      ) : (
        <>
          <button type="button" className="generate-btn" onClick={generate} disabled={generating}>
            {generating
              ? progress > 0
                ? `Пишу историю… ${Math.min(99, Math.round(progress / 60))}%`
                : 'Придумываю сюжет…'
              : '✨ Сгенерировать историю'}
          </button>
          {genError && <p className="add-error">{genError}</p>}
          <button type="button" className="api-key-change" onClick={() => setShowKeyForm(true)}>
            Сменить API-ключ
          </button>
        </>
      )}

      <button type="button" className="manual-toggle" onClick={() => setShowImport(!showImport)}>
        {showImport ? '▾' : '▸'} Загрузить готовый текст
      </button>

      {showImport && (
        <section className="manual-flow">
          <p className="add-intro">
            Есть интересный текст на немецком? Вставь его сюда — он останется дословным, Claude
            только добавит подсказки к сложным словам и словарь под твой уровень.
          </p>
          <textarea
            className="json-input"
            placeholder="Вставь немецкий текст…"
            value={sourceText}
            onChange={(e) => {
              setSourceText(e.target.value)
              setImportError(null)
            }}
            rows={8}
          />
          {importError && <p className="add-error">{importError}</p>}
          <div className="api-key-actions">
            {apiKey && !showKeyForm && (
              <button
                type="button"
                className="generate-btn"
                onClick={importText}
                disabled={importing || !sourceText.trim()}
              >
                {importing
                  ? importProgress > 0
                    ? 'Размечаю текст…'
                    : 'Читаю текст…'
                  : 'Разметить и добавить'}
              </button>
            )}
            <button
              type="button"
              className="generate-btn"
              onClick={copyImportPrompt}
              disabled={!sourceText.trim()}
            >
              {importCopied ? '✓ Скопировано' : 'Скопировать промпт'}
            </button>
          </div>
          {!apiKey && (
            <p className="add-intro import-hint">
              Без API-ключа: скопируй промпт, вставь его в{' '}
              <a href="https://claude.ai" target="_blank" rel="noreferrer">
                Claude
              </a>
              , а полученный JSON — в раздел «Или вручную» ниже.
            </p>
          )}
        </section>
      )}

      <button type="button" className="manual-toggle" onClick={() => setShowManual(!showManual)}>
        {showManual ? '▾' : '▸'} Или вручную через claude.ai
      </button>

      {showManual && (
        <section className="manual-flow">
          <ol className="add-steps">
            <li>Скопируй промпт.</li>
            <li>
              Вставь его в{' '}
              <a href="https://claude.ai" target="_blank" rel="noreferrer">
                Claude
              </a>{' '}
              и получи в ответ JSON.
            </li>
            <li>Вставь ответ сюда — история сразу появится в списке.</li>
          </ol>

          <button type="button" className="generate-btn" onClick={copyPrompt}>
            {copied ? '✓ Скопировано' : 'Скопировать промпт'}
          </button>

          <textarea
            className="json-input"
            placeholder='{"id": "...", "title": "...", "paragraphs": [...]}'
            value={json}
            onChange={(e) => {
              setJson(e.target.value)
              setError(null)
            }}
            rows={7}
          />
          {error && <p className="add-error">{error}</p>}
          <button type="button" className="generate-btn" onClick={addStory} disabled={!json.trim()}>
            Добавить историю
          </button>
        </section>
      )}

      {customStories.length > 0 && (
        <section className="custom-list">
          <h2>Мои истории</h2>
          <ul>
            {customStories.map((s) => (
              <li key={s.id} className="word-row">
                <button type="button" className="custom-open" onClick={() => onOpenStory(s.id)}>
                  <strong>{s.title}</strong>
                  {s.titleRu && <span className="word-source">{s.titleRu}</span>}
                </button>
                <button
                  type="button"
                  className="word-remove"
                  onClick={() => onCustomStoriesChange(removeCustomStory(s.id))}
                  aria-label={`Удалить ${s.title}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
