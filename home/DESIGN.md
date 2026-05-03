---
name: O2O EG Aesthetic
colors:
  surface: '#121317'
  surface-dim: '#121317'
  surface-bright: '#38393d'
  surface-container-lowest: '#0d0e12'
  surface-container-low: '#1a1b1f'
  surface-container: '#1e1f23'
  surface-container-high: '#292a2e'
  surface-container-highest: '#343539'
  on-surface: '#e3e2e7'
  on-surface-variant: '#c8c5ca'
  inverse-surface: '#e3e2e7'
  inverse-on-surface: '#2f3034'
  outline: '#919095'
  outline-variant: '#47464a'
  surface-tint: '#c8c6c8'
  primary: '#c8c6c8'
  on-primary: '#313032'
  primary-container: '#0a0a0c'
  on-primary-container: '#7a797b'
  inverse-primary: '#5f5e60'
  secondary: '#e9b3ff'
  on-secondary: '#510074'
  secondary-container: '#7d01b1'
  on-secondary-container: '#e5a9ff'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001c'
  tertiary-container: '#200004'
  on-tertiary-container: '#e92451'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e1e4'
  primary-fixed-dim: '#c8c6c8'
  on-primary-fixed: '#1c1b1d'
  on-primary-fixed-variant: '#474649'
  secondary-fixed: '#f6d9ff'
  secondary-fixed-dim: '#e9b3ff'
  on-secondary-fixed: '#310048'
  on-secondary-fixed-variant: '#7200a3'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000e'
  on-tertiary-fixed-variant: '#91002b'
  background: '#121317'
  on-background: '#e3e2e7'
  surface-variant: '#343539'
typography:
  h1:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  button:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system targets a tech-forward, beauty-conscious audience that values the intersection of high-end cosmetic artistry and cutting-edge technology. The brand personality is prestigious, avant-garde, and ethereal, bridging the gap between digital AI precision and physical beauty services.

The visual style is a fusion of **Hyper-modernism** and **Glassmorphism**. It leverages deep spatial depth through layered translucent surfaces, vibrant neon luminescence, and ultra-fine borders. The interface should feel like a high-end digital HUD (Heads-Up Display) found in a futuristic beauty laboratory—precise, clean, yet pulsating with energy.

## Colors

The palette is anchored in **Deep Space Black (#0A0A0C)**, providing a high-contrast foundation for neon accents to thrive. 

- **Electric Purple (#BF5AF2):** The primary action color, representing the "AI" intelligence and luxury aspect.
- **Vibrant Pink (#FF375F):** The secondary accent, evoking beauty, vitality, and passion.
- **Cyber Cyan (#00E5FF):** Used for "Offline" connectivity indicators, highlights, and successful states.
- **Neon Gradients:** Use radial and linear gradients combining these three accents with 40-60% blur to create "glowing" atmospheric backdrops behind glass components.

## Typography

The typographic system contrasts the technical, geometric nature of **Space Grotesk** for structural elements with the humanist readability of **Inter** for long-form content.

Headlines should utilize tight tracking and bold weights to command attention. Data points, labels, and navigation items use Space Grotesk in uppercase to reinforce the Web3 and futuristic aesthetic. Body text remains neutral and legible, ensuring that the "Beauty Hub" information is easily consumable despite the high-concept visual environment.

## Layout & Spacing

This design system employs a **12-column fluid grid** for web and a **4-column grid** for mobile. Spacing is based on an 8px rhythmic scale. 

Layouts should favor generous "breathing room" to maintain an elegant, high-end feel. Avoid clutter; use the "lg" and "xl" spacing tokens for section transitions to allow the background neon glows to visible. Components should be grouped within glass containers with "md" internal padding.

## Elevation & Depth

Depth is not achieved through traditional drop shadows but through **Layered Glassmorphism** and **Backdrop Blurs**.

- **Surface 1 (Base):** Deep Space Black background.
- **Surface 2 (Background Accents):** Large, low-opacity radial gradients (300px-600px blur) in Purple and Cyan.
- **Surface 3 (Cards/Panels):** Semi-transparent white (3-5%) with a `backdrop-filter: blur(20px)`.
- **Surface 4 (Modals/Overlays):** Slightly higher opacity (8%) with `backdrop-filter: blur(40px)`.

Every elevated surface must feature a **1px solid border** using the `border_glass` color to define the edge against the dark background.

## Shapes

The shape language is "Rounded" to maintain an approachable "Beauty" feel while appearing modern. Standard components use a **0.5rem (8px)** radius. Larger cards and containers should scale up to **1.5rem (24px)**. 

Interactive elements like buttons and chips should occasionally use **pill-shaped** (full round) corners to contrast against the more architectural rectangular grids of the hub's layout.

## Components

- **Glassmorphic Cards:** The core component. Features a thin 1px border, 20px backdrop blur, and a subtle inner glow on the top-left edge.
- **Action Buttons:** Primary buttons use a solid Electric Purple to Vibrant Pink linear gradient. Hover states trigger an outer neon glow (box-shadow) of the same color.
- **Ghost Buttons:** Transparent background with a Cyber Cyan 1px border and Space Grotesk text.
- **Input Fields:** Darker semi-transparent fills with 1px bottom borders that "ignite" (turn Cyan) upon focus.
- **AI Glow Chips:** Small status indicators with a pulsing neon dot to represent active AI processing or "Online" status.
- **Micro-animations:** Elements should use "Spring" physics for transitions. Hovering over cards should cause a slight 3D tilt effect and an increase in border brightness.
- **Booking Sliders:** Custom range sliders for beauty service duration or intensity, featuring glowing tracks and frosted glass handles.