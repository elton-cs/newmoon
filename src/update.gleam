import gleam/list
import gleam/option.{None, Some}
import types.{
  type Model, type Msg, type Orb, BackToMainMenu, BombOrb, ExitTesting,
  GoToOrbTesting, Lost, MainMenu, Model, NextLevel, OrbTesting, Playing,
  PointOrb, PullOrb, ResetTesting, RestartGame, SelectTestOrb, StartGame,
  TestingMode, Won,
}

pub fn init(_) -> Model {
  Model(
    health: 5,
    points: 0,
    level: 1,
    milestone: 5,
    bag: create_bag(),
    status: MainMenu,
    last_orb: None,
  )
}

fn create_bag() -> List(Orb) {
  let point_orbs = [
    PointOrb(1),
    PointOrb(1),
    PointOrb(2),
    PointOrb(2),
    PointOrb(3),
  ]
  let bomb_orbs = [BombOrb(1), BombOrb(1), BombOrb(2), BombOrb(2), BombOrb(3)]
  list.append(point_orbs, bomb_orbs)
}

fn create_test_bag(test_orb: Orb) -> List(Orb) {
  let base_orbs = case test_orb {
    PointOrb(_) -> [PointOrb(1), PointOrb(2), PointOrb(3), PointOrb(5)]
    BombOrb(_) -> [BombOrb(1), BombOrb(2), BombOrb(3), BombOrb(4)]
  }
  [test_orb] |> list.append(base_orbs)
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    StartGame -> handle_start_game(model)
    GoToOrbTesting -> handle_go_to_orb_testing(model)
    SelectTestOrb(orb) -> handle_select_test_orb(model, orb)
    BackToMainMenu -> handle_back_to_main_menu(model)
    PullOrb -> handle_pull_orb(model)
    NextLevel -> handle_next_level(model)
    RestartGame -> init(Nil)
    ResetTesting -> handle_reset_testing(model)
    ExitTesting -> handle_exit_testing(model)
  }
}

fn handle_start_game(model: Model) -> Model {
  Model(..model, status: Playing)
}

fn handle_go_to_orb_testing(model: Model) -> Model {
  Model(..model, status: OrbTesting)
}

fn handle_select_test_orb(model: Model, orb: Orb) -> Model {
  Model(
    ..model,
    status: TestingMode,
    bag: create_test_bag(orb),
    health: 5,
    points: 0,
    last_orb: None,
  )
}

fn handle_back_to_main_menu(model: Model) -> Model {
  Model(..model, status: MainMenu)
}

fn handle_pull_orb(model: Model) -> Model {
  case model.status {
    Playing | TestingMode -> {
      case model.bag {
        [] -> model
        [first_orb, ..rest] -> {
          let new_model = case first_orb {
            PointOrb(value) -> Model(..model, points: model.points + value)
            BombOrb(value) -> Model(..model, health: model.health - value)
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
    bag: create_bag(),
    status: Playing,
    last_orb: None,
  )
}

fn handle_reset_testing(model: Model) -> Model {
  Model(..model, status: OrbTesting)
}

fn handle_exit_testing(_model: Model) -> Model {
  init(Nil)
}

fn check_game_status(model: Model) -> Model {
  case model.health <= 0, model.points >= model.milestone {
    True, _ -> Model(..model, status: Lost)
    False, True -> Model(..model, status: Won)
    False, False -> model
  }
}
