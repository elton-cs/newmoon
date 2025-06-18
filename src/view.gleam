import display
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import status
import types.{
  type MarketplaceItem, type Model, type Msg, type OrbType, type Rarity,
  AcceptFate, AcceptRisk, AllCollectorSample, ApplyRiskEffects, BackToMainMenu,
  BackToOrbTesting, BombImmunitySample, BombSurvivorSample, ChoiceSample,
  ChooseOrb, Choosing, Common, ConfirmOrbValue, ContinueAfterRiskConsumption,
  ContinueToNextLevel, Cosmic, DataSample, Defeat, ExitRisk, ExitTesting,
  Failure, Game, GameComplete, Gameplay, GoToMarketplace, GoToOrbTesting,
  HazardSample, HealthSample, Main, Marketplace, MarketplaceItem, Menu,
  MultiplierSample, NextLevel, NextPointMultiplierSample, OrbSelection, Playing,
  PointCollectorSample, PointRecoverySample, PullRiskOrb, PurchaseItem, Rare,
  ResetTesting, RestartGame, RiskAccept, RiskConsumed, RiskDied, RiskPlaying,
  RiskReveal, RiskSample, RiskSurvived, SelectMarketplaceItem, SelectOrbType,
  StartGame, StartTestingPointRecoveryActive, StartTestingPointRecoveryFirst,
  StartTestingRiskContinue, StartTestingRiskFailure, StartTestingRiskSuccess,
  StartTestingWithBothStatuses, StartTestingWithTripleChoice, Success,
  TestGameComplete, Testing, TestingChoosing, TestingRiskAccept,
  TestingRiskConsumed, TestingRiskDied, TestingRiskPlaying, TestingRiskReveal,
  TestingRiskSurvived, ValueConfiguration, Victory,
}
import ui

pub fn view(model: Model) -> Element(Msg) {
  // Clear pattern matching on model fields to determine view
  let main_content = case model.screen {
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
            model.credits,
          ),
          render_testing_mode_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.active_statuses,
            model.pulled_orbs,
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
            model.credits,
          ),
          render_playing_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.active_statuses,
            model.pulled_orbs,
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
            model.credits,
          ),
          render_won_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.active_statuses,
            model.milestone,
            model.pulled_orbs,
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
            model.credits,
          ),
          render_lost_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.active_statuses,
            model.pulled_orbs,
          ),
        ]),
      )
    Game(GameComplete) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_game_complete_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.active_statuses,
            model.pulled_orbs,
          ),
        ]),
      )
    Game(Marketplace) ->
      ui.app_container(
        ui.game_card([ui.game_header(), render_marketplace_view(model)]),
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
            model.credits,
          ),
          render_testing_won_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.active_statuses,
            model.milestone,
            model.pulled_orbs,
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
            model.credits,
          ),
          render_testing_lost_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.active_statuses,
            model.pulled_orbs,
          ),
        ]),
      )
    Game(Choosing) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_game_stats(
            model.health,
            model.points,
            model.milestone,
            model.level,
            model.credits,
          ),
          render_choosing_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.active_statuses,
            model.choice_orb_1,
            model.choice_orb_2,
            model.pulled_orbs,
          ),
        ]),
      )
    Game(RiskAccept) ->
      ui.app_container(
        ui.game_card([ui.game_header(), render_risk_accept_view()]),
      )
    Game(RiskReveal) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_risk_reveal_view(model.risk_orbs),
        ]),
      )
    Game(RiskPlaying) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_risk_playing_view(
            model.last_orb,
            model.last_orb_message,
            model.risk_orbs,
            model.risk_original_orbs,
            model.risk_health,
            model.risk_pulled_orbs,
          ),
        ]),
      )
    Game(RiskSurvived) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_risk_survived_view(
            model.risk_accumulated_effects,
            model.risk_pulled_orbs,
          ),
        ]),
      )
    Game(RiskConsumed) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_risk_consumed_view(model.milestone, model.points),
        ]),
      )
    Game(RiskDied) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          render_risk_died_view(
            model.last_orb,
            model.last_orb_message,
            model.risk_pulled_orbs,
          ),
        ]),
      )
    Testing(TestingChoosing) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          ui.testing_mode_indicator(),
          render_game_stats(
            model.health,
            model.points,
            model.milestone,
            model.level,
            model.credits,
          ),
          render_testing_choosing_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.active_statuses,
            model.choice_orb_1,
            model.choice_orb_2,
            model.pulled_orbs,
          ),
        ]),
      )
    Testing(TestingRiskAccept) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          ui.testing_mode_indicator(),
          render_testing_risk_accept_view(),
        ]),
      )
    Testing(TestingRiskReveal) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          ui.testing_mode_indicator(),
          render_testing_risk_reveal_view(model.risk_orbs),
        ]),
      )
    Testing(TestingRiskPlaying) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          ui.testing_mode_indicator(),
          render_testing_risk_playing_view(
            model.last_orb,
            model.last_orb_message,
            model.risk_orbs,
            model.risk_original_orbs,
            model.risk_health,
            model.risk_pulled_orbs,
          ),
        ]),
      )
    Testing(TestingRiskSurvived) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          ui.testing_mode_indicator(),
          render_testing_risk_survived_view(
            model.risk_accumulated_effects,
            model.risk_pulled_orbs,
          ),
        ]),
      )
    Testing(TestingRiskConsumed) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          ui.testing_mode_indicator(),
          render_testing_risk_consumed_view(model.milestone, model.points),
        ]),
      )
    Testing(TestingRiskDied) ->
      ui.app_container(
        ui.game_card([
          ui.game_header(),
          ui.testing_mode_indicator(),
          render_testing_risk_died_view(
            model.last_orb,
            model.last_orb_message,
            model.risk_pulled_orbs,
          ),
        ]),
      )
  }

  // Wrap main content with dev mode components
  element.fragment([
    main_content,
    ui.dev_mode_panel(
      model.dev_mode,
      model.bag,
      model.screen,
      model.choice_orb_1,
      model.choice_orb_2,
      model.active_statuses,
      model.pulled_orbs,
    ),
  ])
}

