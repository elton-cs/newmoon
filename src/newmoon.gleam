import gleam/list
import gleam/int
import gleam/option
import lustre
import level
import marketplace
import orb
import simulation
import types.{type Model, type Msg, StartNewGame, ContinueGame, ShowHowToPlay, PullOrb, PauseGame, ResumeGame, NextLevel, RestartLevel, GoToMainMenu, GoToMarketplace, GoToTestingGrounds, AcceptLevelReward, BuyOrb, ToggleShuffle, ToggleDevMode, ExitTestingGrounds, AddTestOrb, RemoveTestOrb, SetTestMilestone, SetTestHealth, SetSimulationCount, StartSimulations, ViewTestResults, ResetTestConfig, MainMenu, Playing, Paused, LevelComplete, GameOver, InMarketplace, InTestingGrounds, ConfiguringTest, SelectFirstChoice, SelectSecondChoice, AcceptGamble, DeclineGamble, NextGambleOrb}
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
    status: MainMenu,
    last_orb: option.None,
    bombs_pulled_this_level: 0,
    current_multiplier: 1,
    credits: 0,
    shuffle_enabled: False,
    dev_mode: False,
    testing_config: option.None,
    testing_mode: ConfiguringTest,
    testing_stats: option.None,
    log_entries: [],
    log_sequence: 0,
    pending_choice: option.None,
    pending_gamble: option.None,
    gamble_orbs: [],
    gamble_current_index: 0,
  )
}


fn update(model: Model, msg: Msg) -> Model {
  case msg {
    // Main Menu Navigation
    StartNewGame -> start_new_game()
    ContinueGame -> types.Model(..model, status: Playing)
    ShowHowToPlay -> model // TODO: Implement help screen
    
    // Gameplay Actions
    PullOrb -> handle_pull_orb(model)
    PauseGame -> types.Model(..model, status: Paused)
    ResumeGame -> types.Model(..model, status: Playing)
    
    // Level Progression
    NextLevel -> handle_next_level(model)
    RestartLevel -> restart_current_level(model)
    
    // Screen Navigation
    GoToMainMenu -> types.Model(..model, status: MainMenu)
    GoToMarketplace -> types.Model(..model, status: InMarketplace)
    GoToTestingGrounds -> handle_enter_testing_grounds(model)
    AcceptLevelReward -> types.Model(..model, status: LevelComplete)
    
    // Marketplace Actions
    BuyOrb(orb) -> marketplace.purchase_orb(model, orb)
    
    // Game Settings
    ToggleShuffle -> handle_toggle_shuffle(model)
    ToggleDevMode -> types.Model(..model, dev_mode: !model.dev_mode)
    
    // Choice Orb Actions
    SelectFirstChoice -> handle_choice_selection(model, True)
    SelectSecondChoice -> handle_choice_selection(model, False)
    
    // Gamble Orb Actions
    AcceptGamble -> handle_accept_gamble(model)
    DeclineGamble -> handle_decline_gamble(model)
    NextGambleOrb -> handle_next_gamble_orb(model)
    
    // Testing Grounds Actions
    ExitTestingGrounds -> types.Model(..model, status: MainMenu)
    AddTestOrb(orb) -> handle_add_test_orb(model, orb)
    RemoveTestOrb(index) -> handle_remove_test_orb(model, index)
    SetTestMilestone(milestone) -> handle_set_test_milestone(model, milestone)
    SetTestHealth(health) -> handle_set_test_health(model, health)
    SetSimulationCount(count) -> handle_set_simulation_count(model, count)
    StartSimulations -> handle_start_simulations(model)
    ViewTestResults -> handle_view_test_results(model)
    ResetTestConfig -> handle_reset_test_config(model)
  }
}

