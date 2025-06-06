# NEW MOON - Feature Documentation

**Version:** 0.1.1  
**Framework:** Lustre (Gleam)  
**Theme:** Deep Space Exploration Game  

## 🎮 Game Overview

New Moon is a strategic space exploration game where players extract orb samples from containers while managing health and collecting points. The game features risk-reward mechanics, multiplier systems, and comprehensive strategy testing tools.

## 🏗️ Core Architecture

### Game States
- **MainMenu** - Entry point with navigation options
- **Playing** - Active gameplay with orb extraction
- **Paused** - Game management hub during play
- **LevelComplete** - Celebration and progression screen
- **GameOver** - Failure handling with retry options
- **InMarketplace** - Credit spending and orb purchasing
- **InTestingGrounds** - Strategy simulation environment

### Data Structures
```gleam
// Core game model with all state
Model {
  health: Int,
  points: Int, 
  level: Int,
  milestone: Int,
  bag: List(Orb),
  status: GameStatus,
  last_orb: Option(Orb),
  bombs_pulled_this_level: Int,
  current_multiplier: Int,
  credits: Int,
  shuffle_enabled: Bool,
  testing_config: Option(TestingConfiguration),
  testing_mode: TestingMode,
  testing_stats: Option(TestingStats),
}

// Six orb types with different effects
Orb {
  Point(Int),      // Adds points
  Health(Int),     // Restores health
  Bomb(Int),       // Damages player
  Collector,       // Points for remaining orbs
  Survivor,        // Points for bombs survived
  Multiplier       // Doubles point multiplier
}
```

## 🎯 Core Gameplay Features

### 1. **Orb Extraction System**
- **Sample Container UI** - Shows remaining orb count
- **Extract Button** - Pull orbs one at a time
- **Last Orb Display** - Shows effect of previously pulled orb
- **Deterministic Order** - Orbs pulled in sequence (unless shuffled)

### 2. **Health Management**
- **Starting Health:** 5 points per level
- **Health Loss:** Bomb orbs damage player
- **Health Restoration:** Health orbs restore points
- **Game Over:** Health reaching 0 ends level

### 3. **Scoring System**
- **Point Accumulation** - Various orbs provide points
- **Milestone Targets** - Each level has score requirements
- **Multiplier Mechanics** - Multiplier orbs boost subsequent points
- **Special Orb Bonuses:**
  - **Collector:** 1 point per remaining orb in bag
  - **Survivor:** 2 points per bomb survived this level

### 4. **Level Progression**
- **5 Predefined Levels** with increasing difficulty
- **Escalating Challenges:**
  - Level 1: 50 points target, 12 orbs
  - Level 2: 80 points target, 14 orbs  
  - Level 3: 120 points target, 14 orbs
  - Level 4: 180 points target, 16 orbs
  - Level 5: 250 points target, 18 orbs
- **Dynamic Scaling** for levels beyond 5

### 5. **Credit Economy**
- **Credit Earning** - Points convert to credits upon level completion
- **Credit Persistence** - Credits carry across levels and game sessions
- **Spending System** - Use credits in marketplace for additional orbs

## 🛒 Marketplace System

### Market Items & Pricing
- **Point Orbs:** 12-25 credits
  - Basic Data Packet (8 pts): 12 credits
  - Advanced Data Packet (12 pts): 18 credits  
  - Premium Data Packet (15 pts): 25 credits
- **Health Orbs:** 15-40 credits
  - Standard Repair Kit (2 health): 15 credits
  - Enhanced Repair Kit (4 health): 28 credits
  - Emergency Repair Kit (5 health): 40 credits
- **Strategic Orbs:** 30-45 credits
  - Deep Scanner (Collector): 30 credits
  - Damage Analyzer (Survivor): 35 credits
  - Signal Amplifier (Multiplier): 45 credits

### Marketplace Features
- **Affordability Check** - Visual indicators for purchasable items
- **Instant Purchase** - Orbs added directly to current bag
- **Credit Display** - Shows available credits
- **Item Descriptions** - Clear explanations of orb effects

## 🧪 Field Testing (Strategy Simulation)

### Test Configuration
- **Custom Bag Builder** - Add/remove any orbs from test bag
- **Configurable Parameters:**
  - Target milestone (default: 50)
  - Starting health (default: 5)
  - Simulation count (default: 100)
- **Real-time Bag Display** - Shows orb count and contents
- **Remove Orbs** - Click × to remove specific orbs

### Simulation Engine
- **Automated Gameplay** - Runs hundreds of simulations without UI
- **Accurate Game Logic** - Uses same orb effects as real gameplay
- **Randomized Testing** - Each simulation shuffles orb order
- **Comprehensive Tracking:**
  - Win/loss outcomes
  - Final scores and health
  - Orbs pulled count
  - Bombs hit statistics

### Results & Analytics
- **Performance Metrics:**
  - Win rate percentage with color coding
  - Average score calculation
  - Best and worst scores
  - Total simulations run
- **Statistical Insights:**
  - Win rate assessment (Excellent >80%, Good >60%, etc.)
  - Score consistency analysis
  - Sample size validation
- **Strategy Recommendations** - AI-generated insights for improvement

### Testing Modes
- **ConfiguringTest** - Building and setting up simulation
- **RunningSimulations** - Processing simulations (with progress indicator)
- **ViewingResults** - Detailed statistics and insights display

## 🎮 User Interface & Navigation

