import gleam/int
import gleam/list
import gleam/option
import types.{
  type Model, type Orb, Bomb, Choice, ChoosingOrb, Collector, Gamble,
  GamblingChoice, Health, Multiplier, Point, PointRecovery, PointScanner,
  Survivor,
}

pub fn get_orb_result_message(orb: Orb, model: Model) -> String {
  case orb {
    Point(value) -> {
      let multiplied_value = value * model.player.current_multiplier
      case model.player.current_multiplier > 1 {
        True ->
          "● DATA PACKET ["
          <> int.to_string(value)
          <> "×"
          <> int.to_string(model.player.current_multiplier)
          <> "] +"
          <> int.to_string(multiplied_value)
        False -> "● DATA PACKET ACQUIRED +" <> int.to_string(value)
      }
    }
    Bomb(damage) ->
      "○ HULL BREACH [SEVERITY-"
      <> int.to_string(damage)
      <> "] -"
      <> int.to_string(damage)
      <> " SYS"
    Health(value) ->
      "+ NANO-REPAIR DEPLOYED [EFFICIENCY-"
      <> int.to_string(value)
      <> "] +"
      <> int.to_string(value)
      <> " SYS"
    Collector -> {
      let base_points = model.game_state.bag |> list.length
      let multiplied_points = base_points * model.player.current_multiplier
      case model.player.current_multiplier > 1 {
        True ->
          "◯ DEEP SCAN ["
          <> int.to_string(base_points)
          <> "×"
          <> int.to_string(model.player.current_multiplier)
          <> "] +"
          <> int.to_string(multiplied_points)
        False -> "◯ DEEP SCAN COMPLETE +" <> int.to_string(base_points)
      }
    }
    Survivor -> {
      let base_points = model.player.bombs_pulled_this_level
      let multiplied_points = base_points * model.player.current_multiplier
      case model.player.current_multiplier > 1 {
        True ->
          "◈ DAMAGE ANALYSIS ["
          <> int.to_string(base_points)
          <> "×"
          <> int.to_string(model.player.current_multiplier)
          <> "] +"
          <> int.to_string(multiplied_points)
        False -> "◈ DAMAGE ANALYSIS +" <> int.to_string(base_points)
      }
    }
    Multiplier ->
      "✱ SIGNAL BOOST ["
      <> int.to_string(model.player.current_multiplier)
      <> "× AMPLIFICATION ACTIVE]"
    Choice -> "◆ CHOICE PROTOCOL ACTIVATED [SELECT OPTIMAL SAMPLE]"
    Gamble -> "🎲 GAMBLE PROTOCOL ACTIVATED [HIGH RISK/REWARD SCENARIO]"
    PointScanner -> {
      let point_orbs_count =
        model.game_state.bag
        |> list.count(fn(orb) {
          case orb {
            Point(_) -> True
            _ -> False
          }
        })
      let multiplied_points = point_orbs_count * model.player.current_multiplier
      case model.player.current_multiplier > 1 {
        True ->
          "◉ DATA SCANNER ["
          <> int.to_string(point_orbs_count)
          <> "×"
          <> int.to_string(model.player.current_multiplier)
          <> "] +"
          <> int.to_string(multiplied_points)
        False ->
          "◉ DATA SCANNER ["
          <> int.to_string(point_orbs_count)
          <> " SAMPLES] +"
          <> int.to_string(point_orbs_count)
      }
    }
    PointRecovery -> {
      case model.player.point_orbs_pulled_this_level {
        [] -> "↺ DATA RECOVERY [NO DATA SAMPLES TO RECOVER]"
        pulled_points -> {
          let min_value = pulled_points |> list.sort(int.compare) |> list.first
          case min_value {
            Ok(value) ->
              "↺ DATA RECOVERY [POINT("
              <> int.to_string(value)
              <> ") RESTORED TO CONTAINER]"
            Error(_) -> "↺ DATA RECOVERY [NO DATA SAMPLES TO RECOVER]"
          }
        }
      }
    }
  }
}

