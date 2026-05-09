# AI Task Extraction

## Purpose

Use AI to transform natural language into structured task metadata.

The AI is responsible for interpretation, not final scheduling decisions.

## Input Example

User says:

```txt
I need to return an Amazon package this week.
```

## Required Output JSON

```json
{
  "title": "Return Amazon package",
  "description": "Return an Amazon package this week.",
  "estimatedDurationMinutes": 30,
  "estimatedDurationConfidence": "medium",
  "priority": "medium",
  "canDoRemotely": false,
  "requiresLocation": true,
  "locationType": "Amazon return drop-off location",
  "bestTimeOfDay": ["morning", "afternoon"],
  "energyRequired": "low",
  "dueDate": null
}
```

## Extraction Rules

- Always return estimatedDurationMinutes.
- Always return estimatedDurationConfidence.
- If the task requires travel, set requiresLocation to true.
- If the task can be done from anywhere, set canDoRemotely to true.
- If the task is ambiguous, choose safe defaults.
- Do not invent exact addresses.
- Return locationType if the exact address is unknown.
- Return dueDate only if the user says or implies one clearly.
- Keep title short and action-oriented.

## Prompt Template for Codex Implementation

Use this as the base prompt for the AI call:

```txt
You are a task extraction engine for a personal Android planning assistant.

Convert the user's message into strict JSON.

The app uses this JSON to decide whether the task fits into calendar gaps.

Rules:
- Return JSON only.
- Do not include markdown.
- Always estimate duration.
- If uncertain, choose a conservative estimate.
- Do not invent exact addresses.
- Use null for unknown optional values.
- Determine if the task can be done remotely.
- Determine if the task requires a location or travel.
- Determine best time of day if relevant.
- Determine energy required.

User message:
{{USER_MESSAGE}}

Return this schema:
{
  "title": string,
  "description": string | null,
  "estimatedDurationMinutes": number,
  "estimatedDurationConfidence": "low" | "medium" | "high",
  "priority": "low" | "medium" | "high",
  "canDoRemotely": boolean,
  "requiresLocation": boolean,
  "locationType": string | null,
  "bestTimeOfDay": ("morning" | "afternoon" | "evening" | "night")[],
  "energyRequired": "low" | "medium" | "high",
  "dueDate": string | null
}
```

## Validation

After receiving AI output, the app must validate:
- estimatedDurationMinutes is a positive number
- priority is valid
- booleans are valid
- bestTimeOfDay only contains allowed values
- dueDate is valid ISO date or null

Invalid AI responses should not be saved directly.
