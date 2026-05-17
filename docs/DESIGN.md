---
name: 'O2O EG: AI Beauty Hub'
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#ffb0cd'
  on-secondary: '#640039'
  secondary-container: '#aa0266'
  on-secondary-container: '#ffbad3'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#ffb0cd'
  on-secondary-fixed: '#3e0022'
  on-secondary-fixed-variant: '#8c0053'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  h1:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h2:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h3:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  grid-gutter: 20px
  container-padding: 32px
---

## Brand & Style

This design system is engineered for the next generation of beauty entrepreneurs. The brand personality is **Hyper-modern, Premium, and AI-driven**, blending the technical precision of a SaaS platform with the high-fashion aesthetic of the beauty industry. 

The visual style is a fusion of **Glassmorphism** and **Minimalist Futurism**. It utilizes deep layers of transparency and high-index background blurs to create a sense of digital depth. The interface feels like a holographic command center—sophisticated yet intuitive. By prioritizing high-contrast neon accents against a void-like background, the design system evokes a "2026 Futurism" vibe that resonates with Gen Z's preference for bold, tech-forward aesthetics.

## Colors

The palette is optimized for OLED displays and high-impact visual storytelling. 
- **Deep Space Black (#0A0A0C)** serves as the canvas, providing infinite depth.
- **Electric Purple (#8B5CF6)** and **Vibrant Pink (#EC4899)** are used primarily in gradients for calls-to-action and active AI states, symbolizing creativity and energy.
- **Cyber Cyan (#06B6D4)** acts as a functional accent for secondary data points and success indicators.
- **Background Orbs**: Subtle, non-interactive radial gradients of purple and pink (15% opacity, 150px blur) should be placed sporadically behind content layers to simulate a living, breathing digital environment.

## Typography

This design system employs a dual-font strategy to balance character and utility. 
- **Space Grotesk** is used for headings and branding elements. Its geometric, technical quirks reinforce the futuristic, AI-driven narrative.
- **Inter** is utilized for body text and functional labels to ensure maximum readability within the SaaS dashboard environment. 

High contrast is maintained by using pure white for primary information and soft gray for metadata. The "O2O EG" logo should be rendered in Space Grotesk Bold, while the "AI Beauty Hub" subtitle uses a smaller weight with a subtle outer glow filter to simulate neon signage.

## Layout & Spacing

The layout philosophy follows a **Bento Box grid** model. Information is organized into distinct, modular rectangles of varying sizes that fit together in a seamless mosaic. This allows for a high density of information—crucial for salon management—without visual clutter.

- **Grid**: A 12-column responsive grid is used for desktop, collapsing to 1 or 2 columns for mobile.
- **Bento Modules**: Modules should span 3, 6, 9, or 12 columns.
- **Navigation**: A floating bottom navigation bar (mobile-style) is used across all device sizes to keep the "hub" feel consistent. It should be centered horizontally with a maximum width of 600px on desktop.

## Elevation & Depth

Elevation in this design system is achieved through **Glassmorphism** rather than traditional drop shadows.
- **Surface Layer**: Semi-transparent background (`rgba(255, 255, 255, 0.03)`).
- **Backdrop Blur**: A heavy Gaussian blur (40px to 60px) applied to the surface to create "frosted glass."
- **Edge Definition**: Every card and container must have a 1px solid border with 10% white opacity (`rgba(255, 255, 255, 0.1)`). This "inner glow" border replaces the need for shadows and defines the shape against the dark background.
- **Active State**: When an element is focused or active, the border opacity increases to 40%, and a subtle outer glow in Electric Purple is applied.

## Shapes

The shape language is defined by "Hyper-Smooth" geometry. 
- **Core Radius**: All main bento cards and containers use a **1.5rem (24px)** corner radius to create a soft, premium feel that contrasts with the technical typography.
- **Interactive Elements**: Buttons and input fields follow this 1.5rem standard to ensure consistency across the UI.
- **Inner Elements**: Elements nested inside cards (like small chips or avatars) should use a smaller **0.75rem (12px)** radius to maintain visual harmony (the "inner radius < outer radius" rule).

## Components

### Buttons
- **Primary**: A linear gradient from Electric Purple to Vibrant Pink (45-degree angle). Text is white, bold.
- **Secondary**: Glassmorphic style with a 1px Cyber Cyan border and no fill.

### Floating Bottom Nav
- Positioned 24px from the bottom of the viewport.
- Background: Ultra-thick glass blur (80px) with 1px white (10%) border.
- Icons: Linear stroke icons in white, transitioning to Cyber Cyan when active.

### Cards (Bento Boxes)
- High-blur glass background.
- Content should be padded by `spacing.lg` (24px).
- Title headings inside cards always use Space Grotesk.

### AI Hub Indicators
- A special "AI Active" chip: A Cyber Cyan border with a pulsing 2px glow. Used when the hub is processing beauty data or providing insights.

### Input Fields
- Dark, semi-transparent fills (`rgba(0, 0, 0, 0.4)`).
- 1px white (10%) border that turns Cyber Cyan on focus.
- Placeholder text in `text_secondary`.