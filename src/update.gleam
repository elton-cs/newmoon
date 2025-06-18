import display
import gleam/float
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import status
import types.{
  type Model, type Msg, type Orb, type OrbType, type Rarity, AcceptFate,
  AcceptRisk, AllCollectorOrb, AllCollectorSample, ApplyRiskEffects,
  BackToMainMenu, BackToOrbTesting, BombImmunityOrb, BombImmunitySample, BombOrb,
  BombSurvivorOrb, BombSurvivorSample, ChoiceOrb, ChoiceSample, ChooseOrb,
  Choosing, ClearOnGame, ClearOnLevel, Common, ConfirmOrbValue,
  ContinueAfterRiskConsumption, ContinueToNextLevel, Cosmic, DataSample, Defeat,
  ExitRisk, ExitTesting, Failure, Game, GameComplete, Gameplay, GoToMarketplace,
  GoToOrbTesting, HazardSample, HealthOrb, HealthSample, Main, Marketplace,
  MarketplaceItem, Menu, Model, MultiplierOrb, MultiplierSample, NextLevel,
  NextPointMultiplierOrb, NextPointMultiplierSample, OrbSelection, Playing,
  PointCollectorOrb, PointCollectorSample, PointOrb, PointRecoveryOrb,
  PointRecoverySample, PullOrb, PullRiskOrb, PurchaseItem, Rare, ResetTesting,
  RestartGame, RiskAccept, RiskConsumed, RiskDied, RiskOrb, RiskPlaying,
  RiskReveal, RiskSample, RiskSurvived, SelectMarketplaceItem, SelectOrbType,
  StartGame, StartTestingPointRecoveryActive, StartTestingPointRecoveryFirst,
  StartTestingRiskContinue, StartTestingRiskFailure, StartTestingRiskSuccess,
  StartTestingWithBothStatuses, StartTestingWithTripleChoice, Success,
  TestGameComplete, Testing, TestingChoosing, TestingRiskAccept,
  TestingRiskConsumed, TestingRiskDied, TestingRiskPlaying, TestingRiskReveal,
  TestingRiskSurvived, ToggleDevMode, UpdateInputValue, ValueConfiguration,
  Victory,
}

pub fn init(_) -> Model {
  Model(
    health: 5,
    points: 0,
    credits: 0,
    level: 1,
    milestone: get_milestone_for_level(1),
    bag: starter_orbs(),
    purchased_orbs: [],
    screen: Menu(Main),
    last_orb: None,
    last_orb_message: None,
    input_value: "",
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    active_statuses: [],
    choice_orb_1: None,
    choice_orb_2: None,
    dev_mode: False,
    risk_orbs: [],
    risk_original_orbs: [],
    risk_pulled_orbs: [],
    risk_accumulated_effects: types.RiskEffects(
      health_gained: 0,
      points_gained: 0,
      damage_taken: 0,
      special_orbs: [],
    ),
    risk_health: 5,
    selected_marketplace_item: None,
    marketplace_selection: [],
  )
}

// Helper function to create multiple instances of the same orb
fn repeat_orb(orb: Orb, count: Int) -> List(Orb) {
  list.range(0, count - 1)
  |> list.map(fn(_) { orb })
}

// Shuffled orb bag for each new game - different order every time
fn starter_orbs() -> List(Orb) {
  [
    repeat_orb(BombOrb(1), 3),
    // 3x Bomb (1 damage each)
    repeat_orb(BombOrb(2), 2),
    // 2x Double Bomb (2 damage each)
    repeat_orb(BombOrb(3), 1),
    // 1x Triple Bomb (3 damage)
    repeat_orb(PointOrb(5), 2),
    // 2x 5 points
    [MultiplierOrb(2.0)],
    // 1x x2 all future points
    [AllCollectorOrb(1)],
    // 1x 1 per item remaining in bag
    [BombSurvivorOrb(1)],
    // 1x 1 per bomb item pulled
    [ChoiceOrb],
    // 1x Choose between next 2 orbs
  ]
  |> list.flatten
  |> list.shuffle
}

// Combine starter orbs with purchased orbs and shuffle for random positioning
fn get_full_bag(purchased_orbs: List(Orb)) -> List(Orb) {
  starter_orbs()
  |> list.append(purchased_orbs)
  |> list.shuffle
}

// Common marketplace items
pub const common_marketplace_items = [
  types.MarketplaceItem(
    orb: PointOrb(5),
    price: 5,
    rarity: types.Common,
    name: "Data Sample",
    description: "+5 points when extracted",
  ),
  types.MarketplaceItem(
    orb: RiskOrb,
    price: 5,
    rarity: types.Common,
    name: "Fate Sample",
    description: "High-risk, high-reward extraction",
  ),
  types.MarketplaceItem(
    orb: BombSurvivorOrb(2),
    price: 6,
    rarity: types.Common,
    name: "Bomb Survivor",
    description: "+2 points per bomb pulled",
  ),
  types.MarketplaceItem(
    orb: HealthOrb(1),
    price: 9,
    rarity: types.Common,
    name: "Health Sample",
    description: "+1 health when extracted",
  ),
  types.MarketplaceItem(
    orb: PointOrb(7),
    price: 8,
    rarity: types.Common,
    name: "Enhanced Data",
    description: "+7 points when extracted",
  ),
  types.MarketplaceItem(
    orb: PointRecoveryOrb,
    price: 8,
    rarity: types.Common,
    name: "Point Recovery",
    description: "Returns lowest point sample to bag",
  ),
  types.MarketplaceItem(
    orb: PointCollectorOrb(2),
    price: 9,
    rarity: types.Common,
    name: "Point Collector",
    description: "+2 points per data sample in bag",
  ),
]

