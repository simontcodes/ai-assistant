# Conversation Flow

## Main Chat Flow

1. User opens the app.
2. Assistant greets user and optionally summarizes the day.
3. User sends a message.
4. App classifies the message intent.
5. App performs the required action.
6. Assistant responds with a clear result.

## MVP Supported Intents

### Create Task
User examples:
- "I need to pay my credit card bill."
- "Remind me to return the Amazon package this week."
- "I want to work on my side project for an hour."

Expected app behavior:
- Extract structured task metadata.
- Save task.
- Confirm with assistant response.

### Ask What To Do
User examples:
- "What can I do right now?"
- "Do I have time for anything before my next meeting?"
- "What should I do after work?"

Expected app behavior:
- Get current time.
- Get calendar gaps.
- Check task backlog.
- Check location constraints.
- Return best suggestions.

### Mark Task Done
User examples:
- "I finished paying the bill."
- "Done with the Amazon return."

Expected app behavior:
- Find matching task.
- Mark as done.
- Confirm completion.

### Update Task
User examples:
- "Actually that errand takes around 45 minutes."
- "Make the Amazon return high priority."

Expected app behavior:
- Find task.
- Update fields.
- Confirm update.

## Intent Routing

Codex should implement a simple intent router before making the system complex.

Suggested intents:

```ts
type AssistantIntent =
  | 'CREATE_TASK'
  | 'ASK_FOR_SUGGESTION'
  | 'MARK_TASK_DONE'
  | 'UPDATE_TASK'
  | 'GENERAL_CHAT'
  | 'UNKNOWN';
```

## Important Rule

For MVP, do not let the AI directly mutate state without returning structured output that the app validates first.
