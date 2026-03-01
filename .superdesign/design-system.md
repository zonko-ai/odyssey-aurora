# Genesis World Engine v2 — Design System

## Visual Direction
Retro-futuristic mission control. CRT monitor aesthetic with beige hardware, dark UI sidebar, amber/orange accents. Feels like operating a sophisticated piece of equipment from an alternate-history space program.

## Typography
- **Display**: Instrument Serif (Google Fonts) — regular and italic
- **UI/Labels**: Inter (Google Fonts) — 400, 500 weight
- **Headings**: Instrument Serif, text-lg, tracking-wide
- **Labels/Status**: Inter, 10px, uppercase, tracking-[0.2em]
- **Body text**: Inter, text-sm (14px)
- **Chat messages**: Instrument Serif, text-sm, italic for engine/narrator

## Colors
| Role | Value |
|------|-------|
| App background | `#09090b` (zinc-950) |
| Sidebar background | `#1c1c20` |
| Input background | `#232328` |
| Primary text | `#d4d4d8` (zinc-300) |
| Dim text | `#71717a` (zinc-500) |
| Faint text | `#52525b` (zinc-600) |
| Accent — engine | `rgba(251, 146, 60, 0.8)` (orange-400/80) |
| Accent — narrator | `rgba(217, 175, 96, 0.8)` (warm gold) |
| Accent — success | `rgba(34, 197, 94, 0.8)` (green-400/80) |
| Accent — error | `rgba(248, 113, 113, 0.8)` (red-400/80) |
| Accent — amber | `rgba(245, 158, 11, 0.8)` (amber-500) |
| Monitor beige | `#d6d5c9` |
| Monitor dark | `#b8b7ab` |
| Border default | `rgba(255, 255, 255, 0.1)` |
| Border focus | `rgba(255, 255, 255, 0.3)` |

## Spacing
- Sidebar width: 280px (lg: 340px)
- Sidebar padding: p-4 (md: p-5)
- Chat message gap: gap-6
- Input area padding: p-4, inner p-1.5

## Borders
- Sidebar: right border, border-white/10
- Input area: rounded-lg, border-white/15
- Chat engine messages: left border 1px
- Narrator messages: left border 2px, warm gold

## Icons
- Lucide icon set via Iconify (`iconify-icon` web component)
- Icon size: text-sm (14px) for buttons, text-[10px] for labels

## Animation
- Easing: default Tailwind transitions
- CRT scanlines: repeating linear-gradient overlay
- CRT flicker: 4s infinite keyframe (0.95-1.0 opacity)
- Voice pulse: 1.5s ease-in-out infinite (red glow box-shadow)
- Messages: opacity + translate-y fade-in
- Respect `prefers-reduced-motion`

## Component Patterns
- **Status indicators**: colored dot (1.5-2.5px) + uppercase label
- **Buttons**: text + icon, bg-white/5 for secondary, bg-white for primary (Send)
- **Chat messages**: role label (icon + uppercase) → body text, optionally with left border
- **Loading states**: lucide:loader-2 with animate-spin
- **Error toast**: fixed bottom-center, red-900/90 background

## Tech Stack
- Tailwind CSS (CDN, runtime)
- Vanilla TypeScript + Vite
- No component framework
