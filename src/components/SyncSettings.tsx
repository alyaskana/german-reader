import { useState } from 'react'
import type { SyncData } from '../lib/sync'
import {
  disableSync,
  getGistUrl,
  getLastSync,
  getSyncToken,
  setSyncToken,
  syncNow,
} from '../lib/sync'

interface Props {
  onSynced: (data: SyncData) => void
  onBack: () => void
}

const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Lesezeit%20Sync'

function formatLastSync(ts: number | null): string {
  if (!ts) return ''
  const min = Math.round((Date.now() - ts) / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  return new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function SyncSettings({ onSynced, onBack }: Props) {
  const [token, setTokenState] = useState(getSyncToken())
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState(getLastSync())

  async function runSync() {
    setBusy(true)
    setError(null)
    const result = await syncNow()
    setBusy(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setLastSync(getLastSync())
    onSynced(result.data)
  }

  async function connect() {
    const t = input.trim()
    if (!t) return
    setSyncToken(t)
    setTokenState(t)
    setInput('')
    await runSync()
  }

  function disconnect() {
    disableSync()
    setTokenState('')
    setLastSync(null)
    setError(null)
  }

  return (
    <div className="add-story sync-screen">
      <header className="reader-header">
        <button type="button" className="back" onClick={onBack}>
          ← Истории
        </button>
      </header>

      <h1>Синхронизация</h1>

      {!token ? (
        <>
          <p className="add-intro">
            Твои слова, оценки историй и свои истории могут жить на всех устройствах сразу. Хранятся
            они в секретном гисте на твоём GitHub — бесплатно и без отдельного сервера.
          </p>
          <ol className="add-steps">
            <li>
              <a href={TOKEN_URL} target="_blank" rel="noreferrer">
                Создай токен на GitHub
              </a>{' '}
              — галочка «gist» уже стоит, просто нажми «Generate token» внизу.
            </li>
            <li>Скопируй токен и вставь его сюда.</li>
            <li>Повтори то же самое на другом устройстве — данные объединятся сами.</li>
          </ol>
          <input
            type="password"
            className="api-key-input"
            placeholder="ghp_..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && connect()}
          />
          {error && <p className="add-error">{error}</p>}
          <div className="api-key-actions">
            <button type="button" className="generate-btn" onClick={connect} disabled={busy || !input.trim()}>
              {busy ? 'Подключаю…' : 'Включить синхронизацию'}
            </button>
          </div>
          <p className="add-intro sync-note">
            Токен сохраняется только в этом браузере. API-ключ Claude не синхронизируется — он
            остаётся на каждом устройстве свой.
          </p>
        </>
      ) : (
        <>
          <p className="add-intro">
            Синхронизация включена{lastSync ? ` · последняя: ${formatLastSync(lastSync)}` : ''}.
            Слова, оценки и свои истории объединяются между устройствами при каждом открытии
            приложения и после изменений.
          </p>
          {error && <p className="add-error">{error}</p>}
          <div className="api-key-actions">
            <button type="button" className="generate-btn" onClick={runSync} disabled={busy}>
              {busy ? 'Синхронизирую…' : '⟳ Синхронизировать сейчас'}
            </button>
          </div>
          <p className="add-intro sync-note">
            {getGistUrl() && (
              <>
                Данные лежат в{' '}
                <a href={getGistUrl()} target="_blank" rel="noreferrer">
                  твоём гисте
                </a>
                .{' '}
              </>
            )}
            <button type="button" className="sync-disconnect" onClick={disconnect}>
              Отключить на этом устройстве
            </button>
          </p>
        </>
      )}
    </div>
  )
}
