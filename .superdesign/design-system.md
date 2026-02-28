# Aurora Design System

## Visual Direction
Cinematic, minimal, dark. Film title card aesthetic — not app-like. Every element should feel like it belongs on a black screen in a cinema before the movie starts.

## Typography
- **Font**: Instrument Serif (Google Fonts) — regular and italic only
- **Input text**: 22px, centered, letter-spacing 0.01em
- **Hints/labels**: 13px, uppercase, letter-spacing 0.15em
- **Errors**: 15px, italic

## Colors
| Role | Value |
|------|-------|
| Background | `#000000` |
| Primary text | `#e8e4df` |
| Dim text | `rgba(232, 228, 223, 0.3)` |
| Faint | `rgba(232, 228, 223, 0.12)` |
| Error text | `rgba(232, 228, 223, 0.6)` |

No accent colors. No gradients. No shadows. Only black and warm off-white at varying opacities.

## Spacing
- Bottom margin for controls: 72px from viewport bottom
- Input width: 520px centered
- Input padding: 16px vertical, 0 horizontal

## Borders
- Input: bottom border only, 1px solid dim white
- No rounded corners anywhere — `border-radius: 0`

## Animation
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` for general, `cubic-bezier(0, 0, 0.2, 1)` for exits
- Transitions: 0.3–0.5s for UI elements, 1.2–1.8s for video/hero
- Loading: thin horizontal line sweep animation
- Respect `prefers-reduced-motion`

## States
1. **Idle**: Black screen, input visible at bottom center
2. **Loading**: Input fades down, thin white line animates in its place
3. **Streaming**: Fullscreen video, "esc" hint fades in after 1.5s delay

## Constraints
- No buttons with backgrounds (except contextual — and even then, prefer text-only)
- No cards, no containers, no borders except the input underline
- No icons, no emojis
- Pure CSS — no Tailwind
