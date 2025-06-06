import gleam/int
import gleam/list
import types.{type Model, type Orb, Bomb, Collector, Health, Multiplier, Point, Survivor}

pub fn get_orb_result_message(orb: Orb, model: Model) -> String {
  case orb {
    Point(value) -> {
      let multiplied_value = value * model.current_multiplier
      case model.current_multiplier > 1 {
        True ->
          "● DATA PACKET ["
          <> int.to_string(value)
          <> "×"
          <> int.to_string(model.current_multiplier)
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
      let base_points = list.length(model.bag)
      let multiplied_points = base_points * model.current_multiplier
      case model.current_multiplier > 1 {
        True ->
          "◯ DEEP SCAN ["
          <> int.to_string(base_points)
          <> "×"
          <> int.to_string(model.current_multiplier)
          <> "] +"
          <> int.to_string(multiplied_points)
        False -> "◯ DEEP SCAN COMPLETE +" <> int.to_string(base_points)
      }
    }
    Survivor -> {
      let base_points = model.bombs_pulled_this_level
      let multiplied_points = base_points * model.current_multiplier
      case model.current_multiplier > 1 {
        True ->
          "◈ DAMAGE ANALYSIS ["
          <> int.to_string(base_points)
          <> "×"
          <> int.to_string(model.current_multiplier)
          <> "] +"
          <> int.to_string(multiplied_points)
        False -> "◈ DAMAGE ANALYSIS +" <> int.to_string(base_points)
      }
    }
    Multiplier ->
      "✱ SIGNAL BOOST ["
      <> int.to_string(model.current_multiplier)
      <> "× AMPLIFICATION ACTIVE]"
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
  }
}

pub fn apply_orb_effect(orb: Orb, model: Model) -> Model {
  case orb {
    Point(value) -> {
      let multiplied_points = value * model.current_multiplier
      types.Model(..model, points: model.points + multiplied_points)
    }
    Bomb(damage) ->
      types.Model(
        ..model,
        health: model.health - damage,
        bombs_pulled_this_level: model.bombs_pulled_this_level + 1,
      )
    Health(value) -> {
      let new_health = int.min(5, model.health + value)
      types.Model(..model, health: new_health)
    }
    Collector -> {
      let remaining_orbs = list.length(model.bag) - 1
      let collector_points = remaining_orbs * model.current_multiplier
      types.Model(..model, points: model.points + collector_points)
    }
    Survivor -> {
      let survivor_points = model.bombs_pulled_this_level * model.current_multiplier
      types.Model(..model, points: model.points + survivor_points)
    }
    Multiplier -> {
      let new_multiplier = model.current_multiplier * 2
      types.Model(..model, current_multiplier: new_multiplier)
    }
  }
}

pub fn get_orb_name(orb: Orb) -> String {
  case orb {
    Point(value) -> "Point Orb (+" <> int.to_string(value) <> ")"
    Bomb(damage) -> "Bomb Orb (-" <> int.to_string(damage) <> " health)"
    Health(value) -> "Health Orb (+" <> int.to_string(value) <> " health)"
    Collector -> "Collector Orb"
    Survivor -> "Survivor Orb"
    Multiplier -> "Multiplier Orb"
  }
}