# Product Requirements Document: New Moon

## Executive Summary

New Moon is a space-themed browser-based risk/reward game built with Gleam and the Lustre framework. Players assume the role of a space explorer extracting valuable samples from mysterious containers, balancing the pursuit of research points against the danger of hazardous materials. The game combines strategic decision-making with luck-based mechanics across five increasingly challenging levels.

## Product Overview

### Vision
Create an engaging, accessible web game that delivers quick sessions of strategic risk-taking with meaningful progression and player choice.

### Core Value Proposition
- **Risk vs Reward**: Every extraction decision matters
- **Strategic Depth**: Multiple paths to victory through different sample types
- **Progressive Difficulty**: Five levels with escalating point requirements
- **Player Agency**: Marketplace system allows customization between levels
- **Replayability**: Randomized container contents and multiple strategies

## Game Specifications

### Technical Architecture
- **Framework**: Gleam programming language with Lustre web framework
- **Architecture Pattern**: Model-View-Update (MVU) with functional programming
- **UI Framework**: Tailwind CSS for responsive styling
- **Platform**: Web browser (client-side only)
- **Build System**: Gleam compiler with hot-reload development tools

### Game Flow

#### 1. Main Menu
- **New Game**: Start fresh game from Level 1
- **Continue**: Resume from current level (if applicable)
- **Testing Mode**: Developer tools for testing game mechanics

#### 2. Gameplay Loop
1. Player starts with container of 20 samples
2. Extract samples one at a time
3. Each sample has different effects (points, damage, bonuses)
4. Reach target points before health depletes
5. Win level → Marketplace → Next level
6. Complete all 5 levels to win game

#### 3. End States
- **Level Victory**: Reached milestone with health > 0
- **Game Over**: Health reached 0 or container empty
- **Game Complete**: Finished all 5 levels
- **Risked Out**: Special failure from Risk mode

### Core Mechanics

#### Health System
- **Starting Health**: 5 points
- **Maximum Health**: 5 points
- **Damage Sources**: Bomb samples
- **Healing Sources**: Health samples, marketplace items
- **Death**: Health ≤ 0 triggers game over

#### Point System
- **Objective**: Reach level milestone points
- **Base Points**: From Point samples (1-10 points each)
- **Multipliers**: Can stack multiplicatively
- **Collector Bonuses**: Based on remaining container contents

#### Level Progression
| Level | Target Points | Credits Earned |
|-------|--------------|----------------|
| 1     | 12           | Points scored  |
| 2     | 18           | Points scored  |
| 3     | 28           | Points scored  |
| 4     | 44           | Points scored  |
| 5     | 66           | Points scored  |

### Sample Types (Orbs)

#### Basic Samples
1. **Data Sample** (PointOrb)
   - Awards 1-10 research points
   - Most common sample type
   - Affected by multipliers

2. **Hazard Sample** (BombOrb)
   - Deals damage to health
   - Can be blocked by shields
   - Damage value varies

3. **Health Sample** (HealthOrb)
   - Restores health points
   - Cannot exceed max health (5)
   - Immediate effect

#### Collector Samples
4. **Universal Collector** (AllCollectorOrb)
   - Points = base × remaining samples in container
   - Calculated at extraction time
   - Best early in level

5. **Data Collector** (PointCollectorOrb)
   - Points = base × remaining Data samples
   - Synergizes with Data-heavy containers
   - Strategic timing crucial

6. **Hazard Survivor** (BombSurvivorOrb)
   - Points = base × Hazards already extracted
   - Rewards risky play
   - Best late in level

#### Special Samples
7. **Signal Amplifier** (MultiplierOrb)
   - Sets persistent point multiplier (1.5×, 2×, etc.)
   - Replaces existing multiplier
   - Lasts until level end

8. **Boost Signal** (NextPointMultiplierOrb)
   - One-time multiplier for next Data sample
   - Consumed on use
   - Can stack with regular multiplier

9. **Hazard Shield** (BombImmunityOrb)
   - Blocks next 3 Hazard damages
   - Protected Hazards return to container
   - Stacks additively

10. **Choice Scanner** (ChoiceOrb)
    - Reveals next 2 samples
    - Player chooses which to extract
    - Can chain for multiple choices

11. **High-Risk Protocol** (RiskOrb)
    - Optional mini-game
    - Extract 5 samples with 2× point bonus
    - All-or-nothing outcome

12. **Recovery Module** (PointRecoveryOrb)
    - Returns lowest Data sample to container
    - Only affects already-extracted samples
    - Strategic for second chances

### Marketplace System

Between levels, spend credits (equal to points earned) on upgrades:

#### Tier 1: Common (Gray)
| Item | Effect | Cost |
|------|--------|------|
| Data Sample | +5 points | 5 credits |
| Fate Sample | Risk opportunity | 5 credits |
| Bomb Survivor | +2 pts/bomb | 6 credits |
| Health Sample | +1 health | 9 credits |
| Enhanced Data | +7 points | 8 credits |
| Point Recovery | Recovery module | 8 credits |
| Point Collector | +2 pts/data | 9 credits |