fn handle_pull_orb(model: Model) -> Model {
  case model.status {
    Playing -> {
      case model.bag {
        [] -> model
        [first_orb, ..rest] -> {
          let new_model = orb.apply_orb_effect(first_orb, model)
          let new_sequence = model.log_sequence + 1
          let log_message = orb.get_orb_result_message(first_orb, new_model)
          let new_log_entry = types.LogEntry(
            sequence: new_sequence,
            orb: first_orb,
            message: log_message,
          )
          let updated_model =
            types.Model(
              ..new_model,
              bag: rest,
              last_orb: option.Some(first_orb),
              log_entries: [new_log_entry, ..model.log_entries],
              log_sequence: new_sequence,
            )
          check_game_status(updated_model)
        }
      }
    }
    _ -> model
  }
}

fn handle_next_level(model: Model) -> Model {
  let new_level = model.level + 1
  let base_bag = level.create_level_bag(new_level)
  let final_bag = case model.shuffle_enabled {
    True -> list.shuffle(base_bag)
    False -> base_bag
  }
  // Credits are already awarded when level completes, no need to add again
  types.Model(
    health: 5,
    points: 0,
    level: new_level,
    milestone: level.get_milestone_for_level(new_level),
    bag: final_bag,
    status: Playing,
    last_orb: option.None,
    bombs_pulled_this_level: 0,
    current_multiplier: 1,
    credits: model.credits,
    shuffle_enabled: model.shuffle_enabled,
    dev_mode: model.dev_mode,
    testing_config: model.testing_config,
    testing_mode: model.testing_mode,
    testing_stats: model.testing_stats,
    log_entries: [],
    log_sequence: 0,
    pending_choice: option.None,
    pending_gamble: option.None,
    gamble_orbs: [],
    gamble_current_index: 0,
  )
}



fn handle_enter_testing_grounds(model: Model) -> Model {
  types.Model(
    ..model,
    status: InTestingGrounds,
    testing_mode: ConfiguringTest,
    testing_config: option.Some(types.TestingConfiguration(
      test_bag: [],
      target_milestone: 50,
      starting_health: 5,
      simulation_count: 100,
    )),
    testing_stats: option.None,
  )
}


fn handle_add_test_orb(model: Model, orb: types.Orb) -> Model {
  case model.testing_config {
    option.Some(config) -> {
      let new_config =
        types.TestingConfiguration(
          ..config,
          test_bag: [orb, ..config.test_bag],
        )
      types.Model(..model, testing_config: option.Some(new_config))
    }
    option.None -> model
  }
}

fn handle_remove_test_orb(model: Model, index: Int) -> Model {
  case model.testing_config {
    option.Some(config) -> {
      let before = list.take(config.test_bag, index)
      let after = list.drop(config.test_bag, index + 1)
      let new_bag = list.append(before, after)
      let new_config = types.TestingConfiguration(..config, test_bag: new_bag)
      types.Model(..model, testing_config: option.Some(new_config))
    }
    option.None -> model
  }
}

fn handle_set_test_milestone(model: Model, milestone: Int) -> Model {
  case model.testing_config {
    option.Some(config) -> {
      let new_config =
        types.TestingConfiguration(..config, target_milestone: milestone)
      types.Model(..model, testing_config: option.Some(new_config))
    }
    option.None -> model
  }
}

fn handle_set_test_health(model: Model, health: Int) -> Model {
  case model.testing_config {
    option.Some(config) -> {
      let new_config =
        types.TestingConfiguration(..config, starting_health: health)
      types.Model(..model, testing_config: option.Some(new_config))
    }
    option.None -> model
  }
}

fn handle_set_simulation_count(model: Model, count: Int) -> Model {
  case model.testing_config {
    option.Some(config) -> {
      let new_config =
        types.TestingConfiguration(..config, simulation_count: count)
      types.Model(..model, testing_config: option.Some(new_config))
    }
    option.None -> model
  }
}

fn handle_start_simulations(model: Model) -> Model {
  case model.testing_config {
    option.Some(config) -> {
      let stats = simulation.run_simulations(config)
      types.Model(
        ..model,
        testing_mode: types.ViewingResults,
        testing_stats: option.Some(stats),
      )
    }
    option.None -> model
  }
}

fn handle_view_test_results(model: Model) -> Model {
  types.Model(..model, testing_mode: types.ViewingResults)
}

