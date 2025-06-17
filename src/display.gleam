import types.{
  type Orb, AllCollectorOrb, BombImmunityOrb, BombOrb, BombSurvivorOrb,
  ChoiceOrb, HealthOrb, MultiplierOrb, PointCollectorOrb, PointOrb,
  PointRecoveryOrb, RiskOrb,
}

// Import int for string conversion
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
    MultiplierOrb -> "Multiplier Sample"
    BombImmunityOrb -> "Shield Generator Sample"
    ChoiceOrb -> "Choice Portal Sample"
    RiskOrb -> "Fate Sample"
    PointRecoveryOrb -> "Point Recovery Sample"
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
    MultiplierOrb -> "◈ MULTIPLIER ACTIVATED ×2"
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

pub const orb_testing_button_text = "SAMPLE TESTING"

pub const main_menu_subtitle = "PREPARE FOR DEEP SPACE EXPLORATION"

// Orb Testing Messages
pub const orb_testing_title = "SAMPLE TESTING PROTOCOL"

pub const orb_testing_subtitle = "SELECT A SAMPLE TYPE FOR CONTROLLED TESTING"

pub const back_to_menu_text = "BACK TO MENU"

pub const testing_mode_indicator = "TESTING MODE ACTIVE"

pub const test_data_sample_text = "TEST DATA SAMPLE"

pub const test_hazard_sample_text = "TEST HAZARD SAMPLE"

pub const reset_testing_text = "RESET TEST"

pub const exit_testing_text = "EXIT TO MENU"

// Game Status Messages
pub const sector_complete_title = "SECTOR COMPLETE"

pub const mission_failed_title = "MISSION FAILED"

pub const advance_button_text = "ADVANCE TO NEXT SECTOR"

pub const play_again_text = "PLAY AGAIN"

// Game Stats Labels
pub const systems_label = "SYSTEMS"

pub const data_label = "DATA"

pub const target_label = "TARGET"

pub const sector_label = "SECTOR"

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