// Rare marketplace items
pub const rare_marketplace_items = [
  types.MarketplaceItem(
    orb: PointOrb(8),
    price: 11,
    rarity: types.Rare,
    name: "Premium Data",
    description: "+8 points when extracted",
  ),
  types.MarketplaceItem(
    orb: PointOrb(9),
    price: 13,
    rarity: types.Rare,
    name: "Elite Data",
    description: "+9 points when extracted",
  ),
  types.MarketplaceItem(
    orb: NextPointMultiplierOrb(2.0),
    price: 14,
    rarity: types.Rare,
    name: "Boost Signal",
    description: "2x multiplier for next point extraction",
  ),
  types.MarketplaceItem(
    orb: MultiplierOrb(1.5),
    price: 16,
    rarity: types.Rare,
    name: "Signal Amplifier",
    description: "1.5x multiplier for all point extraction",
  ),
]

// Cosmic marketplace items
pub const cosmic_marketplace_items = [
  types.MarketplaceItem(
    orb: HealthOrb(3),
    price: 21,
    rarity: types.Cosmic,
    name: "Cosmic Health",
    description: "+3 health when extracted",
  ),
  types.MarketplaceItem(
    orb: BombImmunityOrb,
    price: 23,
    rarity: types.Cosmic,
    name: "Hazard Shield",
    description: "Immunity to next 3 bomb samples",
  ),
]

// Generate a random selection of marketplace items
fn generate_marketplace_selection() -> List(types.MarketplaceItem) {
  let common_items =
    common_marketplace_items
    |> list.shuffle
    |> list.take(3)

  let rare_items =
    rare_marketplace_items
    |> list.shuffle
    |> list.take(2)

  let cosmic_items =
    cosmic_marketplace_items
    |> list.shuffle
    |> list.take(1)

  [common_items, rare_items, cosmic_items]
  |> list.flatten
}

// Test bag that includes the test orb plus the standard starter orbs
fn create_test_bag(test_orb: Orb) -> List(Orb) {
  [test_orb] |> list.append(starter_orbs())
}

// Helper function to count PointOrbs in a list
fn count_point_orbs(orbs: List(Orb)) -> Int {
  list.fold(orbs, 0, fn(count, orb) {
    case orb {
      PointOrb(_) -> count + 1
      _ -> count
    }
  })
}

// Helper function to count BombOrbs that have been pulled
fn count_pulled_bomb_orbs(pulled_orbs: List(Orb)) -> Int {
  list.fold(pulled_orbs, 0, fn(count, orb) {
    case orb {
      BombOrb(_) -> count + 1
      _ -> count
    }
  })
}

// Helper function to get milestone for specific level
fn get_milestone_for_level(level: Int) -> Int {
  case level {
    1 -> 12
    2 -> 18
    3 -> 28
    4 -> 44
    5 -> 66
    _ -> 12
    // Default to level 1 milestone for invalid levels
  }
}

// Helper function to find the lowest value PointOrb from pulled orbs
fn find_lowest_point_orb(pulled_orbs: List(Orb)) -> option.Option(Orb) {
  let point_orbs =
    list.filter(pulled_orbs, fn(orb) {
      case orb {
        PointOrb(_) -> True
        _ -> False
      }
    })

  case point_orbs {
    [] -> option.None
    [first, ..rest] -> {
      let lowest =
        list.fold(rest, first, fn(current_lowest, orb) {
          case current_lowest, orb {
            PointOrb(current_value), PointOrb(new_value) ->
              case new_value < current_value {
                True -> orb
                False -> current_lowest
              }
            _, _ -> current_lowest
          }
        })
      option.Some(lowest)
    }
  }
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    StartGame -> handle_start_game(model)
    GoToOrbTesting -> handle_go_to_orb_testing(model)
    SelectOrbType(orb_type) -> handle_select_orb_type(model, orb_type)
    UpdateInputValue(value) -> handle_update_input_value(model, value)
    ConfirmOrbValue(orb_type) -> handle_confirm_orb_value(model, orb_type)
    BackToMainMenu -> handle_back_to_main_menu(model)
    BackToOrbTesting -> handle_back_to_orb_testing(model)
    StartTestingWithBothStatuses ->
      handle_start_testing_with_both_statuses(model)
    StartTestingWithTripleChoice ->
      handle_start_testing_with_triple_choice(model)
    StartTestingRiskSuccess -> handle_start_testing_risk_success(model)
    StartTestingRiskFailure -> handle_start_testing_risk_failure(model)
    StartTestingRiskContinue -> handle_start_testing_risk_continue(model)
    StartTestingPointRecoveryFirst ->
      handle_start_testing_point_recovery_first(model)
    StartTestingPointRecoveryActive ->
      handle_start_testing_point_recovery_active(model)
    ChooseOrb(choice_index) -> handle_choose_orb(model, choice_index)
    PullOrb -> handle_pull_orb(model)
    NextLevel -> handle_next_level(model)
    RestartGame -> handle_restart_game(model)
    ResetTesting -> handle_reset_testing(model)
    ExitTesting -> handle_exit_testing(model)
    ToggleDevMode -> handle_toggle_dev_mode(model)
    AcceptRisk(accept) -> handle_accept_risk(model, accept)
    AcceptFate -> handle_accept_fate(model)
    PullRiskOrb -> handle_pull_risk_orb(model)
    ApplyRiskEffects -> handle_apply_risk_effects(model)
    ContinueAfterRiskConsumption ->
      handle_continue_after_risk_consumption(model)
    ExitRisk -> handle_exit_risk(model)
    TestGameComplete -> handle_test_game_complete(model)
    GoToMarketplace -> handle_go_to_marketplace(model)
    ContinueToNextLevel -> handle_continue_to_next_level(model)
    SelectMarketplaceItem(item_index) ->
      handle_select_marketplace_item(model, item_index)
    PurchaseItem(item_index) -> handle_purchase_item(model, item_index)
  }
}

