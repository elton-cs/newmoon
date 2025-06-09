import types.{type Orb, AllCollectorOrb, BombOrb, BombSurvivorOrb, HealthOrb, PointCollectorOrb, PointOrb}

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
    AllCollectorOrb -> "All Collector Sample"
    PointCollectorOrb -> "Point Collector Sample"
    BombSurvivorOrb -> "Bomb Survivor Sample"
  }
}

// Orb Result Messages (space-themed)
pub fn orb_result_message(orb: Orb) -> String {
  case orb {
    PointOrb(value) -> "● DATA ACQUIRED +" <> int.to_string(value)
    BombOrb(value) -> "○ SYSTEM DAMAGE -" <> int.to_string(value)
    HealthOrb(value) -> "◇ SYSTEMS RESTORED +" <> int.to_string(value)
    AllCollectorOrb -> "◈ TOTAL COLLECTION +?"
    PointCollectorOrb -> "◉ DATA COLLECTION +?"
    BombSurvivorOrb -> "◆ SURVIVAL BONUS +?"
  }
}

// Collector orb result messages with actual values
pub fn collector_result_message(orb: Orb, bonus_points: Int) -> String {
  case orb {
    AllCollectorOrb -> "◈ TOTAL COLLECTION +" <> int.to_string(bonus_points)
    PointCollectorOrb -> "◉ DATA COLLECTION +" <> int.to_string(bonus_points)
    BombSurvivorOrb -> "◆ SURVIVAL BONUS +" <> int.to_string(bonus_points)
    _ -> orb_result_message(orb)
  }
}

// UI Labels and Text
pub const container_label = "SAMPLE CONTAINER"

pub const extract_button_text = "EXTRACT SAMPLE"

pub const specimens_suffix = " specimens"

// Main Menu Messages
pub const start_game_button_text = "START MISSION"

pub const orb_testing_button_text = "SAMPLE TESTING"

pub const main_menu_subtitle = "Prepare for deep space exploration"

// Orb Testing Messages
pub const orb_testing_title = "SAMPLE TESTING PROTOCOL"

pub const orb_testing_subtitle = "Select a sample type for controlled testing"

pub const back_to_menu_text = "BACK TO MENU"

pub const testing_mode_indicator = "TESTING MODE ACTIVE"

pub const test_data_sample_text = "Test Data Sample"

pub const test_hazard_sample_text = "Test Hazard Sample"

pub const reset_testing_text = "RESET TEST"

pub const exit_testing_text = "EXIT TO MENU"

// Game Status Messages
pub const sector_complete_title = "SECTOR COMPLETE"

pub const mission_failed_title = "MISSION FAILED"

pub const advance_button_text = "ADVANCE TO NEXT SECTOR"

pub const play_again_text = "🔄 Play Again"

// Game Stats Labels
pub const systems_label = "SYSTEMS"

pub const data_label = "DATA"

pub const target_label = "TARGET"

pub const sector_label = "SECTOR"

// Status Messages
pub fn data_target_message(milestone: Int) -> String {
  "Data target achieved: " <> int.to_string(milestone) <> " units"
}

pub const mission_failed_message = "All systems compromised. Initiating reset protocol."
