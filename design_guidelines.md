# Design Guidelines: AI Paraphrasing Tool

## Design Approach
**System**: Material Design-inspired with Notion-like clean productivity aesthetics
**Rationale**: Utility-focused tool requiring clarity, efficiency, and trust. Users need to focus on content transformation without visual distractions.

## Typography System

**Font Family**: 
- Primary: Inter (Google Fonts) for UI elements and body text
- Monospace: JetBrains Mono for character counts and technical indicators

**Hierarchy**:
- Hero Heading: text-4xl md:text-5xl font-bold
- Section Headings: text-2xl md:text-3xl font-semibold
- Subheadings: text-lg font-medium
- Body Text: text-base leading-relaxed
- Labels/Captions: text-sm font-medium
- Micro Text: text-xs

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 to p-8
- Section spacing: py-8 to py-16
- Element gaps: gap-4 to gap-6

**Container Strategy**:
- Max width: max-w-6xl mx-auto for main content
- Hero section: max-w-5xl mx-auto
- Text editor area: max-w-7xl for side-by-side comparison

## Core Layout Structure

**Header**:
- Fixed navigation with logo, feature links, and CTA button
- Height: h-16, padding px-6
- Includes subtle border separator

**Hero Section** (70vh):
- Centered content with compelling headline and subheadline
- Primary CTA button leading to tool
- Trust indicators: "Powered by Advanced AI" + usage stats
- Background: Subtle gradient mesh or abstract tech visualization

**Main Tool Interface**:
- Dual-panel layout (Desktop: 2 columns, Mobile: stacked)
- Left panel: Original text input
- Right panel: Paraphrased output
- Control bar between panels with mode selector and action buttons
- Sticky controls when scrolling

**Feature Sections**:
- Grid layout: grid-cols-1 md:grid-cols-3 gap-6
- Each feature card with icon, title, and description
- Sections: "Why Use Our Tool", "How It Works", "Features"

**Footer**:
- Multi-column layout with links, social proof, newsletter signup
- Copyright and trust badges

## Component Library

**Text Input Areas**:
- Large textarea with min-height of h-96
- Border treatment with focus states
- Character counter positioned bottom-right
- Placeholder text with helpful examples

**Mode Selector**:
- Segmented button group showing 4 modes
- Active state clearly distinguished
- Icons accompany each mode label

**Action Buttons**:
- Primary: "Paraphrase" - large, prominent (px-8 py-3)
- Secondary: "Copy to Clipboard" - medium size (px-6 py-2.5)
- Icon buttons for additional actions (clear, swap text)

**Feature Cards**:
- Rounded containers with consistent padding (p-6)
- Icon area at top (size-12 to size-16)
- Title and description stacked vertically
- Subtle hover elevation effect

**Loading States**:
- Skeleton loaders for text areas during processing
- Progress indicator showing paraphrasing stages
- Pulsing animation for active processing

**Comparison View**:
- Side-by-side panels with equal width distribution
- Highlighting system for changed words (subtle underline)
- Scroll synchronization between panels

**Stats Display**:
- Badge components showing word count, character count
- Readability score indicator
- Detection risk meter with visual gauge

## Navigation

**Primary Navigation**:
- Horizontal menu with: Home, Features, Pricing, About
- Mobile: Hamburger menu transforming to slide-in drawer
- CTA button always visible

## Images

**Hero Section Image**:
- Abstract visualization of AI/text transformation
- Suggested: Flowing particles forming text, neural network patterns, or gradient mesh with floating text elements
- Placement: Background with overlay ensuring text readability
- Treatment: Subtle opacity, blurred edges

**Feature Section Icons**:
- Use Heroicons for consistency
- Size: size-10 to size-12
- Categories: Shield (security), Sparkles (AI), Document (content), Check (quality)

**Trust Section**:
- Optional logo cloud showing "As featured in" or "Trusted by" sections
- Small, grayscale treatment

## Interaction Patterns

**Text Processing Flow**:
1. User pastes/types content
2. Selects paraphrasing mode
3. Clicks "Paraphrase" button
4. Loading state appears
5. Results populate right panel with smooth reveal animation
6. Comparison highlighting activates

**Copy Interaction**:
- Click copy button → Toast notification confirms "Copied!"
- Button icon changes temporarily to checkmark

**Mode Switching**:
- Instant visual feedback on mode selection
- No page reload, smooth transition

## Responsive Behavior

**Desktop (lg+)**:
- Full side-by-side comparison
- Persistent navigation
- Feature cards in 3-column grid

**Tablet (md)**:
- 2-column feature grid
- Maintained side-by-side for tool interface
- Reduced padding

**Mobile (base)**:
- Stacked text areas (original → paraphrased)
- Single column features
- Collapsible mode selector
- Fixed "Paraphrase" button at bottom

## Accessibility

- Clear focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Keyboard navigation through all tool functions
- High contrast ratios for readability
- Screen reader announcements for processing states

## Content Density

**Tool Interface**: High density - maximize workspace for text
**Marketing Sections**: Medium density - balance information and breathing room
**Hero**: Low density - focus attention on core message