// Game Stats - takes explicit values instead of full model
fn render_game_stats(
  health: Int,
  points: Int,
  milestone: Int,
  level: Int,
  credits: Int,
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
    ui.stat_card(
      "◇",
      display.credits_label,
      int.to_string(credits),
      "text-purple-600",
    ),
  ])
}

// Playing View - takes specific fields needed
fn render_playing_view(
  last_orb,
  last_orb_message,
  bag,
  active_statuses: List(types.StatusEffect),
  _pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let is_disabled = list.is_empty(bag)
  let status_effects = extract_active_status_effects(active_statuses)

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
  active_statuses: List(types.StatusEffect),
  milestone: Int,
  _pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let status_effects = extract_active_status_effects(active_statuses)
  let message = display.data_target_message(milestone)

  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
    ui.status_effects_display(status_effects),
    ui.container_display(orbs_left),
    ui.success_button(display.advance_button_text, GoToMarketplace),
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
  active_statuses: List(types.StatusEffect),
  _pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let status_effects = extract_active_status_effects(active_statuses)

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

// Game Complete View - shows final victory message
fn render_game_complete_view(
  _last_orb,
  _last_orb_message,
  _bag,
  _active_statuses: List(types.StatusEffect),
  _pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      "MISSION COMPLETE",
      "ALL FIVE SECTORS SUCCESSFULLY EXPLORED. EXEMPLARY PERFORMANCE RECORDED.",
      "bg-green-50 border-green-200",
    ),
    ui.primary_button(display.play_again_text, RestartGame),
  ])
}

// Marketplace View - orb purchasing functionality
fn render_marketplace_view(model: types.Model) -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      display.marketplace_title,
      "SPEND YOUR ACCUMULATED CREDITS TO ACQUIRE ORBITAL SAMPLES",
      "bg-purple-50 border-purple-200",
    ),
    render_marketplace_stats(model.points, model.credits),
    render_marketplace_two_panel(
      model.credits,
      model.selected_marketplace_item,
      model.marketplace_selection,
    ),
    ui.primary_button(display.continue_to_next_sector_text, ContinueToNextLevel),
  ])
}

// Mobile-first marketplace layout
fn render_marketplace_two_panel(
  credits: Int,
  selected_item: option.Option(Int),
  marketplace_selection: List(MarketplaceItem),
) -> Element(Msg) {
  html.div([attribute.class("space-y-4")], [
    // Horizontal scrolling catalog (mobile-first)
    render_marketplace_catalog(credits, selected_item, marketplace_selection),
    // Detail panel below on mobile, side-by-side on larger screens
    html.div([attribute.class("min-h-[200px]")], [
      render_marketplace_detail_panel(
        credits,
        selected_item,
        marketplace_selection,
      ),
    ]),
  ])
}

