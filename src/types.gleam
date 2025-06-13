import gleam/option.{type Option}

pub type StatusDuration {
  Permanent
  Countdown(Int)
  Triggered(Int)
}

pub type StatusEffect {
  PointMultiplier(multiplier: Int, duration: StatusDuration)
  BombImmunity(duration: StatusDuration)
}

pub type StatusPersistence {
  ClearOnLevel
  ClearOnGame
  Persistent
}

pub type Orb {
  PointOrb(Int)
  BombOrb(Int)
  HealthOrb(Int)
  AllCollectorOrb
  PointCollectorOrb
  BombSurvivorOrb
  MultiplierOrb
  BombImmunityOrb
  ChoiceOrb
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
  TestingChoosing
}

pub type GameScreen {
  Playing
  Victory
  Defeat
  Choosing
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
  MultiplierSample
  AllCollectorSample
  PointCollectorSample
  BombSurvivorSample
  BombImmunitySample
  ChoiceSample
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
    point_multiplier: Int,
    bomb_immunity: Int,
    active_statuses: List(StatusEffect),
    choice_orb_1: Option(Orb),
    choice_orb_2: Option(Orb),
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
  StartTestingWithBothStatuses
  StartTestingWithTripleChoice
  PullOrb
  NextLevel
  RestartGame
  ResetTesting
  ExitTesting
  ChooseOrb(Int)
}
