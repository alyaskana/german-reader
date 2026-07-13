import type { SavedWord } from './types'

// Export saved words for external flashcard apps. Anki and Quizlet both import
// "term<separator>definition, one per line" — a plain CSV file covers Anki and
// spreadsheets, TSV on the clipboard is what Quizlet's paste box expects.

function rows(words: SavedWord[]): { term: string; def: string }[] {
  return [...words]
    .sort((a, b) => a.addedAt - b.addedAt)
    .map((w) => ({ term: w.word, def: w.gloss }))
}

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function wordsToCsv(words: SavedWord[]): string {
  return rows(words)
    .map((r) => `${csvCell(r.term)},${csvCell(r.def)}`)
    .join('\n')
}

export function wordsToTsv(words: SavedWord[]): string {
  // strip tabs/newlines so each card stays on one line for Quizlet's paste import
  const clean = (s: string) => s.replace(/[\t\n\r]+/g, ' ')
  return rows(words)
    .map((r) => `${clean(r.term)}\t${clean(r.def)}`)
    .join('\n')
}

export function downloadCsv(words: SavedWord[], filename = 'lesezeit-woerter.csv') {
  const blob = new Blob(['﻿' + wordsToCsv(words)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