// Horizontally scrollable compact item catalog
fn render_marketplace_catalog(
  credits: Int,
  selected_item: option.Option(Int),
  marketplace_selection: List(MarketplaceItem),
) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "flex gap-3 overflow-x-auto overflow-y-hidden pt-3 pb-2 scrollbar-thin scrollbar-thumb-gray-300 w-[396px]",
      ),
    ],
    list.index_map(marketplace_selection, fn(item, index) {
      let can_afford = credits >= item.price
      let is_selected = case selected_item {
        Some(selected_index) -> selected_index == index
        None -> False
      }
      let rarity_color = get_rarity_bg_color(item.rarity)
      let item_code = get_item_code(index)

      ui.ultra_compact_marketplace_item(
        item_code,
        rarity_color,
        can_afford,
        is_selected,
        SelectMarketplaceItem(index),
      )
    }),
  )
}

// Right panel - detailed item view
fn render_marketplace_detail_panel(
  credits: Int,
  selected_item: option.Option(Int),
  marketplace_selection: List(MarketplaceItem),
) -> Element(Msg) {
  case selected_item {
    Some(index) -> {
      case get_item_at_index_view(marketplace_selection, index) {
        Some(item) -> {
          let can_afford = credits >= item.price
          let rarity_color = display.rarity_color_class(item.rarity)
          let rarity_name = display.rarity_display_name(item.rarity)

          ui.marketplace_item_detail(
            item.name,
            item.description,
            item.price,
            rarity_name,
            rarity_color,
            can_afford,
            PurchaseItem(0),
            // Index doesn't matter as purchase uses selected item
          )
        }
        None -> ui.marketplace_default_detail()
      }
    }
    None -> ui.marketplace_default_detail()
  }
}

// Helper function to get item at index for view
fn get_item_at_index_view(
  items: List(MarketplaceItem),
  index: Int,
) -> option.Option(MarketplaceItem) {
  list.drop(items, index)
  |> list.first
  |> option.from_result
}

// Helper function to convert rarity to background color
fn get_rarity_bg_color(rarity: types.Rarity) -> String {
  case rarity {
    types.Common -> "bg-gray-400"
    types.Rare -> "bg-blue-500"
    types.Cosmic -> "bg-purple-500"
  }
}

// Helper function to generate item codes based on index
fn get_item_code(index: Int) -> String {
  case index {
    0 -> "C1"
    1 -> "C2"
    2 -> "C3"
    3 -> "C4"
    4 -> "C5"
    5 -> "C6"
    6 -> "C7"
    7 -> "R1"
    8 -> "R2"
    9 -> "R3"
    10 -> "R4"
    11 -> "X1"
    12 -> "X2"
    _ -> "??"
  }
}