fn handle_start_game(model: Model) -> Model {
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnGame)
  Model(
    ..clean_model,
    screen: Game(Playing),
    bag: get_full_bag(clean_model.purchased_orbs),
    health: 5,
    points: 0,
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    choice_orb_1: None,
    choice_orb_2: None,
  )
}

fn handle_go_to_orb_testing(model: Model) -> Model {
  Model(..model, screen: Testing(OrbSelection))
}

fn handle_select_orb_type(model: Model, orb_type: OrbType) -> Model {
  Model(
    ..model,
    screen: Testing(ValueConfiguration(orb_type)),
    input_value: "1",
  )
}

fn handle_update_input_value(model: Model, value: String) -> Model {
  Model(..model, input_value: value)
}

fn handle_confirm_orb_value(model: Model, orb_type: OrbType) -> Model {
  case orb_type {
    MultiplierSample -> {
      case float.parse(model.input_value) {
        Ok(multiplier_value) if multiplier_value >=. 1.0 -> {
          let test_orb = MultiplierOrb(multiplier_value)
          let clean_model =
            status.clear_statuses_by_persistence(model, ClearOnGame)
          Model(
            ..clean_model,
            screen: Testing(Gameplay),
            bag: create_test_bag(test_orb),
            health: 5,
            points: 0,
            last_orb: None,
            last_orb_message: None,
            pulled_orbs: [],
            point_multiplier: 1,
            bomb_immunity: 0,
            choice_orb_1: None,
            choice_orb_2: None,
            input_value: "",
            risk_orbs: [],
            risk_original_orbs: [],
            risk_pulled_orbs: [],
            risk_accumulated_effects: types.RiskEffects(
              health_gained: 0,
              points_gained: 0,
              damage_taken: 0,
              special_orbs: [],
            ),
            risk_health: 5,
            selected_marketplace_item: None,
            marketplace_selection: [],
          )
        }
        _ -> model
      }
    }
    NextPointMultiplierSample -> {
      case float.parse(model.input_value) {
        Ok(multiplier_value) if multiplier_value >=. 1.0 -> {
          let test_orb = NextPointMultiplierOrb(multiplier_value)
          let clean_model =
            status.clear_statuses_by_persistence(model, ClearOnGame)
          Model(
            ..clean_model,
            screen: Testing(Gameplay),
            bag: create_test_bag(test_orb),
            health: 5,
            points: 0,
            last_orb: None,
            last_orb_message: None,
            pulled_orbs: [],
            point_multiplier: 1,
            bomb_immunity: 0,
            choice_orb_1: None,
            choice_orb_2: None,
            input_value: "",
            risk_orbs: [],
            risk_original_orbs: [],
            risk_pulled_orbs: [],
            risk_accumulated_effects: types.RiskEffects(
              health_gained: 0,
              points_gained: 0,
              damage_taken: 0,
              special_orbs: [],
            ),
            risk_health: 5,
            selected_marketplace_item: None,
            marketplace_selection: [],
          )
        }
        _ -> model
      }
    }
    _ -> {
      case int.parse(model.input_value) {
        Ok(value) if value > 0 -> {
          let test_orb = case orb_type {
            DataSample -> PointOrb(value)
            HazardSample -> BombOrb(value)
            HealthSample -> HealthOrb(value)
            AllCollectorSample -> AllCollectorOrb(value)
            PointCollectorSample -> PointCollectorOrb(value)
            BombSurvivorSample -> BombSurvivorOrb(value)
            BombImmunitySample -> BombImmunityOrb
            ChoiceSample -> ChoiceOrb
            RiskSample -> RiskOrb
            PointRecoverySample -> PointRecoveryOrb
            MultiplierSample -> MultiplierOrb(2.0)
            // This case won't be reached
            NextPointMultiplierSample -> NextPointMultiplierOrb(2.0)
            // This case won't be reached
          }
          let clean_model =
            status.clear_statuses_by_persistence(model, ClearOnGame)
          Model(
            ..clean_model,
            screen: Testing(Gameplay),
            bag: create_test_bag(test_orb),
            health: 5,
            points: 0,
            last_orb: None,
            last_orb_message: None,
            pulled_orbs: [],
            point_multiplier: 1,
            bomb_immunity: 0,
            choice_orb_1: None,
            choice_orb_2: None,
            input_value: "",
            risk_orbs: [],
            risk_original_orbs: [],
            risk_pulled_orbs: [],
            risk_accumulated_effects: types.RiskEffects(
              health_gained: 0,
              points_gained: 0,
              damage_taken: 0,
              special_orbs: [],
            ),
            risk_health: 5,
            selected_marketplace_item: None,
            marketplace_selection: [],
          )
        }
        _ -> model
        // Invalid input, stay on current screen
      }
    }
  }
}

fn handle_back_to_orb_testing(model: Model) -> Model {
  Model(..model, screen: Testing(OrbSelection))
}

