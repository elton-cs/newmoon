import gleam/float
import gleam/int
import gleam/list
import types.{
  type Model, type StatusDuration, type StatusEffect, type StatusPersistence,
  BombImmunity, ClearOnLevel, Countdown, Model, NextPointMultiplier, Permanent,
  PointMultiplier, Triggered,
}

pub fn create_point_multiplier(multiplier: Float) -> StatusEffect {
  PointMultiplier(multiplier, Permanent)
}

pub fn create_next_point_multiplier(multiplier: Float) -> StatusEffect {
  NextPointMultiplier(multiplier)
}

pub fn create_bomb_immunity(turns: Int) -> StatusEffect {
  BombImmunity(Countdown(turns))
}

pub fn add_status(model: Model, new_status: StatusEffect) -> Model {
  let updated_statuses = case
    find_existing_status(model.active_statuses, new_status)
  {
    Ok(existing_index) ->
      case get_status_stacking_behavior(new_status) {
        Replace -> replace_at(model.active_statuses, existing_index, new_status)
        Add ->
          combine_statuses(model.active_statuses, existing_index, new_status)
      }
    Error(Nil) -> [new_status, ..model.active_statuses]
  }
  Model(..model, active_statuses: updated_statuses)
}

pub fn tick_statuses(model: Model) -> Model {
  let updated_statuses =
    model.active_statuses
    |> list.map(decrement_status_duration)
    |> list.filter(is_status_active)
  Model(..model, active_statuses: updated_statuses)
}

pub fn clear_statuses_by_persistence(
  model: Model,
  persistence: StatusPersistence,
) -> Model {
  let remaining_statuses =
    list.filter(model.active_statuses, fn(status) {
      get_status_persistence(status) != persistence
    })
  Model(..model, active_statuses: remaining_statuses)
}

pub fn get_point_multiplier(statuses: List(StatusEffect)) -> Float {
  case
    list.find(statuses, fn(status) {
      case status {
        PointMultiplier(_, _) -> True
        _ -> False
      }
    })
  {
    Ok(PointMultiplier(multiplier, _)) -> multiplier
    _ -> 1.0
  }
}

pub fn has_next_point_multiplier(statuses: List(StatusEffect)) -> Bool {
  list.any(statuses, fn(status) {
    case status {
      NextPointMultiplier(_) -> True
      _ -> False
    }
  })
}

pub fn get_next_point_multiplier(statuses: List(StatusEffect)) -> Float {
  case
    list.find(statuses, fn(status) {
      case status {
        NextPointMultiplier(_) -> True
        _ -> False
      }
    })
  {
    Ok(NextPointMultiplier(multiplier)) -> multiplier
    _ -> 1.0
  }
}

pub fn consume_next_point_multiplier(model: Model) -> Model {
  let remaining_statuses =
    list.filter(model.active_statuses, fn(status) {
      case status {
        NextPointMultiplier(_) -> False
        _ -> True
      }
    })
  Model(..model, active_statuses: remaining_statuses)
}

pub fn has_bomb_immunity(statuses: List(StatusEffect)) -> Bool {
  list.any(statuses, fn(status) {
    case status {
      BombImmunity(_) -> True
      _ -> False
    }
  })
}

pub fn get_bomb_immunity_remaining(statuses: List(StatusEffect)) -> Int {
  case
    list.find(statuses, fn(status) {
      case status {
        BombImmunity(_) -> True
        _ -> False
      }
    })
  {
    Ok(BombImmunity(Countdown(remaining))) -> remaining
    _ -> 0
  }
}

fn find_existing_status(
  statuses: List(StatusEffect),
  new_status: StatusEffect,
) -> Result(Int, Nil) {
  list.index_fold(statuses, Error(Nil), fn(acc, status, index) {
    case acc {
      Ok(_) -> acc
      Error(_) ->
        case is_same_status_type(status, new_status) {
          True -> Ok(index)
          False -> Error(Nil)
        }
    }
  })
}