// Marketplace Stats - shows earned points and total credits
fn render_marketplace_stats(
  earned_points: Int,
  total_credits: Int,
) -> Element(Msg) {
  ui.stats_grid([
    ui.stat_card(
      "●",
      display.earned_label,
      int.to_string(earned_points),
      "text-green-600",
    ),
    ui.stat_card(
      "◇",
      display.credits_label,
      int.to_string(total_credits),
      "text-purple-600",
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
    ui.secondary_button("TEST GAME COMPLETE", TestGameComplete),
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
      "Next Point Amplifier",
      SelectOrbType(NextPointMultiplierSample),
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
    ui.orb_selection_button(
      "Shield Generator Sample",
      SelectOrbType(BombImmunitySample),
    ),
    ui.orb_selection_button("Choice Portal Sample", SelectOrbType(ChoiceSample)),
    ui.orb_selection_button("Fate Sample", SelectOrbType(RiskSample)),
    ui.orb_selection_button(
      "Point Recovery Sample",
      SelectOrbType(PointRecoverySample),
    ),
    ui.orb_selection_button("Both Status Effects", StartTestingWithBothStatuses),
    ui.orb_selection_button("Triple Choice Test", StartTestingWithTripleChoice),
    ui.orb_selection_button("Risk Success Test", StartTestingRiskSuccess),
    ui.orb_selection_button("Risk Failure Test", StartTestingRiskFailure),
    ui.orb_selection_button("Risk Continue Test", StartTestingRiskContinue),
    ui.orb_selection_button(
      "Point Recovery First Test",
      StartTestingPointRecoveryFirst,
    ),
    ui.orb_selection_button(
      "Point Recovery Active Test",
      StartTestingPointRecoveryActive,
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
    NextPointMultiplierSample -> "Next Point Amplifier"
    AllCollectorSample -> "All Collector Sample"
    PointCollectorSample -> "Point Collector Sample"
    BombSurvivorSample -> "Bomb Survivor Sample"
    BombImmunitySample -> "Shield Generator Sample"
    ChoiceSample -> "Choice Portal Sample"
    RiskSample -> "Fate Sample"
    PointRecoverySample -> "Point Recovery Sample"
  }
  let description = case orb_type {
    DataSample -> "Enter the data points this sample will provide"
    HazardSample -> "Enter the system damage this sample will cause"
    HealthSample -> "Enter the health points this sample will restore"
    MultiplierSample ->
      "Doubles the current point multiplier for all point-awarding samples"
    NextPointMultiplierSample ->
      "Applies multiplier to the next point-awarding sample only, then expires"
    AllCollectorSample ->
      "Enter points awarded per remaining sample in container"
    PointCollectorSample ->
      "Enter points awarded per data sample left in container"
    BombSurvivorSample ->
      "Enter points awarded per hazard sample encountered so far"
    BombImmunitySample ->
      "Activates hazard shield for 3 extractions, returning hazards to container"
    ChoiceSample -> "Presents a choice between two samples from the container"
    RiskSample ->
      "High-risk sample that extracts 5 samples at once with 2× point bonus if survived"
    PointRecoverySample ->
      "Returns the lowest-value data sample back to the container for another chance at points"
  }

  case orb_type {
    DataSample
    | HazardSample
    | HealthSample
    | AllCollectorSample
    | PointCollectorSample
    | BombSurvivorSample ->
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
    MultiplierSample | NextPointMultiplierSample ->
      element.fragment([
        ui.status_panel(
          orb_name <> " Configuration",
          description,
          "bg-blue-50 border-blue-200",
        ),
        ui.float_input(input_value),
        ui.primary_button("Confirm Value", ConfirmOrbValue(orb_type)),
        ui.secondary_button("Back to Selection", BackToOrbTesting),
      ])
    BombImmunitySample | ChoiceSample | RiskSample | PointRecoverySample ->
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
  active_statuses: List(types.StatusEffect),
  _pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let is_disabled = list.is_empty(bag)
  let status_effects = extract_active_status_effects(active_statuses)

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
  active_statuses: List(types.StatusEffect),
  milestone: Int,
  _pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let status_effects = extract_active_status_effects(active_statuses)
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
  active_statuses: List(types.StatusEffect),
  _pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let status_effects = extract_active_status_effects(active_statuses)

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
fn extract_active_status_effects(
  active_statuses: List(types.StatusEffect),
) -> List(String) {
  list.map(active_statuses, status.status_to_display_text)
}

// Choosing View - displays two orb options for main game
fn render_choosing_view(
  last_orb,
  last_orb_message,
  bag,
  active_statuses: List(types.StatusEffect),
  choice_orb_1: Option(types.Orb),
  choice_orb_2: Option(types.Orb),
  _pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let status_effects = extract_active_status_effects(active_statuses)

  case choice_orb_1, choice_orb_2 {
    Some(first_choice), Some(second_choice) ->
      element.fragment([
        ui.orb_result_display(last_orb, last_orb_message),
        ui.status_effects_display(status_effects),
        ui.container_display(orbs_left),
        ui.choice_panel(
          "SELECT ONE SAMPLE:",
          display.orb_display_name(first_choice),
          display.orb_display_name(second_choice),
          ChooseOrb(0),
          ChooseOrb(1),
        ),
      ])
    _, _ ->
      element.fragment([
        ui.orb_result_display(last_orb, last_orb_message),
        ui.status_effects_display(status_effects),
        ui.container_display(orbs_left),
        ui.failure_panel("CHOICE ERROR", "No choice options available."),
      ])
  }
}

// Testing Choosing View - displays two orb options for testing mode
fn render_testing_choosing_view(
  last_orb,
  last_orb_message,
  bag,
  active_statuses: List(types.StatusEffect),
  choice_orb_1: Option(types.Orb),
  choice_orb_2: Option(types.Orb),
  _pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let status_effects = extract_active_status_effects(active_statuses)

  case choice_orb_1, choice_orb_2 {
    Some(first_choice), Some(second_choice) ->
      element.fragment([
        ui.orb_result_display(last_orb, last_orb_message),
        ui.status_effects_display(status_effects),
        ui.container_display(orbs_left),
        ui.choice_panel(
          "SELECT ONE SAMPLE:",
          display.orb_display_name(first_choice),
          display.orb_display_name(second_choice),
          ChooseOrb(0),
          ChooseOrb(1),
        ),
        ui.secondary_button("RESTART TESTING", ResetTesting),
        ui.secondary_button(display.exit_testing_text, ExitTesting),
      ])
    _, _ ->
      element.fragment([
        ui.orb_result_display(last_orb, last_orb_message),
        ui.status_effects_display(status_effects),
        ui.container_display(orbs_left),
        ui.failure_panel("CHOICE ERROR", "No choice options available."),
        ui.secondary_button("RESTART TESTING", ResetTesting),
        ui.secondary_button(display.exit_testing_text, ExitTesting),
      ])
  }
}

// Risk Mode Views

fn render_risk_accept_view() -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      "THE FATES HAVE SPOKEN",
      "A rare Fate Sample has been detected. This sample will extract 5 specimens simultaneously from the container. If you survive all extractions, any data samples will award double points. Do you dare face your destiny?",
      "bg-red-50 border-red-200",
    ),
    ui.primary_button("ACCEPT FATE", AcceptRisk(True)),
    ui.secondary_button("DECLINE RISK", AcceptRisk(False)),
  ])
}

fn render_risk_reveal_view(risk_orbs: List(types.Orb)) -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      "BEHOLD YOUR DESTINY",
      "The void has revealed the specimens that await you. Face them one by one, and survive to claim your doubled rewards.",
      "bg-orange-50 border-orange-200",
    ),
    ui.risk_orbs_display(risk_orbs),
    ui.primary_button("FACE THE UNKNOWN", AcceptFate),
  ])
}