pub fn get_orb_result_color(orb: Orb) -> String {
  case orb {
    Point(_) -> "gray"
    Bomb(_) -> "default"
    Health(_) -> "green"
    Collector -> "blue"
    Survivor -> "purple"
    Multiplier -> "yellow"
    Choice -> "orange"
    Gamble -> "red"
    PointScanner -> "blue"
    PointRecovery -> "green"
  }
}

pub fn apply_orb_effect(orb: Orb, model: Model) -> Model {
  case orb {
    Point(value) -> {
      let multiplied_points = value * model.player.current_multiplier
      types.Model(
        ..model,
        player: types.Player(
          ..model.player,
          points: model.player.points + multiplied_points,
          point_orbs_pulled_this_level: [
            value,
            ..model.player.point_orbs_pulled_this_level
          ],
        ),
      )
    }
    Bomb(damage) ->
      types.Model(
        ..model,
        player: types.Player(
          ..model.player,
          health: model.player.health - damage,
          bombs_pulled_this_level: model.player.bombs_pulled_this_level + 1,
        ),
      )
    Health(value) -> {
      let new_health = int.min(5, model.player.health + value)
      types.Model(
        ..model,
        player: types.Player(..model.player, health: new_health),
      )
    }
    Collector -> {
      let remaining_orbs = { model.game_state.bag |> list.length } - 1
      let collector_points = remaining_orbs * model.player.current_multiplier
      types.Model(
        ..model,
        player: types.Player(
          ..model.player,
          points: model.player.points + collector_points,
        ),
      )
    }
    Survivor -> {
      let survivor_points =
        model.player.bombs_pulled_this_level * model.player.current_multiplier
      types.Model(
        ..model,
        player: types.Player(
          ..model.player,
          points: model.player.points + survivor_points,
        ),
      )
    }
    Multiplier -> {
      let new_multiplier = model.player.current_multiplier * 2
      types.Model(
        ..model,
        player: types.Player(..model.player, current_multiplier: new_multiplier),
      )
    }
    Choice -> handle_choice_orb(model)
    Gamble -> handle_gamble_orb(model)
    PointScanner -> {
      let point_orbs_count =
        model.game_state.bag
        |> list.count(fn(orb) {
          case orb {
            Point(_) -> True
            _ -> False
          }
        })
      let scanner_points = point_orbs_count * model.player.current_multiplier
      types.Model(
        ..model,
        player: types.Player(
          ..model.player,
          points: model.player.points + scanner_points,
        ),
      )
    }
    PointRecovery -> {
      case model.player.point_orbs_pulled_this_level {
        [] -> model
        // No point orbs to recover
        pulled_points -> {
          let min_value = pulled_points |> list.sort(int.compare) |> list.first
          case min_value {
            Ok(value) -> {
              // Add Point(value) back to bag
              let updated_bag =
                model.game_state.bag |> list.append([Point(value)])
              // Remove first occurrence of min_value from tracking list
              let updated_tracking =
                remove_first_occurrence(pulled_points, value)
              types.Model(
                ..model,
                game_state: types.GameState(
                  ..model.game_state,
                  bag: updated_bag,
                ),
                player: types.Player(
                  ..model.player,
                  point_orbs_pulled_this_level: updated_tracking,
                ),
              )
            }
            Error(_) -> model
          }
        }
      }
    }
  }
}

// Helper function to handle Gamble orb logic
fn handle_gamble_orb(model: Model) -> Model {
  types.Model(
    ..model,
    status: GamblingChoice,
    gamble_state: types.GambleState(
      ..model.gamble_state,
      pending: option.Some(True),
    ),
  )
}

