import gleam/option.{type Option}

pub type Orb {
  PointOrb(Int)
  BombOrb(Int)
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
