import types.{
  type Orb, AllCollectorOrb, BombImmunityOrb, BombOrb, BombSurvivorOrb,
  ChoiceOrb, HealthOrb, MultiplierOrb, NextPointMultiplierOrb, PointCollectorOrb,
  PointOrb, PointRecoveryOrb, RiskOrb,
}

// Import int and float for string conversion
import gleam/float
import gleam/int

// Display text mappings for space-themed frontend terminology
// Internal code uses: Orb, Bag, Pull, etc.
// Frontend displays: Sample, Container, Extract, etc.

// Orb to Sample Display Names
pub fn orb_display_name(orb: Orb) -> String {
  case orb {
    PointOrb(_) -> "Data Sample"
    BombOrb(_) -> "Hazard Sample"
    HealthOrb(_) -> "Health Sample"
    AllCollectorOrb(_) -> "All Collector Sample"
    PointCollectorOrb(_) -> "Point Collector Sample"
    BombSurvivorOrb(_) -> "Bomb Survivor Sample"
    MultiplierOrb(_) -> "Multiplier Sample"
    NextPointMultiplierOrb(_) -> "Next Point Amplifier"
    BombImmunityOrb -> "Shield Generator Sample"
    ChoiceOrb -> "Choice Portal Sample"
    RiskOrb -> "Fate Sample"
    PointRecoveryOrb -> "Point Recovery Sample"
  }
}

// Orb Choice Display Names - for choice selection (no "Sample" suffix, shows values)
pub fn orb_choice_display(orb: Orb) -> String {
  case orb {
    PointOrb(value) -> "Data (+" <> int.to_string(value) <> ")"
    BombOrb(value) -> "Hazard (-" <> int.to_string(value) <> ")"
    HealthOrb(value) -> "Health (+" <> int.to_string(value) <> ")"
    AllCollectorOrb(value) ->
      "All Collector (+" <> int.to_string(value) <> " per Orb)"
    PointCollectorOrb(value) ->
      "Point Collector (+" <> int.to_string(value) <> " per Point)"
    BombSurvivorOrb(value) ->
      "Bomb Survivor (+" <> int.to_string(value) <> " per Bomb)"
    MultiplierOrb(multiplier) ->
      "Full Amplifier (×" <> float.to_string(multiplier) <> ")"
    NextPointMultiplierOrb(multiplier) ->
      "Single Amplifier (×" <> float.to_string(multiplier) <> ")"
    BombImmunityOrb -> "Shield Generator"
    ChoiceOrb -> "Choice Portal"
    RiskOrb -> "Fate Sample"
    PointRecoveryOrb -> "Point Recovery"
  }
}

// Orb Result Messages (space-themed)
pub fn orb_result_message(orb: Orb) -> String {
  case orb {
    PointOrb(value) -> "● DATA ACQUIRED +" <> int.to_string(value)
    BombOrb(value) -> "○ SYSTEM DAMAGE -" <> int.to_string(value)
    HealthOrb(value) -> "◇ SYSTEMS RESTORED +" <> int.to_string(value)
    AllCollectorOrb(_) -> "◈ TOTAL COLLECTION +?"
    PointCollectorOrb(_) -> "◉ DATA COLLECTION +?"
    BombSurvivorOrb(_) -> "◆ SURVIVAL BONUS +?"
    MultiplierOrb(multiplier) ->
      "◈ MULTIPLIER ACTIVATED ×" <> float.to_string(multiplier)
    NextPointMultiplierOrb(multiplier) ->
      "◈ NEXT POINT AMPLIFIER ACTIVATED ×" <> float.to_string(multiplier)
    BombImmunityOrb -> "◈ SHIELD GENERATOR ACTIVATED"
    ChoiceOrb -> "◈ CHOICE PORTAL ACTIVATED"
    RiskOrb -> "⚠ FATE SAMPLE DETECTED"
    PointRecoveryOrb -> "◇ DATA RECOVERY ACTIVATED"
  }
}

// Collector orb result messages with actual values
pub fn collector_result_message(orb: Orb, bonus_points: Int) -> String {
  case orb {
    AllCollectorOrb(_) -> "◈ TOTAL COLLECTION +" <> int.to_string(bonus_points)
    PointCollectorOrb(_) -> "◉ DATA COLLECTION +" <> int.to_string(bonus_points)
    BombSurvivorOrb(_) -> "◆ SURVIVAL BONUS +" <> int.to_string(bonus_points)
    _ -> orb_result_message(orb)
  }
}

// UI Labels and Text
pub const container_label = "SAMPLE CONTAINER"

pub const extract_button_text = "EXTRACT SAMPLE"

pub const specimens_suffix = " SPECIMENS"

// Main Menu Messages
pub const start_game_button_text = "START MISSION"

pub const main_menu_subtitle = "PREPARE FOR DEEP SPACE EXPLORATION"

pub const back_to_menu_text = "BACK TO MENU"

// Game Status Messages
pub const sector_complete_title = "SECTOR COMPLETE"

pub const mission_failed_title = "MISSION FAILED"

pub const advance_button_text = "VISIT MARKETPLACE"

pub const play_again_text = "PLAY AGAIN"

// Marketplace Messages
pub const marketplace_title = "ORBITAL MARKETPLACE"

pub const marketplace_subtitle = "FUTURE ORBITAL SAMPLE ACQUISITION INTERFACE - CURRENTLY UNDER CONSTRUCTION"

pub const continue_to_next_sector_text = "CONTINUE TO NEXT SECTOR"

pub const point_orb_cost = "5 CREDITS"

pub const health_orb_cost = "10 CREDITS"

pub const purchase_point_orb_text = "BUY DATA ORB (+2 POINTS)"

pub const purchase_health_orb_text = "BUY HEALTH ORB (+1 HEALTH)"

// Rarity display functions
pub fn rarity_display_name(rarity: types.Rarity) -> String {
  case rarity {
    types.Common -> "COMMON"
    types.Rare -> "RARE"
    types.Cosmic -> "COSMIC"
  }
}

pub fn rarity_color_class(rarity: types.Rarity) -> String {
  case rarity {
    types.Common -> "text-gray-600"
    types.Rare -> "text-blue-600"
    types.Cosmic -> "text-purple-600"
  }
}

// Game Stats Labels
pub const systems_label = "SYSTEMS"

pub const data_label = "DATA"

pub const target_label = "TARGET"

pub const sector_label = "SECTOR"

pub const credits_label = "CREDITS"

pub const earned_label = "EARNED"

// Status Messages
pub fn data_target_message(milestone: Int) -> String {
  "DATA TARGET ACHIEVED: " <> int.to_string(milestone) <> " UNITS"
}

pub const mission_failed_message = "ALL SYSTEMS COMPROMISED. INITIATING RESET PROTOCOL."

// Status Effects Display
pub const status_effects_title = "ACTIVE ENHANCEMENTS"

pub fn multiplier_status_text(multiplier: Int) -> String {
  "◈ SIGNAL AMPLIFIER ×" <> int.to_string(multiplier)
}

pub fn immunity_status_text(remaining: Int) -> String {
  "◈ HAZARD SHIELD ACTIVE (" <> int.to_string(remaining) <> " remaining)"
}
