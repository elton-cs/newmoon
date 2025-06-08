# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a space-themed web game called "New Moon" built with Gleam and the Lustre framework. It's a simple risk/reward game where players extract samples from containers while managing health and collecting points.

## Development Commands

- `gleam check` - Check for compiler errors
- `gleam format` - Format code after completing features

## Architecture

### Module Structure
The codebase follows a clean modular architecture with clear separation of concerns:

- **`src/newmoon.gleam`**: Main entry point - connects all modules via Lustre's MVU pattern
- **`src/types.gleam`**: All type definitions (Model, Msg, Orb, Status)
- **`src/update.gleam`**: Game logic and state management functions
- **`src/view.gleam`**: High-level view composition and model field extraction  
- **`src/ui.gleam`**: Reusable UI components for consistent styling
- **`src/display.gleam`**: Terminology translation layer for consistent UX

### Terminology Architecture
The codebase maintains strict terminology consistency:

**Internal Code (types, update)**: Uses technical terms
- `Orb` types (PointOrb, BombOrb)
- `bag: List(Orb)` for containers
- `PullOrb` for extraction actions
- `handle_pull_orb()` for game logic

**Frontend Display (ui, view)**: Uses space-themed terminology via `display.gleam`
- "Sample" instead of "Orb"
- "Container" instead of "bag" 
- "Extract" instead of "pull"
- All UI text centralized in display module

### View Layer Architecture
The view layer follows an anti-prop-drilling pattern:

1. **`view.gleam`**: Pattern matches on `model.status` and extracts only needed fields
2. **Functions take explicit parameters** instead of full model
3. **Maximum 2-3 function call depth** maintained
4. **`ui.gleam`**: Provides reusable components that compose together

### Game Flow
Simple MVU (Model-View-Update) architecture:
- **Model**: Game state (health, points, level, bag, status)
- **Update**: Handles messages (PullOrb, NextLevel, RestartGame)  
- **View**: Renders different screens based on game status (Playing, Won, Lost)

## Key Design Patterns

### Module Imports
Always import specific constructors and types to maintain clarity:
```gleam
import types.{type Model, type Msg, PullOrb, NextLevel}
```

### View Composition
Views compose UI components rather than building HTML directly:
```gleam
ui.app_container(
  ui.game_card([
    ui.game_header(),
    render_game_stats(health, points, milestone, level),
    render_playing_view(last_orb, bag),
  ])
)
```

### Terminology Translation
Use display module for all user-facing text:
```gleam
// Good
ui.extract_button(display.extract_button_text)

// Avoid
ui.extract_button("EXTRACT SAMPLE")
```