fn handle_start_testing_with_both_statuses(model: Model) -> Model {
  let test_bag =
    [MultiplierOrb(2.0), BombImmunityOrb] |> list.append(starter_orbs())
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnGame)
  Model(
    ..clean_model,
    screen: Testing(Gameplay),
    bag: test_bag,
    health: 5,
    points: 0,
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    choice_orb_1: None,
    choice_orb_2: None,
  )
}

fn handle_start_testing_with_triple_choice(model: Model) -> Model {
  let test_bag =
    [ChoiceOrb, ChoiceOrb, ChoiceOrb] |> list.append(starter_orbs())
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnGame)
  Model(
    ..clean_model,
    screen: Testing(Gameplay),
    bag: test_bag,
    health: 5,
    points: 0,
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    choice_orb_1: None,
    choice_orb_2: None,
  )
}

fn handle_back_to_main_menu(model: Model) -> Model {
  Model(..model, screen: Menu(Main))
}

fn handle_start_testing_risk_success(model: Model) -> Model {
  // Test bag for risk success: RiskOrb first, then mixed rewards/damage with health to survive
  // PointOrb(3) → 6 points (2× bonus), BombOrb(1) → 4 health, PointOrb(2) → 4 points (2× bonus),
  // HealthOrb(2) → 6 health (full), PointOrb(1) → 2 points (2× bonus)
  // Total: 12 enhanced points, survives with full health after taking damage
  let risk_orbs = [
    PointOrb(3),
    BombOrb(1),
    PointOrb(2),
    HealthOrb(2),
    PointOrb(1),
  ]
  let test_bag =
    [RiskOrb] |> list.append(risk_orbs) |> list.append(starter_orbs())
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnGame)
  Model(
    ..clean_model,
    screen: Testing(Gameplay),
    bag: test_bag,
    health: 5,
    points: 0,
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    choice_orb_1: None,
    choice_orb_2: None,
  )
}

fn handle_start_testing_risk_failure(model: Model) -> Model {
  // Test bag for risk failure: RiskOrb first, then bombs to kill player
  // BombOrb(2) → 3 health, BombOrb(2) → 1 health, BombOrb(2) → -1 health (death)
  // Dies on 3rd extraction, shows "YOU RISKED OUT" screen
  let risk_orbs = [BombOrb(2), BombOrb(2), BombOrb(2), BombOrb(1)]
  let test_bag =
    [RiskOrb] |> list.append(risk_orbs) |> list.append(starter_orbs())
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnGame)
  Model(
    ..clean_model,
    screen: Testing(Gameplay),
    bag: test_bag,
    health: 5,
    points: 0,
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    choice_orb_1: None,
    choice_orb_2: None,
  )
}

fn handle_start_testing_risk_continue(model: Model) -> Model {
  // Test bag for risk continue: RiskOrb first, then small rewards that won't reach milestone
  // PointOrb(1) → 2 points (2× bonus), PointOrb(1) → 2 points (2× bonus), 
  // PointOrb(1) → 2 points (2× bonus), PointOrb(1) → 2 points (2× bonus)
  // Total: 8 enhanced points, survives but doesn't reach the high milestone (50)
  let risk_orbs = [
    PointOrb(1),
    PointOrb(1),
    PointOrb(1),
    PointOrb(1),
    PointOrb(1),
  ]
  let test_bag =
    [RiskOrb] |> list.append(risk_orbs) |> list.append(starter_orbs())
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnGame)
  Model(
    ..clean_model,
    screen: Testing(Gameplay),
    bag: test_bag,
    health: 5,
    points: 0,
    milestone: 50,
    // Much higher milestone to test continue case
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    choice_orb_1: None,
    choice_orb_2: None,
  )
}

fn handle_start_testing_point_recovery_first(model: Model) -> Model {
  // Test bag for point recovery first: PointRecoveryOrb first, then PointOrbs
  // Tests scenario where PointRecoveryOrb is pulled when no PointOrbs have been pulled yet
  let test_bag = [PointRecoveryOrb, PointOrb(1), PointOrb(2), PointOrb(3)]
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnGame)
  Model(
    ..clean_model,
    screen: Testing(Gameplay),
    bag: test_bag,
    health: 5,
    points: 0,
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    choice_orb_1: None,
    choice_orb_2: None,
  )
}

fn handle_start_testing_point_recovery_active(model: Model) -> Model {
  // Test bag for point recovery active: 2 PointOrbs, then PointRecoveryOrb, then 1 PointOrb
  // Tests scenario where PointRecoveryOrb can recover the lowest pulled PointOrb
  let test_bag = [PointOrb(1), PointOrb(3), PointRecoveryOrb, PointOrb(2)]
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnGame)
  Model(
    ..clean_model,
    screen: Testing(Gameplay),
    bag: test_bag,
    health: 5,
    points: 0,
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    choice_orb_1: None,
    choice_orb_2: None,
  )
}

// Helper function to apply both next point multiplier and regular multiplier to points
fn apply_point_multipliers(model: Model, base_points: Int) -> #(Model, Int) {
  let regular_multiplier = status.get_point_multiplier(model.active_statuses)
  let has_next_multiplier =
    status.has_next_point_multiplier(model.active_statuses)

  case has_next_multiplier {
    True -> {
      let next_multiplier =
        status.get_next_point_multiplier(model.active_statuses)
      let final_points =
        float.truncate(
          int.to_float(base_points) *. next_multiplier *. regular_multiplier,
        )
      let updated_model = status.consume_next_point_multiplier(model)
      #(updated_model, final_points)
    }
    False -> {
      let final_points =
        float.truncate(int.to_float(base_points) *. regular_multiplier)
      #(model, final_points)
    }
  }
}

