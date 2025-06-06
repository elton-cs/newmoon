import gleam/int
import gleam/list
import gleam/option
import types.{type Model, type Orb, Bomb, Collector, Health, Multiplier, Point, Survivor, Choice, ChoosingOrb}

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
    Choice -> "◆ CHOICE PROTOCOL ACTIVATED [SELECT OPTIMAL SAMPLE]"
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
    Choice -> handle_choice_orb(model)
  }
}

// Helper function to handle Choice orb logic
fn handle_choice_orb(model: Model) -> Model {
  case model.bag {
    // Empty bag - no effect
    [] -> model
    
    // Single orb - duplicate it for choice UI
    [single_orb] -> 
      types.Model(
        ..model,
        status: ChoosingOrb,
        pending_choice: option.Some(#(single_orb, single_orb)),
        bag: [],
      )
    
    // Multiple orbs - draw 2 non-Choice orbs
    _ -> draw_two_non_choice_orbs(model, model.bag, [])
  }
}

// Recursively draw 2 non-Choice orbs, moving Choice orbs to the end
fn draw_two_non_choice_orbs(model: Model, remaining_bag: List(Orb), choice_orbs_found: List(Orb)) -> Model {
  case remaining_bag {
    [] -> 
      // Not enough non-Choice orbs, fallback to no effect
      types.Model(..model, bag: choice_orbs_found)
    
    [Choice, ..rest] ->
      // Skip Choice orb, add to end, continue drawing
      draw_two_non_choice_orbs(model, rest, list.append(choice_orbs_found, [Choice]))
    
    [first_orb, Choice, ..rest] ->
      // Found first orb, skip second Choice orb, continue for second orb
      draw_second_non_choice_orb(model, rest, [Choice], first_orb, choice_orbs_found)
    
    [first_orb, second_orb, ..rest] ->
      // Found both orbs successfully
      types.Model(
        ..model,
        status: ChoosingOrb,
        pending_choice: option.Some(#(first_orb, second_orb)),
        bag: list.append(rest, choice_orbs_found),
      )
    
    [single_orb] ->
      // Only one non-Choice orb available, duplicate it
      types.Model(
        ..model,
        status: ChoosingOrb,
        pending_choice: option.Some(#(single_orb, single_orb)),
        bag: choice_orbs_found,
      )
  }
}

// Helper to find the second non-Choice orb
fn draw_second_non_choice_orb(model: Model, remaining_bag: List(Orb), more_choice_orbs: List(Orb), first_orb: Orb, original_choice_orbs: List(Orb)) -> Model {
  case remaining_bag {
    [] ->
      // No second orb available, duplicate the first
      types.Model(
        ..model,
        status: ChoosingOrb,
        pending_choice: option.Some(#(first_orb, first_orb)),
        bag: list.append(original_choice_orbs, more_choice_orbs),
      )
    
    [Choice, ..rest] ->
      // Skip another Choice orb
      draw_second_non_choice_orb(model, rest, list.append(more_choice_orbs, [Choice]), first_orb, original_choice_orbs)
    
    [second_orb, ..rest] ->
      // Found second orb
      types.Model(
        ..model,
        status: ChoosingOrb,
        pending_choice: option.Some(#(first_orb, second_orb)),
        bag: list.append(list.append(rest, original_choice_orbs), more_choice_orbs),
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
  }
}