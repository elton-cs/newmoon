import gleam/option.{type Option}

pub type Orb {
  PointOrb(Int)
  BombOrb(Int)
}

pub type Status {
  MainMenu
  OrbTesting
  OrbValueSelection(OrbType)
  TestingMode
  Playing
  Won
  Lost
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
    status: Status,
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
