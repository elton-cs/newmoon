import gleam/option.{type Option}

pub type Model {
  Model(
    player: Player,
    milestone: Int,
    bag: List(Orb),
    status: GameStatus,
    last_orb: Option(Orb),
    shuffle_enabled: Bool,
    dev_mode: Bool,
    log_entries: List(LogEntry),
    log_sequence: Int,
    pending_choice: Option(#(Orb, Orb)),
    pending_gamble: Option(Bool),
    gamble_orbs: List(Orb),
    gamble_current_index: Int,
    in_gamble_choice: Bool,
  )
}

pub type Msg {
  // Main Menu Navigation
  StartNewGame
  ContinueGame
  ShowHowToPlay

  // Gameplay Actions
  PullOrb
  PauseGame
  ResumeGame

  // Level Progression
  NextLevel
  RestartLevel

  // Screen Navigation
  GoToMainMenu
  GoToMarketplace
  AcceptLevelReward

  // Marketplace Actions
  BuyOrb(Orb)

  // Game Settings
  ToggleShuffle
  ToggleDevMode

  // Choice Orb Actions
  SelectFirstChoice
  SelectSecondChoice

  // Gamble Orb Actions
  AcceptGamble
  DeclineGamble
  NextGambleOrb
}

pub type Orb {
  Bomb(Int)
  Point(Int)
  Health(Int)
  Collector
  Survivor
  Multiplier
  Choice
  Gamble
  PointScanner
  PointRecovery
}

pub type GameStatus {
  MainMenu
  Playing
  Paused
  LevelComplete
  GameOver
  InMarketplace
  ChoosingOrb
  GamblingChoice
  ViewingGambleResults
  ApplyingGambleOrbs
}

pub type Player {
  Player(
    health: Int,
    points: Int,
    level: Int,
    bombs_pulled_this_level: Int,
    current_multiplier: Int,
    credits: Int,
    point_orbs_pulled_this_level: List(Int),
  )
}

pub type MarketItem {
  MarketItem(orb: Orb, price: Int, description: String)
}

pub type LogEntry {
  LogEntry(sequence: Int, orb: Orb, message: String)
}