fn handle_pull_orb(model: Model) -> Model {
  case model.screen {
    Game(Playing) | Testing(Gameplay) -> {
      case model.bag {
        [] -> check_game_status(model)
        [first_orb, ..rest] -> {
          let #(new_model, orb_message, return_orb_to_bag) = case first_orb {
            PointOrb(value) -> {
              let #(updated_model, final_points) =
                apply_point_multipliers(model, value)
              let new_model =
                Model(
                  ..updated_model,
                  points: updated_model.points + final_points,
                )
              let message = display.orb_result_message(first_orb)
              #(new_model, message, False)
            }
            BombOrb(value) -> {
              case status.has_bomb_immunity(model.active_statuses) {
                True -> {
                  let new_model = model
                  let message =
                    "Bomb immunity protected you! Bomb returned to container."
                  #(new_model, message, True)
                }
                False -> {
                  let new_model = Model(..model, health: model.health - value)
                  let message = display.orb_result_message(first_orb)
                  #(new_model, message, False)
                }
              }
            }
            HealthOrb(value) -> {
              let new_health = int.min(model.health + value, 5)
              let new_model = Model(..model, health: new_health)
              let message = display.orb_result_message(first_orb)
              #(new_model, message, False)
            }
            AllCollectorOrb(collector_value) -> {
              let base_points = list.length(rest) * collector_value
              let #(updated_model, final_points) =
                apply_point_multipliers(model, base_points)
              let new_model =
                Model(
                  ..updated_model,
                  points: updated_model.points + final_points,
                )
              let message =
                display.collector_result_message(first_orb, final_points)
              #(new_model, message, False)
            }
            PointCollectorOrb(collector_value) -> {
              let base_points = count_point_orbs(rest) * collector_value
              let #(updated_model, final_points) =
                apply_point_multipliers(model, base_points)
              let new_model =
                Model(
                  ..updated_model,
                  points: updated_model.points + final_points,
                )
              let message =
                display.collector_result_message(first_orb, final_points)
              #(new_model, message, False)
            }
            BombSurvivorOrb(collector_value) -> {
              let base_points =
                count_pulled_bomb_orbs(model.pulled_orbs) * collector_value
              let #(updated_model, final_points) =
                apply_point_multipliers(model, base_points)
              let new_model =
                Model(
                  ..updated_model,
                  points: updated_model.points + final_points,
                )
              let message =
                display.collector_result_message(first_orb, final_points)
              #(new_model, message, False)
            }
            MultiplierOrb(multiplier) -> {
              let current_multiplier =
                status.get_point_multiplier(model.active_statuses)
              let new_multiplier = current_multiplier *. multiplier
              let new_model =
                model
                |> status.add_status(status.create_point_multiplier(
                  new_multiplier,
                ))
              let message = display.orb_result_message(first_orb)
              #(new_model, message, False)
            }
            NextPointMultiplierOrb(multiplier) -> {
              let new_model =
                model
                |> status.add_status(status.create_next_point_multiplier(
                  multiplier,
                ))
              let message = display.orb_result_message(first_orb)
              #(new_model, message, False)
            }
            BombImmunityOrb -> {
              let new_model =
                model
                |> status.add_status(status.create_bomb_immunity(3))
                |> fn(m) { Model(..m, bomb_immunity: 3) }
              let message = display.orb_result_message(first_orb)
              #(new_model, message, False)
            }
            ChoiceOrb -> {
              // Choice orb consumes itself and presents choice screen
              let message = display.orb_result_message(first_orb)
              #(model, message, False)
            }
            RiskOrb -> {
              // Risk orb presents accept/decline screen
              let message = display.orb_result_message(first_orb)
              #(model, message, False)
            }
            PointRecoveryOrb -> {
              // Find lowest point orb and return it to bag
              case find_lowest_point_orb(model.pulled_orbs) {
                option.Some(lowest_point_orb) -> {
                  // Remove the lowest point orb from pulled_orbs
                  let updated_pulled_orbs =
                    list.filter(model.pulled_orbs, fn(orb) {
                      orb != lowest_point_orb
                    })
                  let new_model =
                    Model(..model, pulled_orbs: updated_pulled_orbs)
                  let message = display.orb_result_message(first_orb)
                  #(new_model, message, False)
                }
                option.None -> {
                  // No point orbs to recover
                  let message = display.orb_result_message(first_orb)
                  #(model, message, False)
                }
              }
            }
          }

          let new_bag = case return_orb_to_bag {
            True -> list.append(rest, [first_orb])
            False ->
              case first_orb {
                PointRecoveryOrb ->
                  case find_lowest_point_orb(model.pulled_orbs) {
                    option.Some(lowest_point_orb) ->
                      list.append(rest, [lowest_point_orb])
                    option.None -> rest
                  }
                _ -> rest
              }
          }

          let new_immunity = case first_orb {
            BombImmunityOrb -> new_model.bomb_immunity
            _ ->
              case new_model.bomb_immunity > 0 {
                True -> new_model.bomb_immunity - 1
                False -> 0
              }
          }

          let model_with_bag_and_pulls =
            Model(
              ..new_model,
              bag: new_bag,
              last_orb: Some(first_orb),
              last_orb_message: Some(orb_message),
              pulled_orbs: case return_orb_to_bag {
                True -> model.pulled_orbs
                False -> [first_orb, ..model.pulled_orbs]
              },
              bomb_immunity: new_immunity,
            )

          let updated_model = case first_orb {
            BombImmunityOrb -> model_with_bag_and_pulls
            _ -> status.tick_statuses(model_with_bag_and_pulls)
          }

          // Handle special orb logic after normal consumption
          case first_orb {
            ChoiceOrb -> handle_choice_orb_activation(updated_model)
            RiskOrb -> handle_risk_orb_activation(updated_model)
            _ -> check_game_status(updated_model)
          }
        }
      }
    }
    _ -> model
  }
}

