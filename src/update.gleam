import display
import gleam/float
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import status
import types.{
  type Model, type Msg, type Orb, AcceptFate, AcceptRisk, AllCollectorOrb,
  ApplyRiskEffects, BackToMainMenu, BombImmunityOrb, BombOrb, BombSurvivorOrb,
  ChoiceOrb, ChooseOrb, ClearOnGame, ClearOnLevel, ContinueAfterRiskConsumption,
  ContinueToNextLevel, Defeat, ExitRisk, Game, GameComplete, GoToMarketplace,
  HealthOrb, Main, Marketplace, Menu, Model, MultiplierOrb, NextLevel,
  NextPointMultiplierOrb, Playing, PointCollectorOrb, PointOrb, PointRecoveryOrb,
  PullOrb, PullRiskOrb, PurchaseItem, RestartGame, RiskAccept, RiskConsumed,
  RiskDied, RiskOrb, RiskPlaying, RiskReveal, RiskSurvived,
  SelectMarketplaceItem, StartGame, ToggleDevMode, Victory,
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
    BackToMainMenu -> handle_back_to_main_menu(model)
    ChooseOrb(choice_index) -> handle_choose_orb(model, choice_index)
    PullOrb -> handle_pull_orb(model)
    NextLevel -> handle_next_level(model)
    RestartGame -> handle_restart_game(model)
    ToggleDevMode -> handle_toggle_dev_mode(model)
    AcceptRisk(accept) -> handle_accept_risk(model, accept)
    AcceptFate -> handle_accept_fate(model)
    PullRiskOrb -> handle_pull_risk_orb(model)
    ApplyRiskEffects -> handle_apply_risk_effects(model)
    ContinueAfterRiskConsumption ->
      handle_continue_after_risk_consumption(model)
    ExitRisk -> handle_exit_risk(model)
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

fn handle_back_to_main_menu(model: Model) -> Model {
  Model(..model, screen: Menu(Main))
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
    Game(Playing) -> {
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

// Helper function to determine if an orb is consumable (immediate effect, no special interactions)
fn is_consumable_orb(orb: Orb) -> Bool {
  case orb {
    PointOrb(_) -> True
    BombOrb(_) -> True
    HealthOrb(_) -> True
    AllCollectorOrb(_) -> True
    PointCollectorOrb(_) -> True
    BombSurvivorOrb(_) -> True
    MultiplierOrb(_) -> True
    NextPointMultiplierOrb(_) -> True
    BombImmunityOrb -> True
    ChoiceOrb -> False
    RiskOrb -> False
    PointRecoveryOrb -> False
  }
}

fn handle_choice_orb_activation(model: Model) -> Model {
  // Filter bag for consumable orbs only, maintaining order
  let consumable_orbs = list.filter(model.bag, is_consumable_orb)

  case consumable_orbs {
    [] -> {
      // No consumable orbs available, continue with game status check
      check_game_status(model)
    }
    [single_orb] -> {
      // Only one consumable orb available, automatically process it
      // Remove it from the bag and process it
      let new_bag = list.filter(model.bag, fn(orb) { orb != single_orb })
      let temp_model = Model(..model, bag: [single_orb, ..new_bag])
      handle_pull_orb(temp_model)
    }
    [first_choice, second_choice, ..] -> {
      // Present choice between the first two consumable orbs
      // Remove chosen orbs from the bag for now (they'll be handled after choice)
      let bag_without_choices =
        list.filter(model.bag, fn(orb) {
          orb != first_choice && orb != second_choice
        })
      let choice_model =
        Model(
          ..model,
          screen: Game(Playing),
          // Stay in playing screen instead of switching to Choosing
          bag: bag_without_choices,
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

fn check_game_status(model: Model) -> Model {
  case model.screen {
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
  case model.choice_orb_1, model.choice_orb_2 {
    Some(first_choice), Some(second_choice) -> {
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
          choice_orb_1: None,
          choice_orb_2: None,
        )

      // Process the chosen orb (this handles ChoiceOrb -> ChoiceOrb chains naturally)
      handle_pull_orb(temp_model)
    }
    _, _ -> model
  }
}

fn handle_toggle_dev_mode(model: Model) -> Model {
  Model(..model, dev_mode: !model.dev_mode)
}

fn handle_risk_orb_activation(model: Model) -> Model {
  // Transition to risk accept screen
  let screen = case model.screen {
    Game(Playing) -> Game(RiskAccept)
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
