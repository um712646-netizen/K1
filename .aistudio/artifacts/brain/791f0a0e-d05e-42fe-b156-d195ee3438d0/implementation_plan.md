# Expressive AI Voice Studio & Audio Tags Integration

A major upgrade to VoxGemini Studio introducing **rich vocal expressions and audio tags** (`<laugh>`, `<gasp>`, `<breath>`, `<sigh>`, `[whisper]`, `[cheerful]`, `[excited]`, `[dramatic]`, etc.), a **categorized voice persona catalog** (Storyteller, Commercial, Calm, Anime), and full support for Google's flagship **`gemini-3.8-flash-tts`** model (free tier with no credit card required) alongside the high-speed `gemini-3.8-flash-lite-tts` and unlimited browser engine.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions have been confirmed through user clarification:
> - **Vocal Expressions & Audio Tags**: An interactive 1-click expression toolbar directly above the script editor to inject vocal bursts (`<laugh>`, `<gasp>`, `<breath>`, `<sigh>`, `<cough>`), backchanneling (`|mhm|`, `|yeah|`), and emotion tags (`[whisper]`, `[excited]`, `[dramatic]`, `[sad]`, `[angry]`).
> - **Voice Library Categorization**: Voices and personas organized into distinct style categories: **Storyteller & Epic**, **Commercial & Tech**, **Calm & Wellness**, and **Anime & Character** with custom persona prompt tuning.
> - **Free API Key & Engine**: Out-of-the-box generation using the app's free server key, paired with a 1-click personal key generator tutorial and dynamic model switching between `gemini-3.8-flash-tts` (flagship expressive audio) and `gemini-3.8-flash-lite-tts` (fast free tier).

---

## 1. Overview & Core Concept

- **What It Does**: Users can write dialogue or voiceovers and insert natural human vocal expressions (laughter, gasps, breaths, sighs, whispers, backchannels) with a single click. The backend routes the request to Google AI Studio's `gemini-3.8-flash-tts` model configured for high-fidelity speech synthesis and vocal bursts, generating human-grade expressive audio with no subscription fees.
- **Target Audience**: Content creators, game developers, anime dubbers, podcast producers, and app builders who need emotive, realistic character voices.
- **Key Value**: Bridges the gap between mechanical robotic TTS and nuanced human voice acting through standardized audio tags and accessible free-tier Google AI Studio models.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Expressive Audio Tags Toolbar**:
   - Above the script editor, users get categorized tag buttons:
     - **Vocal Bursts**: `<laugh>`, `<gasp>`, `<breath>`, `<sigh>`, `<cough>`, `<throat-clearing>`
     - **Conversational Backchannels**: `|mhm|`, `|yeah|`, `|aha|`, `|oh|`
     - **Emotion Modifiers**: `[whispering]`, `[excited]`, `[dramatic]`, `[cheerful]`, `[serious]`, `[sad]`
     - **Pacing & Timing**: `[pause: 500ms]`, `[pause: 1s]`, `[slowly]`, `[fast]`
   - Clicking any tag automatically inserts it at the current cursor position in the text.
   - Text editor highlights tags visually with subtle color-coding so users see expressions distinctly from plain text.

2. **Categorized Voice Explorer (Storyteller, Commercial, Calm, Anime)**:
   - Category filter tabs:
     - **Storyteller & Epic**: Charon (Deep, resonant), Fenrir (Grounded, intense, mythological)
     - **Commercial & Tech**: Puck (Dynamic, enthusiastic), Kore (Crisp, articulate)
     - **Calm & Meditation**: Zephyr (Gentle, melodic, whispering), Kore (Soft companion)
     - **Anime & Animated**: Puck (High-energy shonen hero), Fenrir (Dark fantasy villain), Zephyr (Ethereal magical guide)
   - Each card displays recommended expression tags and audio samples.

3. **Expressive Model Dispatcher (`gemini-3.8-flash-tts` vs `gemini-3.8-flash-lite-tts`)**:
   - Automatic model upgrading: When text contains vocal bursts (`<laugh>`, `<gasp>`, `|yeah|`), the system routes to `gemini-3.8-flash-tts` for authentic acting; for standard reading, it uses `gemini-3.8-flash-lite-tts` for ultra-fast latency.
   - Manual override toggle available in advanced settings.