fn handle_choice_orb_activation(model: Model) -> Model {
  case model.bag {
    [] -> {
      // No orbs left to choose from, continue with game status check
      check_game_status(model)
    }
    [single_orb] -> {
      // Only one orb left, automatically process it
      let temp_model = Model(..model, bag: [single_orb])
      handle_pull_orb(temp_model)
    }
    [first_choice, second_choice, ..remaining] -> {
      // Present choice between the next two orbs
      let screen = case model.screen {
        Game(Playing) -> Game(Choosing)
        Testing(Gameplay) -> Testing(TestingChoosing)
        _ -> model.screen
      }
      let choice_model =
        Model(
          ..model,
          screen: screen,
          bag: remaining,
          choice_orb_1: Some(first_choice),
          choice_orb_2: Some(second_choice),
        )
      choice_model
    }
  }
}

fn handle_restart_game(model: Model) -> Model {
  Model(
    health: 5,
    points: 0,
    credits: 0,
    level: 1,
    milestone: get_milestone_for_level(1),
    bag: starter_orbs(),
    purchased_orbs: [],
    screen: Menu(Main),
    last_orb: None,
    last_orb_message: None,
    input_value: "",
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    active_statuses: [],
    choice_orb_1: None,
    choice_orb_2: None,
    dev_mode: model.dev_mode,
    risk_orbs: [],
    risk_original_orbs: [],
    risk_pulled_orbs: [],
    risk_accumulated_effects: types.RiskEffects(
      health_gained: 0,
      points_gained: 0,
      damage_taken: 0,
      special_orbs: [],
    ),
    risk_health: 5,
    selected_marketplace_item: None,
    marketplace_selection: [],
  )
}

fn handle_next_level(model: Model) -> Model {
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnLevel)
  let new_level = model.level + 1
  let new_milestone = get_milestone_for_level(new_level)
  Model(
    ..clean_model,
    health: 5,
    points: 0,
    level: new_level,
    milestone: new_milestone,
    bag: starter_orbs(),
    screen: Game(Playing),
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
  )
}

fn handle_reset_testing(model: Model) -> Model {
  Model(..model, screen: Testing(OrbSelection))
}

fn handle_exit_testing(model: Model) -> Model {
  Model(
    health: 5,
    points: 0,
    credits: 0,
    level: 1,
    milestone: get_milestone_for_level(1),
    bag: starter_orbs(),
    purchased_orbs: [],
    screen: Menu(Main),
    last_orb: None,
    last_orb_message: None,
    input_value: "",
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
    active_statuses: [],
    choice_orb_1: None,
    choice_orb_2: None,
    dev_mode: model.dev_mode,
    risk_orbs: [],
    risk_original_orbs: [],
    risk_pulled_orbs: [],
    risk_accumulated_effects: types.RiskEffects(
      health_gained: 0,
      points_gained: 0,
      damage_taken: 0,
      special_orbs: [],
    ),
    risk_health: 5,
    selected_marketplace_item: None,
    marketplace_selection: [],
  )
}

fn check_game_status(model: Model) -> Model {
  case model.screen {
    Testing(Gameplay) ->
      case
        model.health <= 0,
        model.points >= model.milestone,
        list.is_empty(model.bag)
      {
        True, _, _ -> Model(..model, screen: Testing(Failure))
        False, True, _ -> Model(..model, screen: Testing(Success))
        False, False, True -> Model(..model, screen: Testing(Failure))
        False, False, False -> model
      }
    Game(Playing) ->
      case
        model.health <= 0,
        model.points >= model.milestone,
        list.is_empty(model.bag)
      {
        True, _, _ -> Model(..model, screen: Game(Defeat))
        False, True, _ ->
          case model.level == 5 {
            True -> Model(..model, screen: Game(GameComplete))
            False -> Model(..model, screen: Game(Victory))
          }
        False, False, True -> Model(..model, screen: Game(Defeat))
        False, False, False -> model
      }
    _ -> model
  }
}

fn handle_choose_orb(model: Model, choice_index: Int) -> Model {
  case model.screen, model.choice_orb_1, model.choice_orb_2 {
    Game(Choosing), Some(first_choice), Some(second_choice) -> {
      let chosen_orb = case choice_index {
        0 -> first_choice
        _ -> second_choice
      }
      let unchosen_orb = case choice_index {
        0 -> second_choice
        _ -> first_choice
      }

      // Put the unchosen orb back to the end of the bag
      let new_bag = list.append(model.bag, [unchosen_orb])

      // Clear choice state and set up to process the chosen orb
      let temp_model =
        Model(
          ..model,
          bag: [chosen_orb, ..new_bag],
          screen: Game(Playing),
          choice_orb_1: None,
          choice_orb_2: None,
        )

      // Process the chosen orb (this handles ChoiceOrb -> ChoiceOrb chains naturally)
      handle_pull_orb(temp_model)
    }
    Testing(TestingChoosing), Some(first_choice), Some(second_choice) -> {
      let chosen_orb = case choice_index {
        0 -> first_choice
        _ -> second_choice
      }
      let unchosen_orb = case choice_index {
        0 -> second_choice
        _ -> first_choice
      }

      // Put the unchosen orb back to the end of the bag
      let new_bag = list.append(model.bag, [unchosen_orb])

      // Clear choice state and set up to process the chosen orb
      let temp_model =
        Model(
          ..model,
          bag: [chosen_orb, ..new_bag],
          screen: Testing(Gameplay),
          choice_orb_1: None,
          choice_orb_2: None,
        )

      // Process the chosen orb (this handles ChoiceOrb -> ChoiceOrb chains naturally)
      handle_pull_orb(temp_model)
    }
    _, _, _ -> model
  }
}

