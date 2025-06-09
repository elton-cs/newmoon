import display
import gleam/int
import gleam/list
import lustre/element.{type Element}
import types.{
  type Model, type Msg, type OrbType, BackToMainMenu, BackToOrbTesting,
  ConfirmOrbValue, DataSample, Defeat, ExitTesting, Failure, Game, Gameplay,
  GoToOrbTesting, HazardSample, HealthSample, Main, Menu, NextLevel,
  OrbSelection, Playing, ResetTesting, RestartGame, SelectOrbType, StartGame,
  Success, Testing, ValueConfiguration, Victory,
}
import ui

pub fn view(model: Model) -> Element(Msg) {
  // Clear pattern matching on model fields to determine view
  case model.screen {
    Menu(Main) ->
      ui.app_container(
        ui.game_card([ui.game_header(), render_main_menu_view()]),
      )
    Testing(OrbSelection) ->
      ui.app_container(
        ui.game_card([ui.game_header(), render_orb_testing_view()]),
      )
    Testing(ValueConfiguration(orb_type)) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_orb_value_selection_view(orb_type, model.input_value),
        ]),
      )
    Testing(Gameplay) ->
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
    Game(Playing) ->
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
    Game(Victory) ->
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
    Game(Defeat) ->
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
    Testing(Success) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_game_stats(
            model.health,
            model.points,
            model.milestone,
            model.level,
          ),
          render_testing_won_view(model.milestone),
        ]),
      )
    Testing(Failure) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_game_stats(
            model.health,
            model.points,
            model.milestone,
            model.level,
          ),
          render_testing_lost_view(),
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
    ui.orb_selection_button("Data Sample", SelectOrbType(DataSample)),
    ui.orb_selection_button("Hazard Sample", SelectOrbType(HazardSample)),
    ui.orb_selection_button("Health Sample", SelectOrbType(HealthSample)),
    ui.secondary_button(display.back_to_menu_text, BackToMainMenu),
  ])
}

// Orb Value Selection View - input specific value for orb type
fn render_orb_value_selection_view(
  orb_type: OrbType,
  input_value: String,
) -> Element(Msg) {
  let orb_name = case orb_type {
    DataSample -> "Data Sample"
    HazardSample -> "Hazard Sample"
    HealthSample -> "Health Sample"
  }
  let description = case orb_type {
    DataSample -> "Enter the data points this sample will provide"
    HazardSample -> "Enter the system damage this sample will cause"
    HealthSample -> "Enter the health points this sample will restore"
  }

  element.fragment([
    ui.status_panel(
      orb_name <> " Configuration",
      description,
      "bg-blue-50 border-blue-200",
    ),
    ui.number_input(input_value),
    ui.primary_button("Confirm Value", ConfirmOrbValue(orb_type)),
    ui.secondary_button("Back to Selection", BackToOrbTesting),
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

// Testing Won View - only restart testing or main menu options
fn render_testing_won_view(milestone: Int) -> Element(Msg) {
  let message = display.data_target_message(milestone)

  element.fragment([
    ui.status_panel("TEST COMPLETE", message, "bg-green-50 border-green-200"),
    ui.secondary_button("Restart Testing", ResetTesting),
    ui.secondary_button(display.exit_testing_text, ExitTesting),
  ])
}

// Testing Lost View - only restart testing or main menu options
fn render_testing_lost_view() -> Element(Msg) {
  element.fragment([
    ui.failure_panel(
      "TEST FAILED",
      "All systems compromised during testing. Analyze results and retry.",
    ),
    ui.secondary_button("Restart Testing", ResetTesting),
    ui.secondary_button(display.exit_testing_text, ExitTesting),
  ])
}