### Screen Hierarchy
```
MainMenu
├── Start New Mission → Playing
├── Continue Mission → Playing (if progress exists)
├── Field Testing → InTestingGrounds
└── How to Play → (placeholder)

Playing
├── Pause → Paused
├── Extract Orb → (game logic)
└── (Auto transitions to LevelComplete/GameOver)

Paused
├── Resume → Playing
├── Restart Sector → Playing (fresh level)
└── Main Menu → MainMenu

LevelComplete
├── Advance to Next Sector → Playing (next level)
├── Visit Marketplace → InMarketplace
├── Field Testing → InTestingGrounds
└── Main Menu → MainMenu

GameOver
├── Retry Sector → Playing (restart level)
├── Analyze in Field Testing → InTestingGrounds
├── Start New Mission → Playing (new game)
└── Main Menu → MainMenu

InMarketplace
├── Purchase Orbs → (add to bag)
├── Advance to Next Sector → Playing
└── Main Menu → MainMenu

InTestingGrounds
├── Configure Tests → (build custom bags)
├── Run Simulations → (automated testing)
├── View Results → (statistics & insights)
└── Back to Game/Main Menu → MainMenu
```

### UI Components
- **Game Stats Display** (Playing/Paused only):
  - Systems (Health) - White circle indicator
  - Data (Points) - Black circle indicator  
  - Target (Milestone) - Target circle indicator
  - Sector (Level) - Sector circle indicator
  - Credits - Diamond indicator with purple styling
- **Responsive Design** - Works on mobile and desktop
- **Visual Feedback** - Hover effects, color coding, transitions
- **Professional Styling** - Space theme with gray gradients

## ⚙️ Technical Features

### Game Settings
- **Orb Shuffle Toggle** - Enable/disable randomized orb extraction
  - Visual indicator (yellow when enabled, gray when disabled)
  - Persists across levels and game sessions
  - Useful for testing vs. strategic gameplay

### State Management
- **Immutable Game State** - Functional programming approach
- **Type Safety** - Gleam's compile-time guarantees prevent runtime errors
- **Message-Driven Updates** - Clean separation of concerns
- **Persistent Progress** - Game state maintained across screen transitions

### Performance Features
- **Efficient Simulation** - Batch processing for large simulation counts
- **Minimal Re-renders** - Optimized view updates
- **Memory Management** - Functional data structures prevent memory leaks

## 🔄 Game Flow Examples

### Typical Gameplay Session
1. **Main Menu** - Choose "Start New Mission"
2. **Playing** - Extract orbs, manage health, accumulate points
3. **LevelComplete** - Celebrate success, earn credits
4. **Marketplace** - Spend credits on strategic orbs
5. **Playing** - Continue to next level with enhanced bag
6. **GameOver** - Analyze failure in Field Testing
7. **Field Testing** - Test improved strategies
8. **Return to Playing** - Apply learned strategies

### Field Testing Workflow  
1. **Configure** - Build custom orb bag with specific strategy
2. **Set Parameters** - Adjust target score, health, simulation count
3. **Run Simulations** - Execute 100+ automated games
4. **Analyze Results** - Review win rates, scores, insights
5. **Iterate** - Modify bag composition based on results
6. **Apply Learning** - Use optimized strategy in real gameplay

## 📊 Data & Statistics

### Game Metrics Tracked
- **Level progression** and completion rates
- **Credit accumulation** and spending patterns  
- **Orb effectiveness** across different scenarios
- **Player decision patterns** in marketplace
- **Strategy performance** in field testing

### Testing Analytics
- **Win rate distributions** across different bag compositions
- **Score variance** and consistency metrics
- **Risk assessment** based on bomb density
- **Optimal orb ratios** for different milestone targets

## 🚀 Technical Stack

### Framework & Language
- **Gleam** - Type-safe functional programming language
- **Lustre** - Elm-inspired web framework for Gleam
- **BEAM VM** - Erlang virtual machine for reliability

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Space Theme** - Gray gradients, minimal design
- **Responsive Layout** - Mobile-first design approach

### Build & Development
- **Gleam CLI** - Built-in build system and package manager
- **No Runtime Dependencies** - Compiles to standalone JavaScript
- **Type-Driven Development** - Compile-time error prevention

## 🎯 Target Audience

### Primary Users
- **Strategy Game Enthusiasts** - Enjoy risk/reward decision making
- **Data-Driven Gamers** - Appreciate analytics and optimization tools
- **Casual Players** - Simple mechanics with depth for engagement

### Use Cases
- **Quick Gaming Sessions** - 5-10 minute gameplay loops
- **Strategy Optimization** - Deep analysis of different approaches  
- **Learning Tool** - Understanding probability and risk management
- **Demonstration Project** - Showcase of Gleam/Lustre capabilities

## 🔮 Future Enhancement Opportunities

### Potential Features
- **Custom Level Editor** - Player-created challenges
- **Leaderboards** - Global score tracking
- **Achievement System** - Milestone rewards
- **Save/Load Configurations** - Named strategy presets
- **Advanced Analytics** - Detailed performance insights
- **Multiplayer Modes** - Competitive or cooperative play
- **Sound Effects** - Audio feedback for actions
- **Animations** - Visual polish for state transitions

### Technical Improvements
- **Local Storage** - Persistent game progress
- **Progressive Web App** - Installable mobile experience
- **Performance Optimization** - Faster simulation processing
- **Accessibility Features** - Screen reader support, keyboard navigation
- **Internationalization** - Multi-language support

---

*This documentation reflects the current state of New Moon and serves as a comprehensive reference for developers, contributors, and users interested in understanding the full scope of the application.*