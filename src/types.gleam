import gleam/option.{type Option}

pub type Orb {
  PointOrb(Int)
  BombOrb(Int)
  HealthOrb(Int)
  AllCollectorOrb
  PointCollectorOrb
  BombSurvivorOrb
}

pub type MenuScreen {
  Main
}

pub type TestingScreen {
  OrbSelection
  ValueConfiguration(OrbType)
  Gameplay
  Success
  Failure
}

pub type GameScreen {
  Playing
  Victory
  Defeat
}

pub type Screen {
  Menu(MenuScreen)
  Testing(TestingScreen)
  Game(GameScreen)
}

pub type OrbType {
  DataSample
  HazardSample
  HealthSample
  AllCollectorSample
  PointCollectorSample
  BombSurvivorSample
}

pub type Model {
  Model(
    health: Int,
    points: Int,
    level: Int,
    milestone: Int,
    bag: List(Orb),
    screen: Screen,
    last_orb: Option(Orb),
    last_orb_message: Option(String),
    input_value: String,
    pulled_orbs: List(Orb),
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
