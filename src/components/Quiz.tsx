import { useState } from 'react'
import type { QuizQuestion } from '../lib/types'

interface Props {
  questions: QuizQuestion[]
}

/** A small "check yourself" quiz shown after a story. Tap an option to answer;
 *  the choice locks and reveals the correct one. No score is stored — it's a
 *  gentle self-check, not a test. */
export function Quiz({ questions }: Props) {
  // chosen option index per question, or undefined until answered
  const [chosen, setChosen] = useState<(number | undefined)[]>(() => questions.map(() => undefined))

  const answered = chosen.filter((c) => c !== undefined).length
  const correct = chosen.filter((c, i) => c === questions[i].answer).length

  function pick(qi: number, oi: number) {
    if (chosen[qi] !== undefined) return
    setChosen((cur) => cur.map((c, i) => (i === qi ? oi : c)))
  }

  return (
    <section className="quiz">
      <p className="quiz-title">Проверь себя</p>
      {questions.map((q, qi) => {
        const pickedRaw = chosen[qi]
        const isAnswered = pickedRaw !== undefined
        return (
          <div key={qi} className="quiz-q">
            <p className="quiz-question">{q.q}</p>
            <div className="quiz-options">
              {q.options.map((opt, oi) => {
                let cls = 'quiz-option'
                if (isAnswered) {
                  if (oi === q.answer) cls += ' correct'
                  else if (oi === pickedRaw) cls += ' wrong'
                  else cls += ' muted'
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    className={cls}
                    onClick={() => pick(qi, oi)}
                    disabled={isAnswered}
                  >
                    {opt}
                    {isAnswered && oi === q.answer && <span className="quiz-mark"> ✓</span>}
                    {isAnswered && oi === pickedRaw && oi !== q.answer && (
                      <span className="quiz-mark"> ✗</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {answered === questions.length && (
        <p className="quiz-score">
          {correct === questions.length
            ? `Всё верно — ${correct} из ${questions.length}! 🎉`
            : `Верно ${correct} из ${questions.length}`}
        </p>
      )}
    </section>
  )
}
