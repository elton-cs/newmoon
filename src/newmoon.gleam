import gleam/option.{None}
import lustre
import level
import marketplace
import orb
import types.{type Model, type Msg, AcceptReward, BuyOrb, EnterMarketplace, InMarketplace, NextLevel, Playing, PullOrb, RestartGame, ShowingReward}
import view

pub fn main() -> Nil {
  let assert Ok(_) =
    lustre.simple(init, update, view.view) |> lustre.start("#app", Nil)

  Nil
}

fn init(_) -> Model {
  types.Model(
    health: 5,
    points: 0,
    level: 1,
    milestone: level.get_milestone_for_level(1),
    bag: level.create_level_bag(1),
    status: Playing,
    last_orb: None,
    bombs_pulled_this_level: 0,
    current_multiplier: 1,
    credits: 0,
  )
}


fn update(model: Model, msg: Msg) -> Model {
  case msg {
    PullOrb -> handle_pull_orb(model)
    NextLevel -> handle_next_level(model)
    RestartGame -> init(Nil)
    AcceptReward -> handle_accept_reward(model)
    EnterMarketplace -> handle_enter_marketplace(model)
    BuyOrb(orb) -> marketplace.purchase_orb(model, orb)
  }
}

fn handle_pull_orb(model: Model) -> Model {
  case model.status {
    Playing -> {
      case model.bag {
        [] -> model
        [first_orb, ..rest] -> {
          let new_model = orb.apply_orb_effect(first_orb, model)
          let updated_model =
            types.Model(..new_model, bag: rest, last_orb: option.Some(first_orb))
          check_game_status(updated_model)
        }
      }
    }
    _ -> model
  }
}

fn handle_next_level(model: Model) -> Model {
  let new_level = model.level + 1
  // Credits are already awarded when level completes, no need to add again
  types.Model(
    health: 5,
    points: 0,
    level: new_level,
    milestone: level.get_milestone_for_level(new_level),
    bag: level.create_level_bag(new_level),
    status: Playing,
    last_orb: None,
    bombs_pulled_this_level: 0,
    current_multiplier: 1,
    credits: model.credits,
  )
}

fn handle_accept_reward(model: Model) -> Model {
  // Credits already awarded in check_game_status, just change status to Won
  types.Model(..model, status: types.Won)
}

fn handle_enter_marketplace(model: Model) -> Model {
  // Credits already awarded when level completed, just change status
  types.Model(..model, status: InMarketplace)
}


fn check_game_status(model: Model) -> Model {
  case model.health <= 0, model.points >= model.milestone {
    True, _ -> types.Model(..model, status: types.Lost)
    False, True -> types.Model(..model, status: ShowingReward, credits: model.credits + model.points)
    False, False -> model
  }
}

