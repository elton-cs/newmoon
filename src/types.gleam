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

pub type RiskEffects {
  RiskEffects(
    health_gained: Int,
    points_gained: Int,
    damage_taken: Int,
    special_orbs: List(Orb),
  )
}

pub type Orb {
  PointOrb(Int)
  BombOrb(Int)
  HealthOrb(Int)
  AllCollectorOrb(Int)
  PointCollectorOrb(Int)
  BombSurvivorOrb(Int)
  MultiplierOrb
  BombImmunityOrb
  ChoiceOrb
  RiskOrb
  PointRecoveryOrb
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
  TestingRiskAccept
  TestingRiskReveal
  TestingRiskPlaying
  TestingRiskSurvived
  TestingRiskConsumed
  TestingRiskDied
}

pub type GameScreen {
  Playing
  Victory
  Defeat
  Choosing
  RiskAccept
  RiskReveal
  RiskPlaying
  RiskSurvived
  RiskConsumed
  RiskDied
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
  RiskSample
  PointRecoverySample
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
    dev_mode: Bool,
    risk_orbs: List(Orb),
    risk_original_orbs: List(Orb),
    risk_pulled_orbs: List(Orb),
    risk_accumulated_effects: RiskEffects,
    risk_health: Int,
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
  StartTestingRiskSuccess
  StartTestingRiskFailure
  StartTestingRiskContinue
  PullOrb
  NextLevel
  RestartGame
  ResetTesting
  ExitTesting
  ChooseOrb(Int)
  ToggleDevMode
  AcceptRisk(Bool)
  AcceptFate
  PullRiskOrb
  ApplyRiskEffects
  ContinueAfterRiskConsumption
  ExitRisk
}
