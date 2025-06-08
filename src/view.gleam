import gleam/int
import gleam/list
import gleam/string
import lustre/element.{type Element}
import types.{type Model, type Msg, Lost, NextLevel, Playing, RestartGame, Won}
import ui

pub fn view(model: Model) -> Element(Msg) {
  // Clear pattern matching on model fields to determine view
  case model.status {
    Playing -> 
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_game_stats(model.health, model.points, model.milestone, model.level),
          render_playing_view(model.last_orb, model.bag),
        ])
      )
    Won -> 
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_game_stats(model.health, model.points, model.milestone, model.level),
          render_won_view(model.milestone),
        ])
      )
    Lost -> 
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_game_stats(model.health, model.points, model.milestone, model.level),
          render_lost_view(),
        ])
      )
  }
}

// Game Stats - takes explicit values instead of full model
fn render_game_stats(
  health: Int,
  points: Int,
  milestone: Int,
  level: Int,
) -> Element(Msg) {
  ui.stats_grid([
    ui.stat_card("○", "SYSTEMS", int.to_string(health), "text-black"),
    ui.stat_card("●", "DATA", int.to_string(points), "text-gray-700"),
    ui.stat_card("◎", "TARGET", int.to_string(milestone), "text-gray-600"),
    ui.stat_card("◉", "SECTOR", int.to_string(level), "text-gray-500"),
  ])
}

// Playing View - takes specific fields needed
fn render_playing_view(last_orb, bag) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let is_disabled = list.is_empty(bag)
  
  element.fragment([
    ui.orb_result_display(last_orb),
    ui.container_display(orbs_left),
    ui.extract_button(is_disabled),
  ])
}

// Won View - takes specific milestone value
fn render_won_view(milestone: Int) -> Element(Msg) {
  let message = string.concat([
    "Data target achieved: ",
    int.to_string(milestone),
    " units",
  ])
  
  element.fragment([
    ui.status_panel("SECTOR COMPLETE", message, "bg-gray-50 border-gray-200"),
    ui.primary_button("ADVANCE TO NEXT SECTOR", NextLevel),
  ])
}

// Lost View - no model data needed
fn render_lost_view() -> Element(Msg) {
  element.fragment([
    ui.failure_panel(
      "MISSION FAILED",
      "All systems compromised. Initiating reset protocol.",
    ),
    ui.secondary_button("🔄 Play Again", RestartGame),
  ])
}