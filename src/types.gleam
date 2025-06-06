import gleam/option.{type Option}

pub type Orb {
  Bomb(Int)
  Point(Int)
  Health(Int)
  Collector
  Survivor
  Multiplier
}

pub type GameStatus {
  Playing
  Won
  Lost
  InMarketplace
}

pub type Model {
  Model(
    health: Int,
    points: Int,
    level: Int,
    milestone: Int,
    bag: List(Orb),
    status: GameStatus,
    last_orb: Option(Orb),
    bombs_pulled_this_level: Int,
    current_multiplier: Int,
    credits: Int,
  )
}

pub type Msg {
  PullOrb
  NextLevel
  RestartGame
  EnterMarketplace
  ExitMarketplace
  BuyOrb(Orb)
}

pub type MarketItem {
  MarketItem(orb: Orb, price: Int, description: String)
}