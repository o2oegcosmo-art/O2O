---
name: AI Beauty Hub Design System
colors:
  surface: '#141218'
  surface-dim: '#141218'
  surface-bright: '#3b383e'
  surface-container-lowest: '#0f0d13'
  surface-container-low: '#1d1b20'
  surface-container: '#211f24'
  surface-container-high: '#2b292f'
  surface-container-highest: '#36343a'
  on-surface: '#e6e0e9'
  on-surface-variant: '#cbc4d2'
  inverse-surface: '#e6e0e9'
  inverse-on-surface: '#322f35'
  outline: '#948e9c'
  outline-variant: '#494551'
  surface-tint: '#cfbcff'
  primary: '#cfbcff'
  on-primary: '#381e72'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#6750a4'
  secondary: '#cdc0e9'
  on-secondary: '#342b4b'
  secondary-container: '#4d4465'
  on-secondary-container: '#bfb2da'
  tertiary: '#e7c365'
  on-tertiary: '#3e2e00'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#141218'
  on-background: '#e6e0e9'
  surface-variant: '#36343a'
typography:
  h1:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h2:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  h3:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '2.0'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '2.0'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin: 40px
  section-gap: 120px
---

## Brand & Style

This design system establishes a premium, "Deep Space" aesthetic tailored for the high-end B2B beauty sector. It merges the clinical precision of AI technology with the ethereal, atmospheric luxury of high-fashion beauty. The visual direction centers on **Extreme Glassmorphism**, creating a sense of depth, transparency, and sophisticated materiality.

The brand personality is authoritative yet visionary. By utilizing a dark, infinite background punctuated by vibrant neon light-leaks, the UI evokes a "Cyberpunk-lite" atmosphere—clean, futuristic, and highly functional. The emotional response is one of exclusive access to cutting-edge technology, mirroring the experience of a high-end digital concierge for salon owners and beauty professionals.

## Colors

The palette is rooted in the "Deep Space Black" (#0A0A0C) background, which provides the necessary contrast for glass layers and neon accents. 

- **Primary Accents:** Fuchsia is used for primary actions and "Beauty" related highlights, while Cyan represents "AI" and "Data" intelligence.
- **Neon Glows:** Use these sparingly as box-shadows or outer glows to simulate light emission from interactive elements.
- **Surface Strategy:** Layers are built using varying opacities of white (5-10%) rather than solid grays, ensuring the background depth is always felt through the UI components.

## Typography

The typography strategy relies on the contrast between technical geometry and utilitarian clarity.

- **Headings:** Set in **Space Grotesk**. These should always be bold with tight tracking to create a "locked-in," premium architectural feel. 
- **Body:** Set in **Inter** with an expansive `2.0` line-height. This creates an editorial, airy feel that balances the density of the glassmorphic effects.
- **RTL Alignment:** Ensure the tight tracking of Space Grotesk translates well to Arabic display faces (such as IBM Plex Sans Arabic or similar) for consistent weight and density.

## Layout & Spacing

The layout utilizes a 12-column fluid grid system, but adheres to a high-end, spacious philosophy reminiscent of modern tech leaders. 

- **RTL Integrity:** The layout is mirrored for Arabic. All directional icons (arrows, chevrons) must be flipped, and the "F-Pattern" of scanning is reversed.
- **Rhythm:** A strict 8px base unit drives all padding and margins. 
- **Sectioning:** Large vertical gaps (120px+) are used to separate major content blocks, allowing the background depth and glass effects to "breathe" without feeling cluttered.

## Elevation & Depth

Depth is conveyed through **translucency** and **blur**, not traditional drop shadows.

- **Backdrop Blur:** A standard `backdrop-blur-2xl` (40px+) is applied to all container elements.
- **Layering:** Hierarchy is achieved by stacking glass surfaces. Each subsequent layer increases in border opacity rather than fill opacity.
- **Edge Highlighting:** Instead of shadows, use a 1px top-left border (or top-right in RTL) with a slightly higher opacity (20%) to simulate a light source hitting the "glass" edge.
- **Interactive Depth:** On hover, elements should increase their glow intensity (box-shadow neon) rather than physically rising on the Z-axis.

## Shapes

The shape language is sophisticated and "Rounded" (0.5rem base). This softens the Cyberpunk-lite aesthetic, moving it away from "aggressive gaming" and toward "luxury technology."

- **Standard Radius:** 8px for smaller components (buttons, inputs).
- **Large Radius:** 16px to 24px for main containers and glass cards.
- **Geometric Accents:** Small 45-degree corner "nicks" may be used on decorative elements to reinforce the technical AI-first narrative.

## Components

### Buttons
Primary buttons use a solid gradient of Fuchsia to Cyan or a solid Fuchsia fill with a subtle white inner-glow. Secondary buttons are "Glass Ghost" style: transparent fill, `backdrop-blur-xl`, and a white/20 border.

### Glass Cards
The core container for the SaaS dashboard. Features `bg-white/5`, `backdrop-blur-2xl`, and a `border-white/10`. In RTL, ensure any "inner glow" highlights appear on the right side.

### Input Fields
Inputs are dark and recessed. Use `bg-black/40` with a 1px border. On focus, the border transitions to a Cyan glow, and the text remains Pure White for maximum legibility.

### Chips & Badges
Small, pill-shaped elements used for beauty categories or AI status. These should use high-saturation backgrounds (Fuchsia/Cyan) at 10% opacity with a solid 100% opacity text color for contrast.

### AI Insight Panel
A specialized component featuring a Cyan "pulse" animation on the border to indicate active AI processing. This panel should always use the Cyan accent to differentiate machine-generated content from user content.