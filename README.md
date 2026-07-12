# 📖 Lesezeit — истории на немецком (A1)

Минималистичный ридер адаптированных историй на немецком, как в книгах для изучения языка: сложные слова выделены, над ними — мелкий перевод на русский.

## Что умеет

- **Чтение с глоссами** — переводы над сложными словами; режим «по тапу» для самопроверки.
- **Мои слова** — тапни слово → «+ В мои слова», собирай личный словарик.
- **Оценка сложности** — после истории: легко / норм / сложно.
- **Генерация новых историй под тебя** — кнопка «Скопировать промпт» собирает промпт для Claude с твоими оценками и словами (сложно было → следующая история проще; твои слова повторяются в новых текстах). Подробнее в [PROMPT.md](PROMPT.md).

Всё хранится в localStorage, бэкенда нет.

## Запуск

```bash
npm install
npm run dev
```

## Деплой на GitHub Pages

При пуше в `main` workflow `.github/workflows/deploy.yml` собирает и публикует приложение. В настройках репозитория включи **Settings → Pages → Source: GitHub Actions** (один раз).

## Перенос в отдельный репозиторий

Этот код лежит в ветке профильного репо. Чтобы вынести в свой репо `german-reader`:

```bash
# 1. Создай пустой репо german-reader на github.com (без README)
# 2. Затем:
git clone -b claude/german-a1-reader-spa-lujca5 https://github.com/alyaskana/alyaskana.git german-reader
cd german-reader
git remote set-url origin https://github.com/alyaskana/german-reader.git
git checkout -b main
git push -u origin main
```

После пуша включи Pages (Source: GitHub Actions) — приложение появится на `https://alyaskana.github.io/german-reader/`.

## Стек

Vite + React + TypeScript, чистый CSS. Истории — JSON в `src/stories/` с разметкой `{{Wort|перевод}}`.