fn handle_toggle_dev_mode(model: Model) -> Model {
  Model(..model, dev_mode: !model.dev_mode)
}

fn handle_risk_orb_activation(model: Model) -> Model {
  // Transition to risk accept screen
  let screen = case model.screen {
    Game(Playing) -> Game(RiskAccept)
    Testing(Gameplay) -> Testing(TestingRiskAccept)
    _ -> model.screen
  }
  Model(..model, screen: screen)
}

fn handle_accept_risk(model: Model, accept: Bool) -> Model {
  case accept {
    False -> {
      // Decline risk - just consume orb and continue
      case model.screen {
        Game(RiskAccept) ->
          check_game_status(Model(..model, screen: Game(Playing)))
        Testing(TestingRiskAccept) ->
          check_game_status(Model(..model, screen: Testing(Gameplay)))
        _ -> model
      }
    }
    True -> {
      // Accept risk - pull 5 orbs and transition to reveal
      case list.length(model.bag) >= 5 {
        True -> {
          let risk_orbs = list.take(model.bag, 5)
          let remaining_bag = list.drop(model.bag, 5)
          let screen = case model.screen {
            Game(RiskAccept) -> Game(RiskReveal)
            Testing(TestingRiskAccept) -> Testing(TestingRiskReveal)
            _ -> model.screen
          }
          Model(
            ..model,
            screen: screen,
            bag: remaining_bag,
            risk_orbs: risk_orbs,
            risk_original_orbs: risk_orbs,
            risk_health: model.health,
            risk_accumulated_effects: types.RiskEffects(
              health_gained: 0,
              points_gained: 0,
              damage_taken: 0,
              special_orbs: [],
            ),
            risk_pulled_orbs: [],
          )
        }
        False -> {
          // Not enough orbs - treat as decline
          handle_accept_risk(model, False)
        }
      }
    }
  }
}

fn handle_accept_fate(model: Model) -> Model {
  // Transition from reveal to playing the risk mini-game
  let screen = case model.screen {
    Game(RiskReveal) -> Game(RiskPlaying)
    Testing(TestingRiskReveal) -> Testing(TestingRiskPlaying)
    _ -> model.screen
  }
  Model(..model, screen: screen)
}

fn handle_pull_risk_orb(model: Model) -> Model {
  case model.risk_orbs {
    [] -> {
      // This should never happen now since we transition automatically
      // when the last orb is processed, but keep as safety fallback
      model
    }
    [first_orb, ..rest] -> {
      // Just accumulate the orb effects without applying health changes yet
      let #(new_effects, orb_message) =
        accumulate_risk_orb(
          first_orb,
          model.risk_accumulated_effects,
          model.active_statuses,
        )

      // Continue with next orb or transition if complete
      let updated_model =
        Model(
          ..model,
          risk_orbs: rest,
          risk_pulled_orbs: [first_orb, ..model.risk_pulled_orbs],
          risk_accumulated_effects: new_effects,
          last_orb: Some(first_orb),
          last_orb_message: Some(orb_message),
        )

      // Check if we've completed all orbs and transition to survival screen
      case list.is_empty(rest) {
        True -> {
          let screen = case model.screen {
            Game(RiskPlaying) -> Game(RiskSurvived)
            Testing(TestingRiskPlaying) -> Testing(TestingRiskSurvived)
            _ -> model.screen
          }
          Model(..updated_model, screen: screen)
        }
        False -> updated_model
      }
    }
  }
}

fn handle_apply_risk_effects(model: Model) -> Model {
  let effects = model.risk_accumulated_effects

  // Calculate total health change from all accumulated effects
  let total_health_change = effects.health_gained - effects.damage_taken
  let final_health = model.health + total_health_change

  // Check if player survived the risk
  case final_health <= 0 {
    True -> {
      // Player risked out - show special death screen
      let death_screen = case model.screen {
        Game(RiskSurvived) -> Game(RiskDied)
        Testing(TestingRiskSurvived) -> Testing(TestingRiskDied)
        _ -> model.screen
      }
      Model(..model, screen: death_screen, health: final_health)
    }
    False -> {
      // Player survived - apply all effects and show consumption success
      let capped_health = int.min(final_health, 5)
      let new_points = model.points + effects.points_gained

      // Apply special orbs
      let model_with_special =
        list.fold(effects.special_orbs, model, fn(acc_model, special_orb) {
          case special_orb {
            MultiplierOrb(multiplier) -> {
              let current_multiplier =
                status.get_point_multiplier(acc_model.active_statuses)
              let new_multiplier = current_multiplier *. multiplier
              acc_model
              |> status.add_status(status.create_point_multiplier(
                new_multiplier,
              ))
            }
            BombImmunityOrb -> {
              acc_model
              |> status.add_status(status.create_bomb_immunity(3))
              |> fn(m) { Model(..m, bomb_immunity: 3) }
            }
            _ -> acc_model
          }
        })

      // Show consumption success screen first
      let consumption_screen = case model.screen {
        Game(RiskSurvived) -> Game(RiskConsumed)
        Testing(TestingRiskSurvived) -> Testing(TestingRiskConsumed)
        _ -> model.screen
      }

      // Apply effects and add risk orbs to main extraction log
      Model(
        ..model_with_special,
        health: capped_health,
        points: new_points,
        screen: consumption_screen,
        pulled_orbs: list.append(model.pulled_orbs, model.risk_pulled_orbs),
      )
    }
  }
}

