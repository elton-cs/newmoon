import gleam/option.{type Option}

pub type Orb {
  Bomb(Int)
  Point(Int)
  Health(Int)
  Collector
  Survivor
  Multiplier
}

pub type GameStatus {
  Playing
  Won
  Lost
  ShowingReward
  InMarketplace
  InTestingGrounds
}

pub type Model {
  Model(
    health: Int,
    points: Int,
    level: Int,
    milestone: Int,
    bag: List(Orb),
    status: GameStatus,
    last_orb: Option(Orb),
    bombs_pulled_this_level: Int,
    current_multiplier: Int,
    credits: Int,
    shuffle_enabled: Bool,
    testing_config: Option(TestingConfiguration),
    testing_mode: TestingMode,
    testing_stats: Option(TestingStats),
  )
}

pub type Msg {
  PullOrb
  NextLevel
  RestartGame
  AcceptReward
  EnterMarketplace
  BuyOrb(Orb)
  ToggleShuffle
  EnterTestingGrounds
  ExitTestingGrounds
  AddTestOrb(Orb)
  RemoveTestOrb(Int)
  SetTestMilestone(Int)
  SetTestHealth(Int)
  SetSimulationCount(Int)
  StartSimulations
  ViewTestResults
  ResetTestConfig
}

pub type MarketItem {
  MarketItem(orb: Orb, price: Int, description: String)
}

pub type TestingConfiguration {
  TestingConfiguration(
    test_bag: List(Orb),
    target_milestone: Int,
    starting_health: Int,
    simulation_count: Int,
  )
}

pub type SimulationResult {
  SimulationResult(
    won: Bool,
    final_points: Int,
    final_health: Int,
    orbs_pulled: Int,
    bombs_hit: Int,
  )
}

pub type TestingStats {
  TestingStats(
    total_runs: Int,
    wins: Int,
    losses: Int,
    win_rate: Float,
    average_points: Float,
    best_score: Int,
    worst_score: Int,
    results: List(SimulationResult),
  )
}

pub type TestingMode {
  ConfiguringTest
  RunningSimulations
  ViewingResults
}