fn render_risk_playing_view(
  last_orb: Option(types.Orb),
  last_orb_message: Option(String),
  risk_orbs: List(types.Orb),
  risk_original_orbs: List(types.Orb),
  _risk_health: Int,
  _risk_pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  let _orbs_left = list.length(risk_orbs)
  let is_disabled = list.is_empty(risk_orbs)

  element.fragment([
    ui.status_panel(
      "RISK MODE ACTIVE",
      "You are in the void. Extract each specimen to survive and claim your enhanced rewards.",
      "bg-red-50 border-red-200",
    ),
    ui.risk_orbs_progress_display(risk_original_orbs, risk_orbs),
    ui.orb_result_display(last_orb, last_orb_message),
    ui.risk_extract_button(is_disabled),
  ])
}

fn render_risk_survived_view(
  risk_accumulated_effects: types.RiskEffects,
  _risk_pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      "RISK EFFECTS ACCUMULATED",
      "All specimens have been extracted from the void. The accumulated effects await consumption.",
      "bg-orange-50 border-orange-200",
    ),
    ui.risk_effects_summary(risk_accumulated_effects),
    ui.primary_button("CONSUME", ApplyRiskEffects),
  ])
}

fn render_risk_consumed_view(milestone: Int, points: Int) -> Element(Msg) {
  case points >= milestone {
    True ->
      element.fragment([
        ui.status_panel(
          "YOU SURVIVED THE VOID",
          "The void's power flows through you. Your gamble has paid off with enhanced rewards.",
          "bg-green-50 border-green-200",
        ),
        ui.success_button("CONTINUE MISSION", ContinueAfterRiskConsumption),
      ])
    False ->
      element.fragment([
        ui.status_panel(
          "YOU SURVIVED THE VOID",
          "The void's power flows through you. Your survival instincts have kept you alive.",
          "bg-green-50 border-green-200",
        ),
        ui.primary_button("CONTINUE MISSION", ContinueAfterRiskConsumption),
      ])
  }
}

fn render_risk_died_view(
  last_orb: Option(types.Orb),
  last_orb_message: Option(String),
  _risk_pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
    ui.failure_button("RESTART MISSION", RestartGame),
    ui.failure_panel(
      "YOU RISKED OUT",
      "THE VOID CONSUMED YOU. YOUR GAMBLE HAS ENDED IN DARKNESS.",
    ),
  ])
}