fn is_same_status_type(status1: StatusEffect, status2: StatusEffect) -> Bool {
  case status1, status2 {
    PointMultiplier(_, _), PointMultiplier(_, _) -> True
    NextPointMultiplier(_), NextPointMultiplier(_) -> True
    BombImmunity(_), BombImmunity(_) -> True
    _, _ -> False
  }
}

type StackingBehavior {
  Replace
  Add
}

fn get_status_stacking_behavior(status: StatusEffect) -> StackingBehavior {
  case status {
    PointMultiplier(_, _) -> Replace
    NextPointMultiplier(_) -> Replace
    BombImmunity(_) -> Add
  }
}

fn combine_statuses(
  statuses: List(StatusEffect),
  index: Int,
  new_status: StatusEffect,
) -> List(StatusEffect) {
  case at(statuses, index) {
    Ok(existing_status) -> {
      let combined = case existing_status, new_status {
        BombImmunity(Countdown(existing)), BombImmunity(Countdown(new)) ->
          BombImmunity(Countdown(existing + new))
        _, _ -> new_status
      }
      replace_at(statuses, index, combined)
    }
    Error(Nil) -> statuses
  }
}

fn get_status_persistence(status: StatusEffect) -> StatusPersistence {
  case status {
    PointMultiplier(_, _) -> ClearOnLevel
    NextPointMultiplier(_) -> ClearOnLevel
    BombImmunity(_) -> ClearOnLevel
  }
}

fn decrement_status_duration(status: StatusEffect) -> StatusEffect {
  case status {
    PointMultiplier(multiplier, duration) ->
      PointMultiplier(multiplier, decrement_duration(duration))
    NextPointMultiplier(multiplier) -> NextPointMultiplier(multiplier)
    BombImmunity(duration) -> BombImmunity(decrement_duration(duration))
  }
}

fn decrement_duration(duration: StatusDuration) -> StatusDuration {
  case duration {
    Permanent -> Permanent
    Countdown(n) if n > 0 -> Countdown(n - 1)
    Countdown(_) -> Countdown(0)
    Triggered(n) -> Triggered(n)
  }
}

fn is_status_active(status: StatusEffect) -> Bool {
  case status {
    PointMultiplier(_, Permanent) -> True
    PointMultiplier(_, Countdown(n)) -> n > 0
    NextPointMultiplier(_) -> True
    BombImmunity(Countdown(n)) -> n > 0
    _ -> True
  }
}

pub fn status_to_display_text(status: StatusEffect) -> String {
  case status {
    PointMultiplier(multiplier, _) ->
      "◈ SIGNAL AMPLIFIER ×" <> float.to_string(multiplier)
    NextPointMultiplier(multiplier) ->
      "◈ NEXT POINT AMPLIFIER ×" <> float.to_string(multiplier)
    BombImmunity(Countdown(remaining)) ->
      "◈ HAZARD SHIELD ACTIVE (" <> int.to_string(remaining) <> " remaining)"
    BombImmunity(Permanent) -> "◈ HAZARD SHIELD PERMANENT"
    _ -> ""
  }
}

fn at(list: List(a), index: Int) -> Result(a, Nil) {
  case index >= 0 {
    True -> at_helper(list, index)
    False -> Error(Nil)
  }
}

fn at_helper(list: List(a), index: Int) -> Result(a, Nil) {
  case list, index {
    [first, ..], 0 -> Ok(first)
    [_, ..rest], n -> at_helper(rest, n - 1)
    [], _ -> Error(Nil)
  }
}

fn replace_at(list: List(a), index: Int, new_item: a) -> List(a) {
  case index >= 0 {
    True -> replace_at_helper(list, index, new_item, 0)
    False -> list
  }
}

fn replace_at_helper(
  list: List(a),
  target_index: Int,
  new_item: a,
  current_index: Int,
) -> List(a) {
  case list {
    [] -> []
    [_, ..rest] if current_index == target_index -> [new_item, ..rest]
    [first, ..rest] -> [
      first,
      ..replace_at_helper(rest, target_index, new_item, current_index + 1)
    ]
  }
}
