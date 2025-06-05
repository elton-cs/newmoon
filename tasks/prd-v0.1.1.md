# Product Requirements Document: New Orb Types for New Moon Game

## 1. Introduction/Overview

**Feature:** Introduction of diverse new orb types to the New Moon game.
**Description:** This feature expands the existing orb system by adding several
new orbs with unique effects, including variable damage bombs, different point
values, health regeneration, conditional point bonuses, and a score multiplier.
**Problem Solved:** The current gameplay, while functional, offers limited
strategic depth and variety. Adding new orb types will make the game more
complex, engaging, and strategically interesting. **Goal:** To enhance the
player experience by increasing strategic options, gameplay variety, and overall
challenge through the introduction of new orb types.

## 2. Goals

- Increase the strategic depth of the New Moon game.
- Add more variety to gameplay encounters through a wider range of orb effects.
- Elevate the overall game complexity and challenge.
- Enable new player strategies and decision-making processes based on orb
  anticipation and risk/reward assessment.
- Maintain clarity of orb effects for the player.

## 3. User Stories

- **As a player,** I want to encounter different types of Bomb Orbs with varying
  damage levels, so I have to weigh the risk of pulling any orb.
- **As a player,** I want to find Point Orbs with different point values, so I
  feel a greater sense of reward for high-value pulls.
- **As a player,** I want a chance to find Health Orbs that can replenish my
  lost health, so I have a way to recover from bomb damage.
- **As a player,** I want to discover special orbs that offer conditional points
  (like based on orbs left in the bag or bombs previously pulled), so I can try
  to set up strategic plays.
- **As a player,** I want to find a rare orb that can multiply my score for a
  period, so I am incentivized to take risks for a big payoff.
- **As a player,** I want the effects of these new orbs to be clear, so I can
  understand how they impact my game.

## 4. Functional Requirements

### FR1: General Orb Mechanics (Persistence)

1. Orbs are randomly drawn one at a time from a virtual "bag".
2. The bag's contents (specific orb types and quantities) are reset to a
   predefined configuration at the start of each new game and at the start of
   each subsequent level.
3. Player health is capped at 5.
4. If a player's health reaches 0, the game is lost.
5. Score and health are displayed to the player via React components.

### FR2: New Orb Types & Effects

1. **Bomb Orbs:**
   - **Bomb(1):**
     - Visual: 💣1 (Bomb emoji followed by the number 1).
     - Effect: Deals 1 damage to the player.
   - **Bomb(2):**
     - Visual: 💣2 (Bomb emoji followed by the number 2).
     - Effect: Deals 2 damage to the player.
   - **Bomb(3):**
     - Visual: 💣3 (Bomb emoji followed by the number 3).
     - Effect: Deals 3 damage to the player.
2. **Point Orbs:**
   - Visual: ✨5, ✨7, ✨8, ✨9 (Sparkles emoji or similar, followed by the
     point value. To be consistent with existing Point Orb if a different emoji
     is used).
   - **Point(5):** Grants 5 points.
   - **Point(7):** Grants 7 points.
   - **Point(8):** Grants 8 points.
   - **Point(9):** Grants 9 points.
3. **Collector Orb:**
   - Name: Collector Orb
   - Visual: 💰 (Money Bag emoji or similar distinct visual).
   - Effect: Grants 1 point for every orb remaining in the bag _at the moment
     this orb is pulled_. Does not count itself. This effect is for the current
     level.
4. **Survivor Orb:**
   - Name: Survivor Orb
   - Visual: 🛡️ (Shield emoji or similar distinct visual).
   - Effect: Grants 1 point for every Bomb Orb (of any type) that was previously
     pulled within the _current level_ before this orb was pulled.
5. **Health Orbs:**
   - Visual: ❤️1, ❤️3 (Heart emoji followed by the health value).
   - **Health(1):**
     - Effect: Replenishes 1 health point if player's current health is less
       than 5. If health is 5, the orb is consumed with no health change.
   - **Health(3):**
     - Effect: Replenishes 3 health points if player's current health is less
       than 5. Health will not exceed 5. If health is 5, the orb is consumed
       with no health change.
