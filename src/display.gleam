import types.{type Orb, BombOrb, PointOrb}

// Import int for string conversion
import gleam/int

// Display text mappings for space-themed frontend terminology
// Internal code uses: Orb, Bag, Pull, etc.
// Frontend displays: Sample, Container, Extract, etc.

// Orb to Sample Display Names
pub fn orb_display_name(orb: Orb) -> String {
  case orb {
    PointOrb -> "Data Sample"
    BombOrb -> "Hazard Sample"
  }
}

// Orb Result Messages (space-themed)
pub fn orb_result_message(orb: Orb) -> String {
  case orb {
    PointOrb -> "● DATA ACQUIRED +1"
    BombOrb -> "○ SYSTEM DAMAGE -1"
  }
}

// UI Labels and Text
pub const container_label = "SAMPLE CONTAINER"

pub const extract_button_text = "EXTRACT SAMPLE"

pub const specimens_suffix = " specimens"

// Main Menu Messages
pub const start_game_button_text = "START MISSION"

pub const main_menu_subtitle = "Prepare for deep space exploration"

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
