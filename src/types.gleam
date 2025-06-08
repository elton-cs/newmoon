import gleam/option.{type Option}

pub type Orb {
  PointOrb
  BombOrb
}

pub type Status {
  MainMenu
  OrbTesting
  TestingMode
  Playing
  Won
  Lost
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
  )
}

pub type Msg {
  StartGame
  GoToOrbTesting
  SelectTestOrb(Orb)
  BackToMainMenu
  PullOrb
  NextLevel
  RestartGame
  ResetTesting
  ExitTesting
}
