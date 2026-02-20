

# Social Coach — Autism Communication Assistant MVP

A Google Meet-inspired single-page meeting UI with a built-in "Social Coach" panel that provides live captions and AI-powered social cue explanations. All data is mocked for now, designed to be easily swapped with real backend/streaming later.

## Layout & Structure

### Top Bar
- Left: "Social Coach" app name/logo
- Center: "Conversation Session" meeting title
- Right: Settings icon (placeholder), user avatar, and red "End Session" button

### Main Video Grid (Center)
- Responsive 2x2 grid of participant tiles (You, Person A, Person B, Person C)
- Each tile: colored placeholder with participant initial/avatar, name label at bottom
- Active speaker indicated by a subtle colored border highlight
- Speaker changes automatically as mock conversation progresses

### Bottom Controls Bar
- Floating centered bar with rounded pill shape (Google Meet style)
- Mic toggle, Camera toggle, "Coach" toggle (enables/disables the right panel)
- Clean icons with on/off states, no flashy animations

### Right-Side Coach Panel (Collapsible)
- Header: "Coach for autistic users (prototype)"
- **Live Captions section**: scrollable list of speaker-labeled utterances, color-coded by speaker
- **AI Explanation section**: card below captions showing plain-language interpretation of the latest utterance (e.g., "They might be unsure but don't want to argue")
- Panel slides in/out when Coach toggle is clicked

## Mock Conversation Flow
- A `setInterval` timer appends a new caption every 4–5 seconds from a pre-written script
- Each caption triggers a matching AI explanation update
- The active speaker tile highlights in sync with the latest caption
- ~10–15 scripted exchanges covering various social cues (sarcasm, hesitation, excitement, agreement)

## Design Principles
- Calm, low-clutter UI suitable for autistic users
- High-contrast but soft color palette (dark video area, light panel)
- Good text spacing and readable font sizes
- No flashy animations — subtle transitions only
- Dark theme for the main meeting area, light theme for the coach panel

## Component Architecture
- `MeetingPage` — top-level container holding all state and mock logic
- `TopBar`, `VideoGrid`, `ParticipantTile`, `BottomControls`, `CoachPanel`, `CaptionsList`, `ExplanationBox`
- Clean TypeScript interfaces (`Caption`, `Explanation`, `Participant`) driving all data
- Mock data layer isolated so it can be replaced with WebSocket/streaming later

