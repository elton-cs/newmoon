import gleam/int
import gleam/list
import types.{type Orb, type SimulationResult, type TestingConfiguration, type TestingStats, SimulationResult, TestingStats}

pub fn run_simulations(config: TestingConfiguration) -> TestingStats {
  let results = list.range(1, config.simulation_count)
    |> list.map(fn(_) { run_single_simulation(config) })
  
  calculate_stats(results)
}

fn run_single_simulation(config: TestingConfiguration) -> SimulationResult {
  // Shuffle the bag for each simulation to get varied results
  let shuffled_bag = list.shuffle(config.test_bag)
  
  simulate_game(
    bag: shuffled_bag,
    health: config.starting_health,
    points: 0,
    target: config.target_milestone,
    orbs_pulled: 0,
    bombs_hit: 0,
    multiplier: 1,
  )
}

fn simulate_game(
  bag bag: List(Orb),
  health health: Int,
  points points: Int,
  target target: Int,
  orbs_pulled orbs_pulled: Int,
  bombs_hit bombs_hit: Int,
  multiplier multiplier: Int,
) -> SimulationResult {
  case health <= 0 {
    True -> SimulationResult(
      won: False,
      final_points: points,
      final_health: health,
      orbs_pulled: orbs_pulled,
      bombs_hit: bombs_hit,
    )
    False -> case points >= target {
      True -> SimulationResult(
        won: True,
        final_points: points,
        final_health: health,
        orbs_pulled: orbs_pulled,
        bombs_hit: bombs_hit,
      )
      False -> case bag {
        [] -> SimulationResult(
          won: False,
          final_points: points,
          final_health: health,
          orbs_pulled: orbs_pulled,
          bombs_hit: bombs_hit,
        )
        [orb, ..rest] -> {
          let #(new_health, new_points, new_multiplier, new_bombs) = 
            apply_orb_simulation(orb, health, points, multiplier, bombs_hit)
          
          simulate_game(
            bag: rest,
            health: new_health,
            points: new_points,
            target: target,
            orbs_pulled: orbs_pulled + 1,
            bombs_hit: new_bombs,
            multiplier: new_multiplier,
          )
        }
      }
    }
  }
}

fn apply_orb_simulation(
  orb: Orb,
  health: Int,
  points: Int,
  multiplier: Int,
  bombs_hit: Int,
) -> #(Int, Int, Int, Int) {
  case orb {
    types.Point(value) -> {
      let modified_points = points + { value * multiplier }
      #(health, modified_points, multiplier, bombs_hit)
    }
    types.Health(value) -> {
      let new_health = health + value
      #(new_health, points, multiplier, bombs_hit)
    }
    types.Bomb(damage) -> {
      let new_health = health - damage
      let new_bombs = bombs_hit + 1
      #(new_health, points, multiplier, new_bombs)
    }
    types.Collector -> {
      // Give 1 point per remaining orb in bag (we don't have access to bag here)
      // For simulation purposes, we'll give a conservative estimate of 5 points
      let collector_points = 5 * multiplier
      #(health, points + collector_points, multiplier, bombs_hit)
    }
    types.Survivor -> {
      // Give points for bombs survived (2 points per bomb hit so far)
      let survivor_points = bombs_hit * 2 * multiplier
      #(health, points + survivor_points, multiplier, bombs_hit)
    }
    types.Multiplier -> {
      let new_multiplier = multiplier * 2
      #(health, points, new_multiplier, bombs_hit)
    }
    types.Choice -> {
      // For simulation purposes, Choice orb has no direct effect
      // In real gameplay it would trigger choice selection, but in simulation
      // we can't make choices, so it's essentially a no-op
      #(health, points, multiplier, bombs_hit)
    }
    types.Gamble -> {
      // For simulation purposes, Gamble orb has no direct effect
      // In real gameplay it would trigger gamble choice, but in simulation
      // we can't make choices, so it's essentially a no-op
      #(health, points, multiplier, bombs_hit)
    }
  }
}

fn calculate_stats(results: List(SimulationResult)) -> TestingStats {
  let total_runs = list.length(results)
  let wins = list.count(results, fn(result) { result.won })
  let losses = total_runs - wins
  
  let win_rate = case total_runs > 0 {
    True -> int.to_float(wins) /. int.to_float(total_runs)
    False -> 0.0
  }
  
  let point_values = list.map(results, fn(result) { result.final_points })
  let average_points = case total_runs > 0 {
    True -> {
      let total_points = list.fold(point_values, 0, int.add)
      int.to_float(total_points) /. int.to_float(total_runs)
    }
    False -> 0.0
  }
  
  let best_score = case list.sort(point_values, int.compare) |> list.reverse() {
    [best, ..] -> best
    [] -> 0
  }
  
  let worst_score = case list.sort(point_values, int.compare) {
    [worst, ..] -> worst
    [] -> 0
  }
  
  TestingStats(
    total_runs: total_runs,
    wins: wins,
    losses: losses,
    win_rate: win_rate,
    average_points: average_points,
    best_score: best_score,
    worst_score: worst_score,
    results: results,
  )
}