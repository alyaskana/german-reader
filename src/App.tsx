import { useEffect, useState } from 'react'
import { stories } from './stories'
import type { Feedback, GlossMode, SavedWord } from './lib/types'
import { getFeedback, getMode, getWords, setMode as persistMode } from './lib/storage'
import { StoryList } from './components/StoryList'
import { StoryReader } from './components/StoryReader'
import { WordList } from './components/WordList'

type Route = { screen: 'list' } | { screen: 'words' } | { screen: 'story'; id: string }

function parseHash(): Route {
  const hash = window.location.hash.slice(1)
  if (hash === 'words') return { screen: 'words' }
  if (hash.startsWith('story/')) return { screen: 'story', id: hash.slice(6) }
  return { screen: 'list' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  const [words, setWords] = useState<SavedWord[]>(getWords)
  const [feedback, setFeedback] = useState<Record<string, Feedback>>(getFeedback)
  const [mode, setMode] = useState<GlossMode>(getMode)

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  function go(hash: string) {
    window.location.hash = hash
  }

  function changeMode(m: GlossMode) {
    persistMode(m)
    setMode(m)
  }

  const story = route.screen === 'story' ? stories.find((s) => s.id === route.id) : undefined

  return (
    <div className="app">
      {route.screen !== 'story' && (
        <header className="app-header">
          <div className="brand">
            <h1>Lesezeit</h1>
            <p>истории на немецком · A1</p>
          </div>
          <nav>
            <button
              type="button"
              className={route.screen === 'list' ? 'current' : ''}
              onClick={() => go('')}
            >
              Истории
            </button>
            <button
              type="button"
              className={route.screen === 'words' ? 'current' : ''}
              onClick={() => go('words')}
            >
              Мои слова{words.length > 0 && <span className="badge">{words.length}</span>}
            </button>
          </nav>
        </header>
      )}

      {route.screen === 'list' && (
        <StoryList stories={stories} feedback={feedback} onOpen={(id) => go(`story/${id}`)} />
      )}

      {route.screen === 'words' && <WordList words={words} onWordsChange={setWords} />}

      {route.screen === 'story' &&
        (story ? (
          <StoryReader
            story={story}
            mode={mode}
            onModeChange={changeMode}
            words={words}
            onWordsChange={setWords}
            feedback={feedback[story.id]}
            onFeedbackChange={setFeedback}
            onBack={() => go('')}
          />
        ) : (
          <p className="not-found">История не найдена.</p>
        ))}
    </div>
  )
}
