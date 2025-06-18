import gleam/option.{type Option}

pub type Rarity {
  Common
  Rare
  Cosmic
}

pub type MarketplaceItem {
  MarketplaceItem(
    orb: Orb,
    price: Int,
    rarity: Rarity,
    name: String,
    description: String,
  )
}

pub type StatusDuration {
  Permanent
  Countdown(Int)
  Triggered(Int)
}

pub type StatusEffect {
  PointMultiplier(multiplier: Float, duration: StatusDuration)
  NextPointMultiplier(multiplier: Float)
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
  MultiplierOrb(Float)
  NextPointMultiplierOrb(Float)
  BombImmunityOrb
  ChoiceOrb
  RiskOrb
  PointRecoveryOrb
}

pub type MenuScreen {
  Main
}

pub type GameScreen {
  Playing
  Victory
  Defeat
  GameComplete
  Marketplace
  RiskAccept
  RiskReveal
  RiskPlaying
  RiskSurvived
  RiskConsumed
  RiskDied
}

pub type Screen {
  Menu(MenuScreen)
  Game(GameScreen)
}

pub type Model {
  Model(
    health: Int,
    points: Int,
    credits: Int,
    level: Int,
    milestone: Int,
    bag: List(Orb),
    purchased_orbs: List(Orb),
    screen: Screen,
    last_orb: Option(Orb),
    last_orb_message: Option(String),
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
    selected_marketplace_item: Option(Int),
    marketplace_selection: List(MarketplaceItem),
  )
}

pub type Msg {
  StartGame
  BackToMainMenu
  PullOrb
  NextLevel
  RestartGame
  ChooseOrb(Int)
  ToggleDevMode
  AcceptRisk(Bool)
  AcceptFate
  PullRiskOrb
  ApplyRiskEffects
  ContinueAfterRiskConsumption
  ExitRisk
  GoToMarketplace
  ContinueToNextLevel
  SelectMarketplaceItem(Int)
  PurchaseItem(Int)
}
