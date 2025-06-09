import gleam/option.{type Option}

pub type Orb {
  PointOrb(Int)
  BombOrb(Int)
}

pub type MainMenuMode {
  MainMenu
}

pub type TestingMode {
  OrbTesting
  OrbValueSelection(OrbType)
  TestingGameplay
  TestingWon
  TestingLost
}

pub type GameMode {
  Playing
  Won
  Lost
}

pub type Mode {
  MainMenuMode(MainMenuMode)
  TestingMode(TestingMode)
  GameMode(GameMode)
}

pub type OrbType {
  DataSample
  HazardSample
}

pub type Model {
  Model(
    health: Int,
    points: Int,
    level: Int,
    milestone: Int,
    bag: List(Orb),
    mode: Mode,
    last_orb: Option(Orb),
    input_value: String,
  )
}

pub type Msg {
  StartGame
  GoToOrbTesting
  SelectOrbType(OrbType)
  UpdateInputValue(String)
  ConfirmOrbValue(OrbType)
  BackToMainMenu
  BackToOrbTesting
  PullOrb
  NextLevel
  RestartGame
  ResetTesting
  ExitTesting
}
