import { useEffect, useMemo, useRef, useState } from 'react'
import { stories as builtinStories } from './stories'
import type { Feedback, GlossMode, SavedWord, Story } from './lib/types'
import {
  getActivity,
  getCustomStories,
  getFeedback,
  getLastStoryId,
  getMode,
  getWords,
  recordActivity,
  setLastStoryId,
  setMode as persistMode,
} from './lib/storage'
import { computeStreak, dailyStory, nextStory } from './lib/progress'
import { CollectionIndex } from './components/CollectionIndex'
import { CollectionView } from './components/CollectionView'
import { StoryReader } from './components/StoryReader'
import { WordList } from './components/WordList'
import { Trainer } from './components/Trainer'
import { AddStory } from './components/AddStory'
import { SyncSettings } from './components/SyncSettings'
import { getSyncToken, syncNow, type SyncData } from './lib/sync'

type Route =
  | { screen: 'list' }
  | { screen: 'words' }
  | { screen: 'train' }
  | { screen: 'add' }
  | { screen: 'sync' }
  | { screen: 'collection'; id: string }
  | { screen: 'story'; id: string }

function parseHash(): Route {
  const hash = window.location.hash.slice(1)
  if (hash === 'words') return { screen: 'words' }
  if (hash === 'train') return { screen: 'train' }
  if (hash === 'add') return { screen: 'add' }
  if (hash === 'sync') return { screen: 'sync' }
  if (hash.startsWith('collection/'))
    return { screen: 'collection', id: decodeURIComponent(hash.slice(11)) }
  if (hash.startsWith('story/')) return { screen: 'story', id: decodeURIComponent(hash.slice(6)) }
  return { screen: 'list' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  const [words, setWords] = useState<SavedWord[]>(getWords)
  const [customStories, setCustomStories] = useState<Story[]>(getCustomStories)
  const [feedback, setFeedback] = useState<Record<string, Feedback>>(getFeedback)
  const [mode, setMode] = useState<GlossMode>(getMode)
  const [activity, setActivity] = useState<string[]>(getActivity)
  const [lastStoryId, setLastStoryIdState] = useState<string>(getLastStoryId)

  const allStories = useMemo(() => [...builtinStories, ...customStories], [customStories])
  const learning = words.filter((w) => !w.learned).length

  const streak = useMemo(() => computeStreak(activity), [activity])
  const daily = useMemo(() => dailyStory(allStories), [allStories])
  const continueStory = useMemo(
    () => nextStory(allStories, feedback, lastStoryId),
    [allStories, feedback, lastStoryId],
  )

  // Opening a story sets the resume point for "continue reading".
  useEffect(() => {
    if (route.screen !== 'story') return
    const opened = allStories.find((s) => s.id === route.id)
    if (!opened) return
    setLastStoryId(opened.id)
    setLastStoryIdState(opened.id)
  }, [route, allStories])

  // Rating a story marks it read: updates feedback and counts toward the streak.
  function rateStory(fb: Record<string, Feedback>) {
    setFeedback(fb)
    setActivity(recordActivity())
  }

  // Cross-device sync: merge remote state on load and (debounced) after changes.
  function applySync(data: SyncData) {
    setWords((cur) => (JSON.stringify(cur) === JSON.stringify(data.words) ? cur : data.words))
    setFeedback((cur) =>
      JSON.stringify(cur) === JSON.stringify(data.feedback) ? cur : data.feedback,
    )
    setCustomStories((cur) =>
      JSON.stringify(cur) === JSON.stringify(data.customStories) ? cur : data.customStories,
    )
    setActivity((cur) =>
      JSON.stringify(cur) === JSON.stringify(data.activity) ? cur : data.activity,
    )
  }

  useEffect(() => {
    if (!getSyncToken()) return
    let cancelled = false
    syncNow().then((r) => !cancelled && 'data' in r && applySync(r.data))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (!getSyncToken()) return
    const t = setTimeout(() => syncNow().then((r) => 'data' in r && applySync(r.data)), 2500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, feedback, customStories])

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
            <p>истории на немецком</p>
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
        <CollectionIndex
          stories={allStories}
          feedback={feedback}
          onOpenCollection={(id) => go(`collection/${id}`)}
          onOpenStory={(id) => go(`story/${id}`)}
          onSync={() => go('sync')}
          syncEnabled={Boolean(getSyncToken())}
          streak={streak}
          continueStory={continueStory}
          hasProgress={Boolean(lastStoryId) || Object.keys(feedback).length > 0}
          dailyStory={daily}
        />
      )}

      {route.screen === 'sync' && <SyncSettings onSynced={applySync} onBack={() => go('')} />}

      {route.screen === 'collection' && (
        <CollectionView
          collectionId={route.id}
          stories={allStories}
          feedback={feedback}
          onOpen={(id) => go(`story/${id}`)}
          onAdd={() => go('add')}
          onBack={() => go('')}
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
            onFeedbackChange={rateStory}
            onBack={() =>
              go(story.collection ? `collection/${story.collection}` : story.custom ? 'collection/meine' : '')
            }
          />
        ) : (
          <p className="not-found">История не найдена.</p>
        ))}
    </div>
  )
}
