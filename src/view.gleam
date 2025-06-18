import display
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import status
import types.{
  type MarketplaceItem, type Model, type Msg, AcceptFate, AcceptRisk,
  ApplyRiskEffects, ContinueAfterRiskConsumption, ContinueToNextLevel, Defeat,
  Game, GameComplete, GoToMarketplace, Main, Marketplace, Menu, Playing,
  PurchaseItem, RestartGame, RiskAccept, RiskConsumed, RiskDied, RiskPlaying,
  RiskReveal, RiskSurvived, SelectMarketplaceItem, StartGame, Victory,
}
import ui

pub fn view(model: Model) -> Element(Msg) {
  // Clear pattern matching on model fields to determine view
  let main_content = case model.screen {
    Menu(Main) ->
      ui.app_container(
        ui.game_card([ui.game_header(), render_main_menu_view()]),
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
            model.active_statuses,
          ),
          render_playing_view(
            model.last_orb,
            model.last_orb_message,
            model.bag,
            model.active_statuses,
            model.pulled_orbs,
            model.choice_orb_1,
            model.choice_orb_2,
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
            model.active_statuses,
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
            model.active_statuses,
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
  active_statuses: List(types.StatusEffect),
) -> Element(Msg) {
  let status_effects = extract_active_status_effects(active_statuses)

  ui.stats_grid([
    // Row 1: SECTOR, CREDITS
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
      "text-gray-600",
    ),
    // Row 2: DATA, TARGET
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
    // Row 3: SYSTEMS, STATUS
    ui.stat_card(
      "○",
      display.systems_label,
      int.to_string(health),
      "text-black",
    ),
    ui.status_stat_card(status_effects),
  ])
}

// Playing View - takes specific fields needed
fn render_playing_view(
  last_orb,
  last_orb_message,
  bag,
  active_statuses: List(types.StatusEffect),
  _pulled_orbs: List(types.Orb),
  choice_orb_1: Option(types.Orb),
  choice_orb_2: Option(types.Orb),
) -> Element(Msg) {
  let orbs_left = list.length(bag)
  let is_disabled = list.is_empty(bag)

  // Check if we're in choice state
  let is_choosing = case choice_orb_1, choice_orb_2 {
    Some(_), Some(_) -> True
    _, _ -> False
  }

  element.fragment([
    case is_choosing {
      True -> ui.choice_orb_display(choice_orb_1, choice_orb_2)
      False -> ui.orb_result_display(last_orb, last_orb_message)
    },
    ui.container_display(orbs_left),
    ui.extract_button(is_disabled || is_choosing),
    // Disable extract button during choice
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
  let message = display.data_target_message(milestone)

  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
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

  element.fragment([
    ui.orb_result_display(last_orb, last_orb_message),
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
      "bg-gray-50 border-gray-200",
    ),
    render_marketplace_stats(model.points, model.credits),
    render_marketplace_grid(model.credits, model.marketplace_selection),
    ui.primary_button(display.continue_to_next_sector_text, ContinueToNextLevel),
  ])
}

// Grid-based marketplace layout matching game stats
fn render_marketplace_grid(
  credits: Int,
  marketplace_selection: List(MarketplaceItem),
) -> Element(Msg) {
  let item_cards =
    list.index_map(marketplace_selection, fn(item, index) {
      let can_afford = credits >= item.price
      let symbol = get_marketplace_symbol(item.orb)

      ui.marketplace_item_card(
        symbol,
        item.name,
        item.price,
        can_afford,
        PurchaseItem(index),
      )
    })

  ui.marketplace_grid(item_cards)
}

// Helper function to get marketplace symbols for orbs
fn get_marketplace_symbol(orb: types.Orb) -> String {
  case orb {
    types.PointOrb(_) -> "●"
    types.BombOrb(_) -> "○"
    types.HealthOrb(_) -> "◇"
    types.AllCollectorOrb(_) -> "◎"
    types.PointCollectorOrb(_) -> "◉"
    types.BombSurvivorOrb(_) -> "◆"
    types.MultiplierOrb(_) -> "◈"
    types.NextPointMultiplierOrb(_) -> "◆"
    types.BombImmunityOrb -> "◇"
    types.ChoiceOrb -> "◈"
    types.RiskOrb -> "⚠"
    types.PointRecoveryOrb -> "◎"
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
  ])
}

// Status Effects Extraction - extracts active status effects from model
fn extract_active_status_effects(
  active_statuses: List(types.StatusEffect),
) -> List(String) {
  list.map(active_statuses, status.status_to_display_text)
}

// Risk Mode Views

fn render_risk_accept_view() -> Element(Msg) {
  element.fragment([
    ui.status_panel(
      "THE VOID BECKONS",
      "A Void Portal has been detected. This portal will extract 5 specimens simultaneously from the container. If you survive all extractions, any data will award double points. Do you dare enter the void?",
      "bg-red-50 border-red-200",
    ),
    ui.primary_button("ENTER VOID", AcceptRisk(True)),
    ui.secondary_button("AVOID VOID", AcceptRisk(False)),
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
