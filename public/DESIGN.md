---
name: High-Performance Luxury
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#cecece'
  on-tertiary: '#2f3131'
  tertiary-container: '#b2b3b3'
  on-tertiary-container: '#434546'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-desktop: 80px
  margin-mobile: 20px
  max-width: 1440px
---

## Brand & Style

The visual identity of this design system is rooted in the "Precision Luxury" movement—a fusion of high-end automotive engineering and futuristic digital interfaces. It targets an affluent, tech-savvy audience that values performance, exclusivity, and mechanical excellence.

The aesthetic combines **Minimalism** with **Glassmorphism** to create a sense of depth and technical sophistication. By utilizing a dark, atmospheric environment punctuated by high-contrast accents, the UI evokes the feeling of a premium car showroom at night. Every element is designed to feel "machined"—precise, weighted, and technologically advanced. The emotional response is one of confidence, speed, and uncompromising quality.

## Colors

The palette is strictly curated to emphasize luxury and high-tech performance. 

- **Deep Black (#0A0A0A):** Serves as the primary canvas, providing an infinite depth that allows other elements to pop.
- **Rich Gold (#D4AF37):** Used sparingly as a high-visibility accent for primary actions, critical data points, and branding. It should feel like metallic inlay.
- **Secondary Gray (#1A1A1A):** Used for structural layering and surface differentiation, maintaining the dark aesthetic while providing necessary contrast for glass effects.
- **Pure White (#FFFFFF):** Reserved exclusively for high-readability text and sharp iconography.

Maintain a high-contrast ratio between the gold accents and the black background to ensure accessibility while preserving the "neon" glow effect.

## Typography

Typography in this design system balances the aggressive energy of automotive marketing with the utilitarian clarity of a dashboard.

- **Headlines:** Montserrat provides a bold, geometric, and urban feel. Use heavy weights for "Display" styles to anchor pages and mimic automotive badges.
- **Body & UI:** Inter is used for its exceptional legibility and systematic feel. It provides the "technical" balance to the more expressive headers.
- **Labels:** Use Inter in uppercase with increased letter spacing for a "technical readout" aesthetic, ideal for specifications, micro-copy, and small navigational cues.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model to ensure an architectural and stable layout that mirrors the structural integrity of a high-performance vehicle.

- **Desktop:** 12-column grid with a 1440px max-width, 24px gutters, and 80px outer margins. This generous spacing allows "hero" elements (like car renders) to breathe.
- **Tablet:** 8-column grid with 24px gutters and 40px margins.
- **Mobile:** 4-column grid with 16px gutters and 20px margins.

Spacing follows an 8px linear scale. Large vertical gaps should be used between sections to emphasize the premium nature of the content—avoiding visual clutter is paramount.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** and light-based "glow" effects rather than traditional drop shadows.

- **Surfaces:** Use semi-transparent backgrounds (`rgba(26, 26, 26, 0.6)`) with a high backdrop-blur (minimum 20px). This creates a "frosted cockpit" effect.
- **Glow Effects:** Instead of black shadows, use a low-opacity Gold glow (`#D4AF37` at 15-20% opacity) for active or hovered states. This mimics the light emitted from high-end LED instrumentation.
- **Borders:** Use thin (1px) semi-transparent strokes to define edges. On high-priority cards, use a linear gradient stroke (Gold to Transparent) to suggest metallic reflection.

## Shapes

The shape language is "Precision Soft." Elements use a **Soft (0.25rem)** base radius to avoid the clinical feel of sharp corners while remaining far more disciplined than overly rounded consumer apps.

- **Primary Radius:** 4px for buttons, inputs, and small UI components.
- **Secondary Radius:** 8px for cards and larger containers.
- **Accents:** Use 45-degree chamfered edges (clipped corners) on specific decorative elements or primary action buttons to reinforce the "machined part" aesthetic.

## Components

### Buttons
Primary buttons feature a solid Gold background with black text. On hover, they should trigger a soft gold outer glow. Secondary buttons use a "ghost" style with a gold border and transparent background, intensifying in opacity on hover.

### Cards
Cards are the primary vehicle for the Glassmorphism style. They must include a 1px border (`#FFFFFF` at 10% opacity) and a backdrop-blur. Content within cards should have generous padding (minimum 32px) to maintain a premium feel.

### Input Fields
Inputs are dark with a bottom-only border by default. Upon focus, the border transitions to gold and a faint gold glow appears behind the field. Use Inter for input text to maintain a technical, clean look.

### Chips & Badges
Small, pill-shaped indicators with high-contrast text. Use these for technical specs (e.g., "V12 Engine", "Electric"). They should have a dark gray background and gold or white text.

### Interactive Elements
All transitions should be fluid and "damped," mimicking the physical resistance of high-end mechanical switches. Utilize subtle scaling (e.g., 1.02x) on hover for cards to create a "lifting" sensation.