#### Tier 2: Rare (Blue)
| Item | Effect | Cost |
|------|--------|------|
| Premium Data | +8 points | 11 credits |
| Elite Data | +9 points | 13 credits |
| Boost Signal | 2× next point | 14 credits |
| Signal Amplifier | 1.5× multiplier | 16 credits |

#### Tier 3: Cosmic (Purple)
| Item | Effect | Cost |
|------|--------|------|
| Cosmic Health | +3 health | 21 credits |
| Hazard Shield | 3 immunities | 23 credits |

### Special Game Modes

#### Risk Mode
Triggered by extracting Risk sample:
1. **Decision**: Accept or decline risk
2. **Execution**: Pull 5 samples sequentially
3. **Rules**:
   - Data samples worth 2× points
   - All effects apply normally
   - Death results in "RISKED OUT" screen
4. **Reward**: Massive point potential
5. **Risk**: Can end run immediately

#### Testing Mode
Developer features:
- Test individual sample types
- Configure custom values
- Pre-built test scenarios
- Debug information display

### User Interface

#### Game Layout
- **Header**: Game title and status
- **Stats Panel**: Health, points, level, milestone
- **Container View**: Visual representation of remaining samples
- **Action Button**: Extract sample or make choices
- **Effects Display**: Active multipliers and shields

#### Visual Design
- **Theme**: Retro-futuristic space aesthetic
- **Colors**: Dark backgrounds with neon accents
- **Typography**: Monospace fonts for sci-fi feel
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Adapts to different screen sizes

### Status Effects

#### Point Multiplier
- **Type**: Persistent (ClearOnLevel)
- **Effect**: Multiplies all point gains
- **Source**: Signal Amplifier samples
- **Stacking**: Replaces previous multiplier

#### Next Point Multiplier
- **Type**: Consumable
- **Effect**: One-time point boost
- **Source**: Boost Signal samples
- **Stacking**: Consumed on next point gain

#### Hazard Immunity
- **Type**: Countdown (ClearOnLevel)
- **Effect**: Blocks damage, returns hazards
- **Source**: Hazard Shield samples/items
- **Stacking**: Adds to existing count

### Game Balance

#### Container Composition (per level)
- 4× Data Sample (1 point)
- 4× Data Sample (2 points)
- 3× Data Sample (3 points)
- 2× Data Sample (4 points)
- 2× Data Sample (5 points)
- 2× Data Sample (6 points)
- 1× Data Sample (7 points)
- 1× Data Sample (8 points)
- 1× Data Sample (10 points)
- Plus: Purchased items from marketplace

#### Difficulty Scaling
- Level milestones increase non-linearly
- Same starting container maintains consistency
- Marketplace allows player-driven difficulty adjustment
- Risk/reward balance shifts toward risk in later levels

### Success Metrics

#### Player Engagement
- Average session length
- Level completion rates
- Marketplace usage patterns
- Risk mode acceptance rate

#### Game Balance
- Win rate by level
- Most/least purchased items
- Average health at level completion
- Sample extraction patterns

### Future Enhancements

#### Potential Features
1. **Achievements System**: Unlock badges for specific accomplishments
2. **Daily Challenges**: Special configurations with leaderboards
3. **New Sample Types**: Expand strategic options
4. **Endless Mode**: Survival mode with escalating difficulty
5. **Multiplayer**: Competitive or cooperative modes
6. **Save States**: Cloud save functionality
7. **Statistics Tracking**: Detailed player performance metrics
8. **Customization**: Visual themes and sound options

#### Technical Improvements
1. **Mobile Optimization**: Touch-friendly controls
2. **Performance**: Optimize for lower-end devices
3. **Accessibility**: Colorblind modes, screen reader support
4. **Localization**: Multi-language support

## Development Guidelines

### Code Architecture
- **Separation of Concerns**: Logic, view, and display layers
- **Functional Programming**: Pure functions, immutable state
- **Type Safety**: Leverage Gleam's type system
- **Modular Design**: Easy to extend with new features

### Terminology Management
- **Internal**: Technical terms (Orb, bag, pull)
- **Display**: Thematic terms (Sample, container, extract)
- **Consistency**: Centralized in display module

### Quality Standards
- **Testing**: Comprehensive test mode for all mechanics
- **Code Style**: Follow Gleam formatting guidelines
- **Documentation**: Clear comments for complex logic
- **Performance**: Smooth gameplay on modern browsers

## Conclusion

New Moon delivers an engaging risk/reward experience through carefully balanced mechanics and meaningful player choices. The game's modular architecture and clear separation of concerns make it maintainable and extensible, while the space theme and polished UI create an immersive experience. With its combination of strategy, luck, and progression systems, New Moon offers both casual enjoyment and deeper strategic gameplay for those who seek it.