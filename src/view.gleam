import display
import gleam/int
import gleam/list
import lustre/element.{type Element}
import types.{
  type Model, type Msg, type OrbType, AllCollectorSample, BackToMainMenu,
  BackToOrbTesting, BombSurvivorSample, ConfirmOrbValue, DataSample, Defeat,
  ExitTesting, Failure, Game, Gameplay, GoToOrbTesting, HazardSample,
  HealthSample, Main, Menu, MultiplierSample, NextLevel, OrbSelection, Playing,
  PointCollectorSample, ResetTesting, RestartGame, SelectOrbType, StartGame,
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
          render_testing_mode_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.point_multiplier,
          ),
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
          render_playing_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.point_multiplier,
          ),
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
          render_won_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.point_multiplier,
            model.milestone,
          ),
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
          render_lost_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.point_multiplier,
          ),
        ]),
      )
    Testing(Success) ->
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
          render_testing_won_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.point_multiplier,
            model.milestone,
          ),
        ]),
      )
    Testing(Failure) ->
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
          render_testing_lost_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.point_multiplier,
          ),
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
fn render_playing_view(
  last_orb,
  last_orb_message,
  bag,
  point_multiplier: Int,
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let is_disabled = list.is_empty(bag)
  let status_effects = extract_active_status_effects(point_multiplier)

  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
    ui.status_effects_display(status_effects),
    ui.container_display(orbs_left),
    ui.extract_button(is_disabled),
  ])
}

// Won View - shows all game elements like playing view but with completion message
fn render_won_view(
  last_orb,
  last_orb_message,
  bag,
  point_multiplier: Int,
  milestone: Int,
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let status_effects = extract_active_status_effects(point_multiplier)
  let message = display.data_target_message(milestone)

  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
    ui.status_effects_display(status_effects),
    ui.container_display(orbs_left),
    ui.success_button(display.advance_button_text, NextLevel),
    ui.status_panel(
      display.sector_complete_title,
      message,
      "bg-green-50 border-green-200",
    ),
  ])
}

// Lost View - shows all game elements like playing view but with failure message
fn render_lost_view(
  last_orb,
  last_orb_message,
  bag,
  point_multiplier: Int,
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let status_effects = extract_active_status_effects(point_multiplier)

  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
    ui.status_effects_display(status_effects),
    ui.container_display(orbs_left),
    ui.failure_button(display.play_again_text, RestartGame),
    ui.failure_panel(
      display.mission_failed_title,
      display.mission_failed_message,
    ),
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
    ui.orb_selection_button(
      "Multiplier Sample",
      SelectOrbType(MultiplierSample),
    ),
    ui.orb_selection_button(
      "All Collector Sample",
      SelectOrbType(AllCollectorSample),
    ),
    ui.orb_selection_button(
      "Point Collector Sample",
      SelectOrbType(PointCollectorSample),
    ),
    ui.orb_selection_button(
      "Bomb Survivor Sample",
      SelectOrbType(BombSurvivorSample),
    ),
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
    MultiplierSample -> "Multiplier Sample"
    AllCollectorSample -> "All Collector Sample"
    PointCollectorSample -> "Point Collector Sample"
    BombSurvivorSample -> "Bomb Survivor Sample"
  }
  let description = case orb_type {
    DataSample -> "Enter the data points this sample will provide"
    HazardSample -> "Enter the system damage this sample will cause"
    HealthSample -> "Enter the health points this sample will restore"
    MultiplierSample ->
      "Doubles the current point multiplier for all point-awarding samples"
    AllCollectorSample ->
      "Awards points equal to remaining samples in container"
    PointCollectorSample ->
      "Awards points equal to number of data samples left in container"
    BombSurvivorSample ->
      "Awards points equal to number of hazard samples encountered so far"
  }

  case orb_type {
    DataSample | HazardSample | HealthSample ->
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
    MultiplierSample
    | AllCollectorSample
    | PointCollectorSample
    | BombSurvivorSample ->
      element.fragment([
        ui.status_panel(
          orb_name <> " Configuration",
          description,
          "bg-purple-50 border-purple-200",
        ),
        ui.primary_button("Start Test", ConfirmOrbValue(orb_type)),
        ui.secondary_button("Back to Selection", BackToOrbTesting),
      ])
  }
}

// Testing Mode View - includes reset and exit buttons
fn render_testing_mode_view(
  last_orb,
  last_orb_message,
  bag,
  point_multiplier: Int,
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let is_disabled = list.is_empty(bag)
  let status_effects = extract_active_status_effects(point_multiplier)

  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
    ui.status_effects_display(status_effects),
    ui.container_display(orbs_left),
    ui.extract_button(is_disabled),
    ui.secondary_button(display.reset_testing_text, ResetTesting),
    ui.secondary_button(display.exit_testing_text, ExitTesting),
  ])
}

// Testing Won View - shows all game elements like main game victory
fn render_testing_won_view(
  last_orb,
  last_orb_message,
  bag,
  point_multiplier: Int,
  milestone: Int,
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let status_effects = extract_active_status_effects(point_multiplier)
  let message = display.data_target_message(milestone)

  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
    ui.status_effects_display(status_effects),
    ui.container_display(orbs_left),
    ui.secondary_button("RESTART TESTING", ResetTesting),
    ui.secondary_button(display.exit_testing_text, ExitTesting),
    ui.status_panel("TEST COMPLETE", message, "bg-green-50 border-green-200"),
  ])
}

// Testing Lost View - shows all game elements like main game defeat
fn render_testing_lost_view(
  last_orb,
  last_orb_message,
  bag,
  point_multiplier: Int,
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let status_effects = extract_active_status_effects(point_multiplier)

  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
    ui.status_effects_display(status_effects),
    ui.container_display(orbs_left),
    ui.secondary_button("RESTART TESTING", ResetTesting),
    ui.secondary_button(display.exit_testing_text, ExitTesting),
    ui.failure_panel(
      "TEST FAILED",
      "ALL SYSTEMS COMPROMISED DURING TESTING. ANALYZE RESULTS AND RETRY.",
    ),
  ])
}

// Status Effects Extraction - extracts active status effects from model
fn extract_active_status_effects(point_multiplier: Int) -> List(String) {
  case point_multiplier > 1 {
    True -> [display.multiplier_status_text(point_multiplier)]
    False -> []
  }
}
