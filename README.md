# AI Day Assistant - Android MVP Documentation

This folder contains Codex-ready planning documents for building an Android-first AI assistant app.

## Product Summary

The app is a character-based personal assistant for Android. The user interacts mainly through chat, and later voice. The assistant reads the user's calendar, understands pending tasks, checks location and timing constraints, detects free gaps, and suggests the most realistic task to do next.

## Core Principle

AI interprets messy human input. Deterministic code validates whether suggestions are realistic.

AI should not directly decide the schedule without validation.

## Recommended MVP Stack

Preferred for the user's background:

- Ionic + Angular + Capacitor
- TypeScript
- Local storage first, later SQLite
- OpenAI API for task extraction and assistant responses
- Google Calendar API
- Android location APIs through Capacitor plugins
- Android notifications later

## Main Docs

- `product-vision.md`
- `android-mvp-scope.md`
- `assistant-character.md`
- `conversation-flow.md`
- `data-model.md`
- `ai-extraction.md`
- `scheduling-rules.md`
- `architecture.md`
- `permissions.md`
- `codex-implementation-plan.md`
