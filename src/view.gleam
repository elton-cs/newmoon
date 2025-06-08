import display
import gleam/int
import gleam/list
import lustre/element.{type Element}
import types.{
  type Model, type Msg, BackToMainMenu, BombOrb, ExitTesting, GoToOrbTesting,
  Lost, MainMenu, NextLevel, OrbTesting, Playing, PointOrb, ResetTesting,
  RestartGame, SelectTestOrb, StartGame, TestingMode, Won,
}
import ui

pub fn view(model: Model) -> Element(Msg) {
  // Clear pattern matching on model fields to determine view
  case model.status {
    MainMenu ->
      ui.app_container(
        ui.game_card([ui.game_header(), render_main_menu_view()]),
      )
    OrbTesting ->
      ui.app_container(
        ui.game_card([ui.game_header(), render_orb_testing_view()]),
      )
    TestingMode ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          ui.testing_mode_indicator(),
          render_game_stats(
            model.health,
            model.points,
            model.milestone,
            model.level,
          ),
          render_testing_mode_view(model.last_orb, model.bag),
        ]),
      )
    Playing ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_game_stats(
            model.health,
            model.points,
            model.milestone,
            model.level,
          ),
          render_playing_view(model.last_orb, model.bag),
        ]),
      )
    Won ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_game_stats(
            model.health,
            model.points,
            model.milestone,
            model.level,
          ),
          render_won_view(model.milestone),
        ]),
      )
    Lost ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_game_stats(
            model.health,
            model.points,
            model.milestone,
            model.level,
          ),
          render_lost_view(),
        ]),
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
    ui.stat_card(
      "○",
      display.systems_label,
      int.to_string(health),
      "text-black",
    ),
    ui.stat_card(
      "●",
      display.data_label,
      int.to_string(points),
      "text-gray-700",
    ),
    ui.stat_card(
      "◎",
      display.target_label,
      int.to_string(milestone),
      "text-gray-600",
    ),
    ui.stat_card(
      "◉",
      display.sector_label,
      int.to_string(level),
      "text-gray-500",
    ),
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
  let message = display.data_target_message(milestone)

  element.fragment([
    ui.status_panel(
      display.sector_complete_title,
      message,
      "bg-gray-50 border-gray-200",
    ),
    ui.primary_button(display.advance_button_text, NextLevel),
  ])
}

// Lost View - no model data needed
fn render_lost_view() -> Element(Msg) {
  element.fragment([
    ui.failure_panel(
      display.mission_failed_title,
      display.mission_failed_message,
    ),
    ui.secondary_button(display.play_again_text, RestartGame),
  ])
}

// Main Menu View - no model data needed
fn render_main_menu_view() -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      "MISSION BRIEFING",
      display.main_menu_subtitle,
      "bg-blue-50 border-blue-200",
    ),
    ui.primary_button(display.start_game_button_text, StartGame),
    ui.orb_selection_button(display.orb_testing_button_text, GoToOrbTesting),
  ])
}

// Orb Testing View - no model data needed
fn render_orb_testing_view() -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      display.orb_testing_title,
      display.orb_testing_subtitle,
      "bg-purple-50 border-purple-200",
    ),
    ui.orb_selection_button(
      display.test_data_sample_text,
      SelectTestOrb(PointOrb),
    ),
    ui.orb_selection_button(
      display.test_hazard_sample_text,
      SelectTestOrb(BombOrb),
    ),
    ui.secondary_button(display.back_to_menu_text, BackToMainMenu),
  ])
}

// Testing Mode View - includes reset and exit buttons
fn render_testing_mode_view(last_orb, bag) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let is_disabled = list.is_empty(bag)

  element.fragment([
    ui.orb_result_display(last_orb),
    ui.container_display(orbs_left),
    ui.extract_button(is_disabled),
    ui.secondary_button(display.reset_testing_text, ResetTesting),
    ui.secondary_button(display.exit_testing_text, ExitTesting),
  ])
}