fn handle_reset_test_config(model: Model) -> Model {
  types.Model(
    ..model,
    testing_config: option.Some(types.TestingConfiguration(
      test_bag: [],
      target_milestone: 50,
      starting_health: 5,
      simulation_count: 100,
    )),
    testing_stats: option.None,
    testing_mode: ConfiguringTest,
  )
}

fn start_new_game() -> Model {
  let base_bag = level.create_level_bag(1)
  // Start with shuffle disabled for new games
  types.Model(
    health: 5,
    points: 0,
    level: 1,
    milestone: level.get_milestone_for_level(1),
    bag: base_bag,
    status: Playing,
    last_orb: option.None,
    bombs_pulled_this_level: 0,
    current_multiplier: 1,
    credits: 0,
    shuffle_enabled: False,
    dev_mode: False,
    testing_config: option.None,
    testing_mode: ConfiguringTest,
    testing_stats: option.None,
    log_entries: [],
    log_sequence: 0,
    pending_choice: option.None,
    pending_gamble: option.None,
    gamble_orbs: [],
    gamble_current_index: 0,
  )
}

fn restart_current_level(model: Model) -> Model {
  let base_bag = level.create_level_bag(model.level)
  let final_bag = case model.shuffle_enabled {
    True -> list.shuffle(base_bag)
    False -> base_bag
  }
  types.Model(
    health: 5,
    points: 0,
    level: model.level,
    milestone: model.milestone,
    bag: final_bag,
    status: Playing,
    last_orb: option.None,
    bombs_pulled_this_level: 0,
    current_multiplier: 1,
    credits: model.credits,
    shuffle_enabled: model.shuffle_enabled,
    dev_mode: model.dev_mode,
    testing_config: model.testing_config,
    testing_mode: model.testing_mode,
    testing_stats: model.testing_stats,
    log_entries: [],
    log_sequence: 0,
    pending_choice: option.None,
    pending_gamble: option.None,
    gamble_orbs: [],
    gamble_current_index: 0,
  )
}

fn handle_toggle_shuffle(model: Model) -> Model {
  let new_shuffle_enabled = !model.shuffle_enabled
  case model.status == Playing && new_shuffle_enabled {
    True -> {
      // If enabling shuffle during gameplay, reshuffle the current bag
      let shuffled_bag = list.shuffle(model.bag)
      types.Model(..model, shuffle_enabled: new_shuffle_enabled, bag: shuffled_bag)
    }
    False -> {
      // If disabling shuffle or not playing, just toggle the setting
      types.Model(..model, shuffle_enabled: new_shuffle_enabled)
    }
  }
}

fn handle_choice_selection(model: Model, select_first: Bool) -> Model {
  case model.pending_choice {
    option.Some(#(first_orb, second_orb)) -> {
      let #(chosen_orb, unchosen_orb) = case select_first {
        True -> #(first_orb, second_orb)
        False -> #(second_orb, first_orb)
      }
      
      // Apply the chosen orb's effect
      let after_effect = orb.apply_orb_effect(chosen_orb, model)
      
      // Create log entry for the chosen orb
      let new_sequence = model.log_sequence + 1
      let log_message = orb.get_orb_result_message(chosen_orb, after_effect)
      let new_log_entry = types.LogEntry(
        sequence: new_sequence,
        orb: chosen_orb,
        message: log_message,
      )
      
      // Return unchosen orb to end of bag (unless it's a duplicate from single orb case)
      let new_bag = case first_orb == second_orb {
        True -> after_effect.bag  // Don't return duplicate orb
        False -> list.append(after_effect.bag, [unchosen_orb])
      }
      
      let updated_model = types.Model(
        ..after_effect,
        status: Playing,
        pending_choice: option.None,
        bag: new_bag,
        last_orb: option.Some(chosen_orb),
        log_entries: [new_log_entry, ..model.log_entries],
        log_sequence: new_sequence,
      )
      
      check_game_status(updated_model)
    }
    option.None -> model  // No pending choice, do nothing
  }
}

