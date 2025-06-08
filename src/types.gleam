import gleam/option.{type Option}

pub type GameState {
  GameState(milestone: Int, bag: List(Orb), last_orb: Option(Orb))
}

pub type LogState {
  LogState(entries: List(LogEntry), sequence: Int)
}

pub type ChoiceState {
  ChoiceState(pending: Option(#(Orb, Orb)))
}

pub type GambleState {
  GambleState(
    pending: Option(Bool),
    orbs: List(Orb),
    current_index: Int,
    in_choice: Bool,
  )
}

pub type Settings {
  Settings(shuffle_enabled: Bool, dev_mode: Bool)
}

pub type Model {
  Model(
    player: Player,
    status: Status,
    game_state: GameState,
    log_state: LogState,
    choice_state: ChoiceState,
    gamble_state: GambleState,
    settings: Settings,
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

pub type Status {
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