// Helper function to handle Choice orb logic
fn handle_choice_orb(model: Model) -> Model {
  case model.game_state.bag {
    // Empty bag - no effect
    [] -> model

    // Single orb - duplicate it for choice UI
    [single_orb] ->
      types.Model(
        ..model,
        status: ChoosingOrb,
        game_state: types.GameState(..model.game_state, bag: []),
        choice_state: types.ChoiceState(
          pending: option.Some(#(single_orb, single_orb)),
        ),
      )

    // Multiple orbs - draw 2 non-Choice orbs
    _ -> draw_two_non_choice_orbs(model, model.game_state.bag, [])
  }
}

// Recursively draw 2 non-Choice orbs, moving Choice orbs to the end
fn draw_two_non_choice_orbs(
  model: Model,
  remaining_bag: List(Orb),
  choice_orbs_found: List(Orb),
) -> Model {
  case remaining_bag {
    [] ->
      // Not enough non-Choice orbs, fallback to no effect
      types.Model(
        ..model,
        game_state: types.GameState(..model.game_state, bag: choice_orbs_found),
      )

    [Choice, ..rest] ->
      // Skip Choice orb, add to end, continue drawing
      draw_two_non_choice_orbs(
        model,
        rest,
        choice_orbs_found |> list.append([Choice]),
      )

    [first_orb, Choice, ..rest] ->
      // Found first orb, skip second Choice orb, continue for second orb
      draw_second_non_choice_orb(
        model,
        rest,
        [Choice],
        first_orb,
        choice_orbs_found,
      )

    [first_orb, second_orb, ..rest] ->
      // Found both orbs successfully
      types.Model(
        ..model,
        status: ChoosingOrb,
        game_state: types.GameState(
          ..model.game_state,
          bag: rest |> list.append(choice_orbs_found),
        ),
        choice_state: types.ChoiceState(
          pending: option.Some(#(first_orb, second_orb)),
        ),
      )

    [single_orb] ->
      // Only one non-Choice orb available, duplicate it
      types.Model(
        ..model,
        status: ChoosingOrb,
        game_state: types.GameState(..model.game_state, bag: choice_orbs_found),
        choice_state: types.ChoiceState(
          pending: option.Some(#(single_orb, single_orb)),
        ),
      )
  }
}

// Helper to find the second non-Choice orb
fn draw_second_non_choice_orb(
  model: Model,
  remaining_bag: List(Orb),
  more_choice_orbs: List(Orb),
  first_orb: Orb,
  original_choice_orbs: List(Orb),
) -> Model {
  case remaining_bag {
    [] ->
      // No second orb available, duplicate the first
      types.Model(
        ..model,
        status: ChoosingOrb,
        game_state: types.GameState(
          ..model.game_state,
          bag: original_choice_orbs |> list.append(more_choice_orbs),
        ),
        choice_state: types.ChoiceState(
          pending: option.Some(#(first_orb, first_orb)),
        ),
      )

    [Choice, ..rest] ->
      // Skip another Choice orb
      draw_second_non_choice_orb(
        model,
        rest,
        more_choice_orbs |> list.append([Choice]),
        first_orb,
        original_choice_orbs,
      )

    [second_orb, ..rest] ->
      // Found second orb
      types.Model(
        ..model,
        status: ChoosingOrb,
        game_state: types.GameState(
          ..model.game_state,
          bag: rest
            |> list.append(original_choice_orbs)
            |> list.append(more_choice_orbs),
        ),
        choice_state: types.ChoiceState(
          pending: option.Some(#(first_orb, second_orb)),
        ),
      )
  }
}

pub fn get_orb_name(orb: Orb) -> String {
  case orb {
    Point(value) -> "Data Sample (+" <> int.to_string(value) <> ")"
    Bomb(damage) -> "Hazard Sample (-" <> int.to_string(damage) <> " health)"
    Health(value) -> "Medical Sample (+" <> int.to_string(value) <> " health)"
    Collector -> "Scanner Sample"
    Survivor -> "Analyzer Sample"
    Multiplier -> "Amplifier Sample"
    Choice -> "Choice Sample"
    Gamble -> "Gamble Sample"
    PointScanner -> "Data Scanner Sample"
    PointRecovery -> "Data Recovery Sample"
  }
}

// Helper function to remove first occurrence of a value from a list
fn remove_first_occurrence(list: List(Int), target: Int) -> List(Int) {
  case list {
    [] -> []
    [first, ..rest] -> {
      case first == target {
        True -> rest
        // Found target, return rest without it
        False -> [first, ..remove_first_occurrence(rest, target)]
      }
    }
  }
}