// Testing Risk Mode Views

fn render_testing_risk_accept_view() -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      "THE FATES HAVE SPOKEN",
      "A rare Fate Sample has been detected. This sample will extract 5 specimens simultaneously from the container. If you survive all extractions, any data samples will award double points. Do you dare face your destiny?",
      "bg-red-50 border-red-200",
    ),
    ui.primary_button("ACCEPT RISK", AcceptRisk(True)),
    ui.secondary_button("DECLINE RISK", AcceptRisk(False)),
    ui.secondary_button("RESTART TESTING", ResetTesting),
    ui.secondary_button(display.exit_testing_text, ExitTesting),
  ])
}

fn render_testing_risk_reveal_view(risk_orbs: List(types.Orb)) -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      "BEHOLD YOUR DESTINY",
      "The void has revealed the specimens that await you. Face them one by one, and survive to claim your doubled rewards.",
      "bg-orange-50 border-orange-200",
    ),
    ui.risk_orbs_display(risk_orbs),
    ui.primary_button("FACE THE UNKNOWN", AcceptFate),
    ui.secondary_button("RESTART TESTING", ResetTesting),
    ui.secondary_button(display.exit_testing_text, ExitTesting),
  ])
}

fn render_testing_risk_playing_view(
  last_orb: Option(types.Orb),
  last_orb_message: Option(String),
  risk_orbs: List(types.Orb),
  risk_original_orbs: List(types.Orb),
  _risk_health: Int,
  _risk_pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  let _orbs_left = list.length(risk_orbs)
  let is_disabled = list.is_empty(risk_orbs)

  element.fragment([
    ui.status_panel(
      "RISK MODE ACTIVE",
      "You are in the void. Extract each specimen to survive and claim your enhanced rewards.",
      "bg-red-50 border-red-200",
    ),
    ui.risk_orbs_progress_display(risk_original_orbs, risk_orbs),
    ui.orb_result_display(last_orb, last_orb_message),
    ui.risk_extract_button(is_disabled),
  ])
}

fn render_testing_risk_survived_view(
  risk_accumulated_effects: types.RiskEffects,
  _risk_pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      "RISK EFFECTS ACCUMULATED",
      "All specimens have been extracted from the void. The accumulated effects await consumption.",
      "bg-orange-50 border-orange-200",
    ),
    ui.risk_effects_summary(risk_accumulated_effects),
    ui.primary_button("CONSUME", ApplyRiskEffects),
    ui.secondary_button("RESTART TESTING", ResetTesting),
    ui.secondary_button(display.exit_testing_text, ExitTesting),
  ])
}

fn render_testing_risk_consumed_view(
  milestone: Int,
  points: Int,
) -> Element(Msg) {
  case points >= milestone {
    True ->
      element.fragment([
        ui.status_panel(
          "YOU SURVIVED THE VOID",
          "The void's power flows through you. Your gamble has paid off with enhanced rewards.",
          "bg-green-50 border-green-200",
        ),
        ui.success_button("CONTINUE TEST", ContinueAfterRiskConsumption),
        ui.secondary_button("RESTART TESTING", ResetTesting),
        ui.secondary_button(display.exit_testing_text, ExitTesting),
      ])
    False ->
      element.fragment([
        ui.status_panel(
          "YOU SURVIVED THE VOID",
          "The void's power flows through you. Your survival instincts have kept you alive.",
          "bg-green-50 border-green-200",
        ),
        ui.primary_button("CONTINUE TEST", ContinueAfterRiskConsumption),
        ui.secondary_button("RESTART TESTING", ResetTesting),
        ui.secondary_button(display.exit_testing_text, ExitTesting),
      ])
  }
}

fn render_testing_risk_died_view(
  last_orb: Option(types.Orb),
  last_orb_message: Option(String),
  _risk_pulled_orbs: List(types.Orb),
) -> Element(Msg) {
  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
    ui.secondary_button("RESTART TESTING", ResetTesting),
    ui.secondary_button(display.exit_testing_text, ExitTesting),
    ui.failure_panel(
      "YOU RISKED OUT",
      "THE VOID CONSUMED YOU. YOUR GAMBLE HAS ENDED IN DARKNESS.",
    ),
  ])
}
