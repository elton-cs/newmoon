## Relevant Files

- `src/newmoon.gleam` - Main game module containing model, update, and view
  functions
- `src/newmoon.test.gleam` - Unit tests for the main game logic (to be created)

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `gleam test` to run all tests in the project
- The current game uses Lustre's Model-View-Update architecture with Tailwind
  for styling

## Tasks

- [x] 1.0 Expand Orb Type System
  - [x] 1.1 Replace current `Orb` type with comprehensive variant system
        including Bomb(Int), Point(Int), Health(Int), Collector, Survivor, and
        Multiplier
  - [x] 1.2 Update all pattern matching throughout the codebase to handle new
        orb variants
  - [x] 1.3 Add helper functions for orb categorization (is_bomb_orb,
        is_point_orb, etc.)
- [ ] 2.0 Implement New Game State Management
  - [ ] 2.1 Add `bombs_pulled_this_level: Int` field to Model to track bomb
        count for Survivor Orb
  - [ ] 2.2 Add `current_multiplier: Int` field to Model to track active point
        multiplier
  - [ ] 2.3 Update `init` function to initialize new state fields
  - [ ] 2.4 Update `handle_next_level` function to reset level-specific state
        (bombs_pulled, multiplier)
- [ ] 3.0 Update Orb Effects Logic
  - [ ] 3.1 Implement variable damage logic for Bomb(1), Bomb(2), Bomb(3) orbs
        in `handle_pull_orb`
  - [ ] 3.2 Implement variable point logic for Point(5), Point(7), Point(8),
        Point(9) orbs with multiplier application
  - [ ] 3.3 Implement Collector Orb logic to grant points equal to remaining
        orbs in bag (excluding itself)
  - [ ] 3.4 Implement Survivor Orb logic to grant points equal to bombs pulled
        previously in current level
  - [ ] 3.5 Implement Health Orb logic for Health(1) and Health(3) with proper
        health capping at 5
  - [ ] 3.6 Implement 2x Multiplier Orb logic with multiplicative stacking (2x,
        4x, 8x, etc.)
  - [ ] 3.7 Update bomb tracking increment when any bomb orb is pulled
- [ ] 4.0 Enhance Visual Representation
  - [ ] 4.1 Update `view_last_orb_result` to display appropriate space-themed
        messages for each new orb type
  - [ ] 4.2 Create orb display function that shows orb type and value (e.g.,
        "BOMB-2", "DATA-7", "HEALTH+1")
  - [ ] 4.3 Update result messages to maintain space exploration theme (e.g.,
        "SYSTEM DAMAGE -2", "DATA COLLECTED +7")
  - [ ] 4.4 Add multiplier status display in game stats when active multiplier >
        1
- [ ] 5.0 Configure Level Bag Compositions
  - [ ] 5.1 Define `create_level_bag(level: Int) -> List(Orb)` function with
        level-specific orb distributions
  - [ ] 5.2 Update `handle_next_level` and `init` functions to use
        level-specific bag creation
  - [ ] 5.3 Balance orb quantities across 5 levels with increasing difficulty
        and variety
  - [ ] 5.4 Ensure each level has appropriate mix of risk/reward orbs for
        strategic gameplay