4. **Multi-Language Code Hub Updates**:
   - All code snippets (Python, Node.js, cURL, React) update to demonstrate proper formatting for `<laugh>`, `<gasp>`, and `speechMetadata` style prompts.

### Visual Identity & Theme
- **Color Discipline**: 60% deep slate canvas (`#090D16`), 30% structural surfaces (`#111827`), 10% accent (Indigo `#6366F1` and Amber `#F59E0B` for expression tags).
- **Zero-Pill Compliance**: Clean unboxed tags and buttons with subtle borders rather than nested badge pills.
- **Typography**: Display in `Plus Jakarta Sans`, body controls in `DM Sans`, code in `JetBrains Mono`.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Model Routing based on Expression Content
- *Chosen Approach*: Route requests with vocal bursts (`<...>` or `|...|`) to `gemini-3.8-flash-tts`, while routing standard text to `gemini-3.8-flash-lite-tts`.
- *Why*: As documented in the official Gemini guidelines, `gemini-3.8-flash-tts` is specifically calibrated for vocal bursts, screenplay dialogue, and voice design, while `flash-lite-tts` delivers maximum speed for standard narration.
- *Alternatives Considered*: Always using lite model (would ignore or mishandle `<laugh>` / `<gasp>` tags).

### Decision 2: 1-Click Cursor-Aware Tag Insertion
- *Chosen Approach*: Track textarea selection range (`selectionStart` / `selectionEnd`) so clicking an expression tag cleanly wraps or inserts tags at the user's cursor without losing focus.
- *Why*: Greatly improves workflow speed compared to manually typing angle brackets.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VoxGemini Expressive Studio                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Expressive Tag Toolbar: <laugh> <gasp> <breath> |yeah| [whisper] │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Textarea Editor with Cursor Injection & Tag Syntax Highlighting   │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Categorized Voice Catalog: Storyteller · Commercial · Calm · Anime│  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
                             POST /api/tts/generate
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Server-Side Express / Vite                      │
│                                                                        │
│  Model Selection:                                                      │
│  - If contains `<...>` or `|...|` ──> 'gemini-3.8-flash-tts'          │
│  - Standard narration              ──> 'gemini-3.8-flash-lite-tts'     │
│                                                                        │
│  SDK Config:                                                           │
│  - responseModalities: ["AUDIO"]                                       │
│  - voiceConfig: { prebuiltVoiceConfig: { voiceName } }                │
│  - speechMetadata: { style }                                           │
│  - Returns complete 24kHz WAV audio buffer                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Sequence

1. **Server-Side TTS Enhancements**:
   - Update `src/server/geminiTts.ts` to support both `gemini-3.8-flash-tts` (expressive vocal burst engine) and `gemini-3.8-flash-lite-tts`.
   - Add expressiveness pre-processing and voice categorization metadata.
2. **Expression & Audio Tags Component**:
   - Create `src/components/ExpressionTagBar.tsx` featuring Vocal Bursts (`<laugh>`, `<gasp>`, `<breath>`, `<sigh>`, `<cough>`), Backchannels (`|mhm|`, `|yeah|`), and Emotions (`[whispering]`, `[excited]`, `[dramatic]`).
3. **Categorized Voice Catalog**:
   - Group voices by genre: Storyteller, Commercial, Calm, and Anime with custom character badges and style presets.
4. **Sample Expressive Scripts**:
   - Add dramatic script presets demonstrating `<laugh>`, `<gasp>`, and emotional shifts (e.g. Anime Duel, Standup Comedy, Horror Whisper, Podcast Banter).
5. **Integration Hub & Code Snippet Updates**:
   - Update all code examples to showcase `gemini-3.8-flash-tts` with vocal burst syntax.
6. **Verification**:
   - Test build with `lint_applet` and `compile_applet`, verify backend endpoint with curl, and test audio generation.
