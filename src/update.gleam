import display
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import types.{
  type Model, type Msg, type Orb, type OrbType, AllCollectorOrb,
  AllCollectorSample, BackToMainMenu, BackToOrbTesting, BombOrb, BombSurvivorOrb,
  BombSurvivorSample, ConfirmOrbValue, DataSample, Defeat, ExitTesting, Failure,
  Game, Gameplay, GoToOrbTesting, HazardSample, HealthOrb, HealthSample, Main,
  Menu, Model, NextLevel, OrbSelection, Playing, PointCollectorOrb,
  PointCollectorSample, PointOrb, PullOrb, ResetTesting, RestartGame,
  SelectOrbType, StartGame, Success, Testing, UpdateInputValue,
  ValueConfiguration, Victory,
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
  let collector_orbs = [AllCollectorOrb, PointCollectorOrb, BombSurvivorOrb]
  list.append(point_orbs, bomb_orbs)
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
    PullOrb -> handle_pull_orb(model)
    NextLevel -> handle_next_level(model)
    RestartGame -> init(Nil)
    ResetTesting -> handle_reset_testing(model)
    ExitTesting -> handle_exit_testing(model)
  }
}

fn handle_start_game(model: Model) -> Model {
  Model(
    ..model,
    screen: Game(Playing),
    bag: starter_orbs(),
    health: 5,
    points: 0,
    last_orb: None,
    last_orb_message: None,
    pulled_orbs: [],
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
        AllCollectorSample -> AllCollectorOrb
        PointCollectorSample -> PointCollectorOrb
        BombSurvivorSample -> BombSurvivorOrb
      }
      Model(
        ..model,
        screen: Testing(Gameplay),
        bag: create_test_bag(test_orb),
        health: 5,
        points: 0,
        last_orb: None,
        last_orb_message: None,
        pulled_orbs: [],
      )
    }
    _ -> model
    // Invalid input, stay on current screen
  }
}

fn handle_back_to_orb_testing(model: Model) -> Model {
  Model(..model, screen: Testing(OrbSelection))
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
          let #(new_model, orb_message) = case first_orb {
            PointOrb(value) -> {
              let new_model = Model(..model, points: model.points + value)
              let message = display.orb_result_message(first_orb)
              #(new_model, message)
            }
            BombOrb(value) -> {
              let new_model = Model(..model, health: model.health - value)
              let message = display.orb_result_message(first_orb)
              #(new_model, message)
            }
            HealthOrb(value) -> {
              let new_health = int.min(model.health + value, 5)
              let new_model = Model(..model, health: new_health)
              let message = display.orb_result_message(first_orb)
              #(new_model, message)
            }
            AllCollectorOrb -> {
              let bonus_points = list.length(rest)
              let new_model =
                Model(..model, points: model.points + bonus_points)
              let message =
                display.collector_result_message(first_orb, bonus_points)
              #(new_model, message)
            }
            PointCollectorOrb -> {
              let bonus_points = count_point_orbs(rest)
              let new_model =
                Model(..model, points: model.points + bonus_points)
              let message =
                display.collector_result_message(first_orb, bonus_points)
              #(new_model, message)
            }
            BombSurvivorOrb -> {
              let bonus_points = count_pulled_bomb_orbs(model.pulled_orbs)
              let new_model =
                Model(..model, points: model.points + bonus_points)
              let message =
                display.collector_result_message(first_orb, bonus_points)
              #(new_model, message)
            }
          }

          let updated_model =
            Model(
              ..new_model,
              bag: rest,
              last_orb: Some(first_orb),
              last_orb_message: Some(orb_message),
              pulled_orbs: [first_orb, ..model.pulled_orbs],
            )

          check_game_status(updated_model)
        }
      }
    }
    _ -> model
  }
}

fn handle_next_level(model: Model) -> Model {
  Model(
    health: 5,
    points: 0,
    level: model.level + 1,
    milestone: model.milestone + 2,
    bag: starter_orbs(),
    screen: Game(Playing),
    last_orb: None,
    last_orb_message: None,
    input_value: model.input_value,
    pulled_orbs: [],
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
