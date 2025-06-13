import display
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import status
import types.{
  type Model, type Msg, type Orb, type OrbType, AcceptFate, AcceptRisk,
  AllCollectorOrb, AllCollectorSample, ApplyRiskEffects, BackToMainMenu,
  BackToOrbTesting, BombImmunityOrb, BombImmunitySample, BombOrb,
  BombSurvivorOrb, BombSurvivorSample, ChoiceOrb, ChoiceSample, ChooseOrb,
  Choosing, ClearOnGame, ClearOnLevel, ConfirmOrbValue, DataSample, Defeat,
  ExitRisk, ExitTesting, Failure, Game, Gameplay, GoToOrbTesting, HazardSample,
  HealthOrb, HealthSample, Main, Menu, Model, MultiplierOrb, MultiplierSample,
  NextLevel, OrbSelection, Playing, PointCollectorOrb, PointCollectorSample,
  PointOrb, PullOrb, PullRiskOrb, ResetTesting, RestartGame, RiskAccept,
  RiskDied, RiskOrb, RiskPlaying, RiskReveal, RiskSample, RiskSurvived,
  SelectOrbType, StartGame, StartTestingWithBothStatuses,
  StartTestingWithTripleChoice, Success, Testing, TestingChoosing,
  TestingRiskAccept, TestingRiskDied, TestingRiskPlaying, TestingRiskReveal,
  TestingRiskSurvived, ToggleDevMode, UpdateInputValue, ValueConfiguration,
  Victory,
}

pub fn init(_) -> Model {
  Model(
    health: 5,
    points: 0,
    level: 1,
    milestone: 5,
    bag: starter_orbs(),
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
    risk_pulled_orbs: [],
    risk_accumulated_effects: types.RiskEffects(
      health_gained: 0,
      points_gained: 0,
      special_orbs: [],
    ),
    risk_health: 5,
  )
}

// Single consistent orb bag used for all levels
fn starter_orbs() -> List(Orb) {
  let point_orbs = [
    PointOrb(1),
    PointOrb(1),
    PointOrb(2),
    PointOrb(2),
    PointOrb(3),
  ]
  let bomb_orbs = [BombOrb(1), BombOrb(1), BombOrb(2), BombOrb(2), BombOrb(3)]
  let health_orbs = [HealthOrb(1), HealthOrb(2)]
  let collector_orbs = [
    AllCollectorOrb,
    PointCollectorOrb,
    BombSurvivorOrb,
    MultiplierOrb,
    BombImmunityOrb,
    ChoiceOrb,
    RiskOrb,
  ]

  point_orbs
  |> list.append(bomb_orbs)
  |> list.append(health_orbs)
  |> list.append(collector_orbs)
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
    ChooseOrb(choice_index) -> handle_choose_orb(model, choice_index)
    PullOrb -> handle_pull_orb(model)
    NextLevel -> handle_next_level(model)
    RestartGame -> init(Nil)
    ResetTesting -> handle_reset_testing(model)
    ExitTesting -> handle_exit_testing(model)
    ToggleDevMode -> handle_toggle_dev_mode(model)
    AcceptRisk(accept) -> handle_accept_risk(model, accept)
    AcceptFate -> handle_accept_fate(model)
    PullRiskOrb -> handle_pull_risk_orb(model)
    ApplyRiskEffects -> handle_apply_risk_effects(model)
    ExitRisk -> handle_exit_risk(model)
  }
}

fn handle_start_game(model: Model) -> Model {
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnGame)
  Model(
    ..clean_model,
    screen: Game(Playing),
    bag: starter_orbs(),
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
  case int.parse(model.input_value) {
    Ok(value) if value > 0 -> {
      let test_orb = case orb_type {
        DataSample -> PointOrb(value)
        HazardSample -> BombOrb(value)
        HealthSample -> HealthOrb(value)
        MultiplierSample -> MultiplierOrb
        AllCollectorSample -> AllCollectorOrb
        PointCollectorSample -> PointCollectorOrb
        BombSurvivorSample -> BombSurvivorOrb
        BombImmunitySample -> BombImmunityOrb
        ChoiceSample -> ChoiceOrb
        RiskSample -> RiskOrb
      }
      let clean_model = status.clear_statuses_by_persistence(model, ClearOnGame)
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
      )
    }
    _ -> model
    // Invalid input, stay on current screen
  }
}

fn handle_back_to_orb_testing(model: Model) -> Model {
  Model(..model, screen: Testing(OrbSelection))
}

