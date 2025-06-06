# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Gleam-based web game called "New Moon" built with the Lustre framework. It's a space exploration game where players extract samples from containers while managing health and collecting points.

## Development Commands

- `gleam run` - Run the project
- `gleam test` - Run the tests
- `gleam build` - Build the project

## Architecture

### Module Structure
- **`src/newmoon.gleam`**: Main application entry point with game loop (Model-View-Update)
- **`src/types.gleam`**: All game types including Model, Orb, GameStatus, Msg, and MarketItem
- **`src/orb.gleam`**: Orb-related functions (effects, colors, messages, names)
- **`src/level.gleam`**: Level creation and milestone calculation
- **`src/view.gleam`**: Main UI rendering functions
- **`src/marketplace.gleam`**: Marketplace functionality and UI

### Game Features
- **Core Mechanics**: Extract orbs with different effects (Point, Bomb, Health, Collector, Survivor, Multiplier)
- **Credit System**: Points earned each level convert to credits when advancing
- **Marketplace**: Between levels, players can spend credits to buy additional orbs
- **Level Progression**: Increasing difficulty with higher milestones
- **Multiplier System**: Multiplier orbs boost all subsequent point gains

### Market Pricing
- Point Orbs: 12-25 credits (8-15 point values)
- Health Orbs: 15-40 credits (2-5 health restoration)  
- Strategic Orbs: 30-45 credits (Collector, Survivor, Multiplier)

## Key Dependencies

- **lustre**: Frontend framework for building web applications
- **gleam_stdlib**: Core Gleam standard library
- **lustre_dev_tools**: Development tooling for Lustre applications
- **gleeunit**: Testing framework

## Testing

Tests are located in `test/` directory using the gleeunit framework. Run individual tests with `gleam test`.

## Styling

Uses Tailwind CSS with configuration in `tailwind.config.js`. The game has a space-themed design with gray gradients and minimal styling.