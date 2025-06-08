# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive Gleam-based web game called "New Moon" built with the Lustre framework. It's a space exploration game where players extract samples from containers while managing health, collecting points, and strategically using various sample types with different effects.

## Development Commands

- `gleam check` - Check for compiler errors
- `gleam format` - Format project after edits

## Architecture

### Module Structure
- **`src/newmoon.gleam`**: Main application entry point with game loop (Model-View-Update) - 326 lines
- **`src/types.gleam`**: All game types including Model, Orb, GameStatus, Msg, MarketItem, LogEntry - 132 lines
- **`src/orb.gleam`**: Orb-related functions (effects, colors, messages, names) - 119 lines
- **`src/level.gleam`**: Level creation and milestone calculation - 133 lines
- **`src/view.gleam`**: Main UI rendering functions - 1,161 lines
- **`src/marketplace.gleam`**: Marketplace functionality and UI - 135 lines
- **`src/simulation.gleam`**: Testing simulation engine - 157 lines

## Core Game Features

### Sample (Orb) System (6 Types)
- **Point Samples**: Variable point values (6, 8, 10, 12, 15 points) - basic scoring
- **Bomb Samples**: Variable damage (2-3 damage) - reduce player health
- **Health Samples**: Variable healing (1-3 health) - restore health up to maximum of 5
- **Collector Sample**: Awards points equal to remaining samples in container when extracted
- **Survivor Sample**: Awards points equal to number of bombs encountered in current level
- **Multiplier Sample**: Doubles current point multiplier (stacks: 1x → 2x → 4x → 8x)

### Level Progression System
- **5 Main Levels**: Increasing difficulty with scaling milestones and sample counts
  - Level 1: 50 points target, 12 samples (tutorial)
  - Level 2: 80 points target, 14 samples (strategy intro)
  - Level 3: 120 points target, 14 samples (balanced)
  - Level 4: 180 points target, 16 samples (high risk)
  - Level 5: 250 points target, 18 samples (maximum challenge)
- **Beyond Level 5**: Scaling formula (250 + (level-5) * 50)
- **Health System**: 5 health maximum, game over at 0 health
- **Credit Conversion**: Points convert to credits at level completion

### Game States & Navigation
- **Main Menu**: Start new mission, continue mission, field testing, how to play
- **Playing State**: Main gameplay with stats, extraction log, and controls
- **Paused State**: Resume mission, restart sector, main menu options
- **Level Complete**: Success screen with credit rewards and advancement options
- **Game Over**: Failure screen with retry and analysis options
- **Marketplace**: Purchase samples with credits between levels
- **Field Testing**: Comprehensive simulation and strategy testing environment

## Advanced Features

### Marketplace System
- **Point Samples**: Basic (8pts, 12cr), Advanced (12pts, 18cr), Premium (15pts, 25cr)
- **Health Samples**: Standard (2hp, 15cr), Enhanced (4hp, 28cr), Emergency (5hp, 40cr)
- **Strategic Samples**: Scanner/Collector (30cr), Analyzer/Survivor (35cr), Amplifier/Multiplier (45cr)
- **Smart Purchasing**: Visual feedback for affordable vs unaffordable items
- **Credit Management**: Persistent credit tracking across game sessions

### Field Testing & Simulation
- **Custom Bag Builder**: Add/remove any sample types to create test scenarios
- **Configurable Parameters**: Target milestone, starting health, simulation count (1-1000+)
- **Comprehensive Statistics**: Win rate, average/best/worst scores, detailed breakdowns
- **Performance Insights**: AI-generated strategy recommendations based on simulation results
- **Large Sample Analysis**: Statistical reliability validation for meaningful results

### Developer & Debug Features
- **Debug Mode**: Toggle-able development panel with next sample preview
- **Sample Order Display**: Shows complete sequence of remaining samples in container
- **Shuffle Toggle**: Enable/disable container randomization (affects current container if toggled during play)
- **Persistent Settings**: Maintains preferences across level transitions
- **Visual Debug Indicators**: Clear red styling to distinguish debug information

### UI & Visual Features
- **Extraction Log**: Real-time log of last 4 sample extractions with sequence numbers
- **Color-coded Interface**: Different colors for different sample types and effects
- **Sample Visualization**: Recent sample display with color transitions and styling
- **Space-themed Terminology**: Consistent space exploration language throughout
- **Responsive Design**: Clean, minimal interface optimized for gameplay
- **Animation Effects**: Sample extraction visual feedback with color transitions

### Strategic Depth
- **Multiplier Strategy**: Timing multiplier samples for maximum point gain
- **Risk Management**: Balancing bomb samples with health sample availability
- **Collector Timing**: Strategic timing of collector samples based on remaining container contents
- **Resource Planning**: Credit management and marketplace strategy between levels
- **Recovery Mechanics**: Health samples enable aggressive risk-taking strategies

## Technical Implementation

### Data Structures
- **Model**: Comprehensive game state with 17 fields including log tracking
- **LogEntry**: Sequence number, sample type, and effect message for extraction history
- **TestingConfiguration**: Complete simulation parameters and settings
- **SimulationResult**: Detailed results from individual simulation runs

### Type Safety & Architecture
- **Gleam Type System**: Complete type safety with variant types for all game elements
- **Message System**: Comprehensive action handling for all game interactions
- **State Management**: Immutable state updates following Elm/MVU architecture
- **Modular Design**: Clear separation of concerns across modules

## Key Dependencies

- **lustre**: Frontend framework for building web applications (Model-View-Update)
- **gleam_stdlib**: Core Gleam standard library
- **lustre_dev_tools**: Development tooling for Lustre applications
- **gleeunit**: Testing framework

## Styling

Uses Tailwind CSS with configuration in `tailwind.config.js`. Features a space-themed design with gray gradients, color-coded sample types, and minimal yet informative styling. All animations and transitions use Tailwind utility classes.
