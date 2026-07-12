import { useEffect, useMemo, useState } from 'react'
import { stories as builtinStories } from './stories'
import type { Feedback, GlossMode, SavedWord, Story } from './lib/types'
import {
  getCustomStories,
  getFeedback,
  getMode,
  getWords,
  setMode as persistMode,
} from './lib/storage'
import { StoryList } from './components/StoryList'
import { StoryReader } from './components/StoryReader'
import { WordList } from './components/WordList'
import { Trainer } from './components/Trainer'
import { AddStory } from './components/AddStory'

type Route =
  | { screen: 'list' }
  | { screen: 'words' }
  | { screen: 'train' }
  | { screen: 'add' }
  | { screen: 'story'; id: string }

function parseHash(): Route {
  const hash = window.location.hash.slice(1)
  if (hash === 'words') return { screen: 'words' }
  if (hash === 'train') return { screen: 'train' }
  if (hash === 'add') return { screen: 'add' }
  if (hash.startsWith('story/')) return { screen: 'story', id: decodeURIComponent(hash.slice(6)) }
  return { screen: 'list' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  const [words, setWords] = useState<SavedWord[]>(getWords)
  const [customStories, setCustomStories] = useState<Story[]>(getCustomStories)
  const [feedback, setFeedback] = useState<Record<string, Feedback>>(getFeedback)
  const [mode, setMode] = useState<GlossMode>(getMode)

  const allStories = useMemo(() => [...builtinStories, ...customStories], [customStories])
  const learning = words.filter((w) => !w.learned).length

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

  const story = route.screen === 'story' ? allStories.find((s) => s.id === route.id) : undefined

  return (
    <div className="app">
      {(route.screen === 'list' || route.screen === 'words') && (
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
              Мои слова{learning > 0 && <span className="badge">{learning}</span>}
            </button>
          </nav>
        </header>
      )}

      {route.screen === 'list' && (
        <StoryList
          stories={allStories}
          feedback={feedback}
          onOpen={(id) => go(`story/${id}`)}
          onAdd={() => go('add')}
        />
      )}

      {route.screen === 'words' && (
        <WordList
          words={words}
          allStories={allStories}
          onWordsChange={setWords}
          onTrain={() => go('train')}
        />
      )}

      {route.screen === 'train' && (
        <Trainer words={words} onWordsChange={setWords} onBack={() => go('words')} />
      )}

      {route.screen === 'add' && (
        <AddStory
          customStories={customStories}
          onCustomStoriesChange={setCustomStories}
          onOpenStory={(id) => go(`story/${id}`)}
          onBack={() => go('')}
        />
      )}

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