fn handle_continue_after_risk_consumption(model: Model) -> Model {
  // Clear risk state and determine final outcome
  let clean_model =
    Model(
      ..model,
      risk_orbs: [],
      risk_original_orbs: [],
      risk_pulled_orbs: [],
      risk_accumulated_effects: types.RiskEffects(
        health_gained: 0,
        points_gained: 0,
        damage_taken: 0,
        special_orbs: [],
      ),
      risk_health: 5,
    )

  // Check if player won or lost and transition accordingly
  case model.screen {
    Game(RiskConsumed) ->
      check_game_status(Model(..clean_model, screen: Game(Playing)))
    Testing(TestingRiskConsumed) ->
      check_game_status(Model(..clean_model, screen: Testing(Gameplay)))
    _ -> clean_model
  }
}

fn handle_exit_risk(model: Model) -> Model {
  // Clear risk state and return to main game
  Model(
    ..model,
    screen: Game(Playing),
    risk_orbs: [],
    risk_pulled_orbs: [],
    risk_accumulated_effects: types.RiskEffects(
      health_gained: 0,
      points_gained: 0,
      damage_taken: 0,
      special_orbs: [],
    ),
    risk_health: 5,
    selected_marketplace_item: None,
    marketplace_selection: model.marketplace_selection,
  )
}

// Helper function to accumulate risk orb effects without applying health changes
fn accumulate_risk_orb(
  orb: Orb,
  current_effects: types.RiskEffects,
  active_statuses: List(types.StatusEffect),
) -> #(types.RiskEffects, String) {
  case orb {
    PointOrb(value) -> {
      let multiplier = status.get_point_multiplier(active_statuses)
      let risk_bonus_points =
        float.truncate(int.to_float(value * 2) *. multiplier)
      let new_effects =
        types.RiskEffects(
          ..current_effects,
          points_gained: current_effects.points_gained + risk_bonus_points,
        )
      #(
        new_effects,
        "● RISK DATA ACQUIRED +" <> int.to_string(risk_bonus_points),
      )
    }
    BombOrb(value) -> {
      case status.has_bomb_immunity(active_statuses) {
        True -> #(current_effects, "◈ SHIELD PROTECTED FROM HAZARD")
        False -> {
          let new_effects =
            types.RiskEffects(
              ..current_effects,
              damage_taken: current_effects.damage_taken + value,
            )
          #(new_effects, "○ HAZARD DAMAGE -" <> int.to_string(value))
        }
      }
    }
    HealthOrb(value) -> {
      let new_effects =
        types.RiskEffects(
          ..current_effects,
          health_gained: current_effects.health_gained + value,
        )
      #(new_effects, "◇ EMERGENCY SYSTEMS +" <> int.to_string(value))
    }
    special_orb -> {
      let new_effects =
        types.RiskEffects(..current_effects, special_orbs: [
          special_orb,
          ..current_effects.special_orbs
        ])
      #(new_effects, display.orb_result_message(special_orb))
    }
  }
}

// Test function to jump directly to GameComplete screen
fn handle_test_game_complete(model: Model) -> Model {
  Model(
    ..model,
    screen: Game(GameComplete),
    level: 5,
    points: 66,
    milestone: 66,
    health: 3,
  )
}

// Transition to marketplace after completing a level
fn handle_go_to_marketplace(model: Model) -> Model {
  Model(
    ..model,
    screen: Game(Marketplace),
    credits: model.credits + model.points,
    marketplace_selection: generate_marketplace_selection(),
  )
}

// Continue from marketplace to next level
fn handle_continue_to_next_level(model: Model) -> Model {
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnLevel)
  let new_level = model.level + 1
  let new_milestone = get_milestone_for_level(new_level)
  Model(
    ..clean_model,
    health: 5,
    points: 0,
    level: new_level,
    milestone: new_milestone,
    bag: get_full_bag(clean_model.purchased_orbs),
    selected_marketplace_item: None,
    screen: Game(Playing),
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
    point_multiplier: 1,
    bomb_immunity: 0,
  )
}

// Select item in marketplace for detailed view
fn handle_select_marketplace_item(model: Model, item_index: Int) -> Model {
  Model(..model, selected_marketplace_item: Some(item_index))
}

// Purchase currently selected item from marketplace
fn handle_purchase_item(model: Model, _item_index: Int) -> Model {
  case model.selected_marketplace_item {
    Some(selected_index) -> {
      case get_item_at_index(model.marketplace_selection, selected_index) {
        Some(item) ->
          case model.credits >= item.price {
            True ->
              Model(
                ..model,
                credits: model.credits - item.price,
                purchased_orbs: [item.orb, ..model.purchased_orbs],
              )
            False -> model
          }
        None -> model
      }
    }
    None -> model
  }
}

// Helper function to get item at index
fn get_item_at_index(
  items: List(types.MarketplaceItem),
  index: Int,
) -> option.Option(types.MarketplaceItem) {
  list.drop(items, index)
  |> list.first
  |> option.from_result
}