fn handle_accept_gamble(model: Model) -> Model {
  // Pull 5 orbs from bag
  let gamble_orbs = list.take(model.bag, 5)
  let remaining_bag = list.drop(model.bag, 5)
  
  types.Model(
    ..model,
    status: types.ViewingGambleResults,
    pending_gamble: option.None,
    gamble_orbs: gamble_orbs,
    gamble_current_index: 0,
    bag: remaining_bag,
  )
}

fn handle_decline_gamble(model: Model) -> Model {
  types.Model(
    ..model,
    status: Playing,
    pending_gamble: option.None,
  )
}

fn handle_next_gamble_orb(model: Model) -> Model {
  case model.status {
    types.ViewingGambleResults -> {
      // Start applying orbs
      case model.gamble_orbs {
        [] -> types.Model(..model, status: Playing) // No orbs to apply
        _ -> {
          let updated_model = types.Model(
            ..model,
            status: types.ApplyingGambleOrbs,
            gamble_current_index: 0,
          )
          apply_current_gamble_orb(updated_model)
        }
      }
    }
    types.ApplyingGambleOrbs -> {
      // Apply next orb
      let next_index = model.gamble_current_index + 1
      case next_index >= list.length(model.gamble_orbs) {
        True -> {
          // Done with all orbs, return to playing
          types.Model(
            ..model,
            status: Playing,
            gamble_orbs: [],
            gamble_current_index: 0,
          )
        }
        False -> {
          let updated_model = types.Model(
            ..model,
            gamble_current_index: next_index,
          )
          apply_current_gamble_orb(updated_model)
        }
      }
    }
    _ -> model
  }
}

fn apply_current_gamble_orb(model: Model) -> Model {
  case list.first(list.drop(model.gamble_orbs, model.gamble_current_index)) {
    Ok(orb) -> {
      let modified_model = apply_gamble_orb_effect(orb, model)
      let new_sequence = model.log_sequence + 1
      let log_message = orb.get_orb_result_message(orb, modified_model)
      let new_log_entry = types.LogEntry(
        sequence: new_sequence,
        orb: orb,
        message: log_message,
      )
      
      let updated_model = types.Model(
        ..modified_model,
        log_entries: [new_log_entry, ..model.log_entries],
        log_sequence: new_sequence,
      )
      
      check_game_status(updated_model)
    }
    Error(_) -> model
  }
}

fn apply_gamble_orb_effect(orb: types.Orb, model: Model) -> Model {
  case orb {
    types.Point(value) -> {
      // Special gamble rule: Point orbs get 2X multiplier
      let gamble_points = value * 2 * model.current_multiplier
      types.Model(..model, points: model.points + gamble_points)
    }
    types.Bomb(damage) ->
      types.Model(
        ..model,
        health: model.health - damage,
        bombs_pulled_this_level: model.bombs_pulled_this_level + 1,
      )
    types.Health(value) -> {
      let new_health = int.min(5, model.health + value)
      types.Model(..model, health: new_health)
    }
    types.Collector -> {
      // Count remaining orbs in bag AFTER gamble orbs were removed
      let remaining_orbs = list.length(model.bag)
      let collector_points = remaining_orbs * model.current_multiplier
      types.Model(..model, points: model.points + collector_points)
    }
    types.Survivor -> {
      let survivor_points = model.bombs_pulled_this_level * model.current_multiplier
      types.Model(..model, points: model.points + survivor_points)
    }
    types.Multiplier -> {
      let new_multiplier = model.current_multiplier * 2
      types.Model(..model, current_multiplier: new_multiplier)
    }
    types.Choice -> {
      // During gamble, Choice orb becomes a basic Point(5) orb to avoid complexity
      let gamble_points = 5 * 2 * model.current_multiplier
      types.Model(..model, points: model.points + gamble_points)
    }
    types.Gamble -> {
      // Gamble within gamble - treat as no-op to avoid recursion
      model
    }
  }
}

fn check_game_status(model: Model) -> Model {
  case model.health <= 0, model.points >= model.milestone {
    True, _ -> types.Model(..model, status: GameOver)
    False, True -> types.Model(..model, status: LevelComplete, credits: model.credits + model.points)
    False, False -> model
  }
}