6. **2x Multiplier Orb:**
   - Name: 2x Multiplier Orb
   - Visual: ✖️2 (Multiplication sign emoji followed by "2" or similar distinct
     visual).
   - Effect: Doubles the number of points earned from _any_ point-generating orb
     (Point(X), Collector Orb, Survivor Orb) pulled _after_ this orb in the
     current level.
   - Stacking: If multiple "2x Multiplier Orbs" are pulled in the same level,
     their effects stack multiplicatively (e.g., two orbs = 4x points, three
     orbs = 8x points).
   - Duration: The multiplier effect lasts for the remainder of the current
     level.

## 5. Non-Goals (Out of Scope)

- No new UI/UX elements for explaining orb effects during gameplay in this
  iteration (e.g., tooltips, in-game guides, or tutorial pop-ups for new orbs).
  Player learns by playing.
- No changes to the fundamental level structure (5 levels) or win/loss
  conditions (other than those directly resulting from new orb effects like
  health changes).
- The exact distribution/quantity of each new orb type in the "bag" at the start
  of each level is TBD (see Open Questions).

## 6. Design Considerations

- **Visual Consistency:** New orb visuals should generally align with the
  existing art style and the conventions outlined in `tasks/v0.1.0/prd.md` and
  current game implementation (`/src`).
  - Bomb Orbs: Emoji + Number (e.g., 💣1, 💣2, 💣3).
  - Point Orbs: Emoji + Number (e.g., ✨5, ✨7, ✨8, ✨9 - use established Point
    Orb emoji).
  - Health Orbs: Emoji + Number (e.g., ❤️1, ❤️3).
  - Collector Orb: Needs a distinct emoji (e.g., 💰).
  - Survivor Orb: Needs a distinct emoji (e.g., 🛡️).
  - 2x Multiplier Orb: Needs a distinct emoji/symbol (e.g., ✖️2).
- **Clarity:** While detailed explanations are a non-goal for UI, the visual
  distinction and immediate effect of the orbs should be as intuitive as
  possible.
- Refer to `/src` for existing React components for score/health display and
  general UI.
- Refer to `tasks/v0.1.0/prd.md` and `tasks/v0.1.0/tasks.md` for context on the
  V0.1.0 implementation.

## 7. Technical Considerations

- The game's state management (likely Zustand, based on v0.1.0 PRD) will need to
  accommodate:
  - Tracking the count of bombs pulled in the current level (for Survivor Orb).
  - Tracking the current score multiplier status and its value (for 2x
    Multiplier Orb).
  - The state of the bag, including the new orb types and their effects.
- The predefined set of orbs for each level needs to be updated to include the
  new orb types. This configuration should be easily modifiable for balancing.
- Ensure accurate calculation of points, especially with the Collector Orb
  (snapshot of bag count at pull time) and stacking multipliers.
- Health orb logic must correctly cap health at 5.

## 8. Success Metrics

- **Primary Metric:** Players are able to successfully complete all 5 levels of
  the game with the new orb set.
- Increased player engagement, potentially measured by session length or number
  of levels attempted/completed.
- Anecdotal feedback suggesting players find the game more strategic, varied,
  and enjoyable.
- All new orb functionalities are implemented correctly as per the requirements.

## 9. Open Questions

1. **Orb Visuals - Specific Emojis:**
   - Confirm/define the specific emoji for existing Point Orbs if "✨" is not
     the one used.
   - Final emoji for Collector Orb (current suggestion: 💰).
   - Final emoji for Survivor Orb (current suggestion: 🛡️).
   - Final emoji for 2x Multiplier Orb (current suggestion: ✖️2).
2. **Initial Bag Configuration:**
   - What is the exact predefined set of orbs (quantity of each specific orb
     type, including existing and new ones) that the bag will contain at the
     start of the game and at the start of each level? This is critical for game
     balance and difficulty progression across the 5 levels. (e.g., Level 1: 3x
     Point(5), 2x Bomb(1), 1x Health(1)... etc.)

---

This PRD is based on the user request and subsequent clarifications. It aims to
provide a clear guide for a junior developer. Further discussion on "Open
Questions" is recommended before starting implementation, particularly regarding
bag configuration.