fn handle_start_testing_with_both_statuses(model: Model) -> Model {
  let test_bag = [MultiplierOrb, BombImmunityOrb] |> list.append(starter_orbs())
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

fn handle_pull_orb(model: Model) -> Model {
  case model.screen {
    Game(Playing) | Testing(Gameplay) -> {
      case model.bag {
        [] -> check_game_status(model)
        [first_orb, ..rest] -> {
          let #(new_model, orb_message, return_orb_to_bag) = case first_orb {
            PointOrb(value) -> {
              let multiplier =
                status.get_point_multiplier(model.active_statuses)
              let points = value * multiplier
              let new_model = Model(..model, points: model.points + points)
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
            AllCollectorOrb -> {
              let multiplier =
                status.get_point_multiplier(model.active_statuses)
              let bonus_points = list.length(rest) * multiplier
              let new_model =
                Model(..model, points: model.points + bonus_points)
              let message =
                display.collector_result_message(first_orb, bonus_points)
              #(new_model, message, False)
            }
            PointCollectorOrb -> {
              let multiplier =
                status.get_point_multiplier(model.active_statuses)
              let bonus_points = count_point_orbs(rest) * multiplier
              let new_model =
                Model(..model, points: model.points + bonus_points)
              let message =
                display.collector_result_message(first_orb, bonus_points)
              #(new_model, message, False)
            }
            BombSurvivorOrb -> {
              let multiplier =
                status.get_point_multiplier(model.active_statuses)
              let bonus_points =
                count_pulled_bomb_orbs(model.pulled_orbs) * multiplier
              let new_model =
                Model(..model, points: model.points + bonus_points)
              let message =
                display.collector_result_message(first_orb, bonus_points)
              #(new_model, message, False)
            }
            MultiplierOrb -> {
              let new_multiplier = model.point_multiplier * 2
              let new_model =
                model
                |> status.add_status(status.create_point_multiplier(
                  new_multiplier,
                ))
                |> fn(m) { Model(..m, point_multiplier: new_multiplier) }
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
          }

          let new_bag = case return_orb_to_bag {
            True -> list.append(rest, [first_orb])
            False -> rest
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

fn handle_next_level(model: Model) -> Model {
  let clean_model = status.clear_statuses_by_persistence(model, ClearOnLevel)
  Model(
    ..clean_model,
    health: 5,
    points: 0,
    level: model.level + 1,
    milestone: model.milestone + 2,
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

fn handle_exit_testing(_model: Model) -> Model {
  init(Nil)
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
        False, True, _ -> Model(..model, screen: Game(Victory))
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
            risk_health: model.health,
            risk_accumulated_effects: types.RiskEffects(
              health_gained: 0,
              points_gained: 0,
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
      let #(new_risk_health, new_effects, orb_message) =
        process_risk_orb(
          first_orb,
          model.risk_health,
          model.risk_accumulated_effects,
          model.active_statuses,
        )

      case new_risk_health <= 0 {
        True -> {
          // Player died during risk
          Model(
            ..model,
            risk_health: new_risk_health,
            last_orb: Some(first_orb),
            last_orb_message: Some(orb_message),
            screen: case model.screen {
              Game(RiskPlaying) -> Game(RiskDied)
              Testing(TestingRiskPlaying) -> Testing(TestingRiskDied)
              _ -> model.screen
            },
          )
        }
        False -> {
          // Continue with next orb or transition if complete
          let updated_model =
            Model(
              ..model,
              risk_orbs: rest,
              risk_pulled_orbs: [first_orb, ..model.risk_pulled_orbs],
              risk_health: new_risk_health,
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
  }
}

fn handle_apply_risk_effects(model: Model) -> Model {
  let effects = model.risk_accumulated_effects
  let new_health = int.min(model.health + effects.health_gained, 5)
  let new_points = model.points + effects.points_gained

  // Apply special orbs
  let model_with_special =
    list.fold(effects.special_orbs, model, fn(acc_model, special_orb) {
      case special_orb {
        MultiplierOrb -> {
          let new_multiplier = acc_model.point_multiplier * 2
          acc_model
          |> status.add_status(status.create_point_multiplier(new_multiplier))
          |> fn(m) { Model(..m, point_multiplier: new_multiplier) }
        }
        BombImmunityOrb -> {
          acc_model
          |> status.add_status(status.create_bomb_immunity(3))
          |> fn(m) { Model(..m, bomb_immunity: 3) }
        }
        _ -> acc_model
      }
    })

  // Determine return screen and clear risk state
  let return_screen = case model.screen {
    Game(RiskSurvived) -> Game(Playing)
    Testing(TestingRiskSurvived) -> Testing(Gameplay)
    _ -> model.screen
  }

  Model(
    ..model_with_special,
    health: new_health,
    points: new_points,
    screen: return_screen,
    risk_orbs: [],
    risk_pulled_orbs: [],
    risk_accumulated_effects: types.RiskEffects(
      health_gained: 0,
      points_gained: 0,
      special_orbs: [],
    ),
    risk_health: 5,
  )
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
      special_orbs: [],
    ),
    risk_health: 5,
  )
}

// Helper function to process individual risk orbs
fn process_risk_orb(
  orb: Orb,
  current_health: Int,
  current_effects: types.RiskEffects,
  active_statuses: List(types.StatusEffect),
) -> #(Int, types.RiskEffects, String) {
  case orb {
    PointOrb(value) -> {
      let multiplier = status.get_point_multiplier(active_statuses)
      let risk_bonus_points = value * 2 * multiplier
      let new_effects =
        types.RiskEffects(
          ..current_effects,
          points_gained: current_effects.points_gained + risk_bonus_points,
        )
      #(
        current_health,
        new_effects,
        "● RISK DATA ACQUIRED +" <> int.to_string(risk_bonus_points),
      )
    }
    BombOrb(value) -> {
      case status.has_bomb_immunity(active_statuses) {
        True -> #(
          current_health,
          current_effects,
          "◈ SHIELD PROTECTED FROM HAZARD",
        )
        False -> {
          let new_health = current_health - value
          #(
            new_health,
            current_effects,
            "○ HAZARD DAMAGE -" <> int.to_string(value),
          )
        }
      }
    }
    HealthOrb(value) -> {
      let health_to_add = int.min(value, 5 - current_health)
      let new_health = current_health + health_to_add
      let new_effects =
        types.RiskEffects(
          ..current_effects,
          health_gained: current_effects.health_gained + health_to_add,
        )
      #(
        new_health,
        new_effects,
        "◇ EMERGENCY SYSTEMS +" <> int.to_string(health_to_add),
      )
    }
    special_orb -> {
      let new_effects =
        types.RiskEffects(..current_effects, special_orbs: [
          special_orb,
          ..current_effects.special_orbs
        ])
      #(current_health, new_effects, display.orb_result_message(special_orb))
    }
  }
}
