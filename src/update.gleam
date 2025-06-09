import gleam/int
import gleam/list
import gleam/option.{None, Some}
import types.{
  type Model, type Msg, type Orb, type OrbType, BackToMainMenu, BackToOrbTesting,
  BombOrb, ConfirmOrbValue, DataSample, Defeat, ExitTesting, Failure, Game,
  Gameplay, GoToOrbTesting, HazardSample, HealthOrb, HealthSample, Main, Menu,
  Model, NextLevel, OrbSelection, Playing, PointOrb, PullOrb, ResetTesting,
  RestartGame, SelectOrbType, StartGame, Success, Testing, UpdateInputValue,
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
    input_value: "",
  )
}

// Single consistent orb bag used for all levels
fn starter_orbs() -> List(Orb) {
  [PointOrb(1), BombOrb(2), HealthOrb(3)]
}

// Test bag that includes the test orb plus the standard starter orbs
fn create_test_bag(test_orb: Orb) -> List(Orb) {
  [test_orb] |> list.append(starter_orbs())
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
      }
      Model(
        ..model,
        screen: Testing(Gameplay),
        bag: create_test_bag(test_orb),
        health: 5,
        points: 0,
        last_orb: None,
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
          let new_model = case first_orb {
            PointOrb(value) -> Model(..model, points: model.points + value)
            BombOrb(value) -> Model(..model, health: model.health - value)
            HealthOrb(value) -> {
              let new_health = int.min(model.health + value, 5)
              Model(..model, health: new_health)
            }
          }

          let updated_model =
            Model(..new_model, bag: rest, last_orb: Some(first_orb))

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
    input_value: model.input_value,
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
