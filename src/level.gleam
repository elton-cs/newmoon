import types.{
  type Orb, Bomb, Choice, Collector, Gamble, Health, Multiplier, Point, Survivor,
}

pub fn create_level_bag(level: Int) -> List(Orb) {
  case level {
    1 -> [
      // Level 1: Tutorial level (13 orbs total)
      Gamble,
      // Choice orb first to introduce mechanic early
      Choice,
      // 6 Point orbs - enough to win with some strategy
      Point(8),
      Point(10),
      Point(12),
      Point(6),
      Point(8),
      Point(10),
      // 3 Bomb orbs - can kill if unlucky/reckless
      Bomb(2),
      Bomb(2),
      Bomb(3),
      // 2 Health orbs - safety net
      Health(2),
      Health(3),
      // 1 Collector - strategic bonus for remaining orbs
      Collector,
    ]

    2 -> [
      // Level 2: Introducing strategy (14 orbs total, target: 80)
      // 5 Point orbs 
      Point(12),
      Point(10),
      Point(8),
      Point(10),
      Point(15),
      // 4 Bomb orbs - more dangerous
      Bomb(2),
      Bomb(2),
      Bomb(3),
      Bomb(3),
      // 2 Health orbs
      Health(2),
      Health(3),
      // Strategic orbs
      Collector,
      Multiplier,
      Survivor,
    ]

    3 -> [
      // Level 3: Balanced strategy (14 orbs total)
      // 5 Point orbs (higher values)
      Point(7),
      Point(8),
      Point(9),
      Point(9),
      Point(9),
      // 4 Bomb orbs (increasing danger)
      Bomb(2),
      Bomb(2),
      Bomb(3),
      Bomb(3),
      // 2 Health orbs
      Health(1),
      Health(3),
      // Strategic orbs including first Choice orb
      Collector,
      Multiplier,
      Choice,
    ]

    4 -> [
      // Level 4: High risk/reward (16 orbs total)
      // 5 Point orbs (high values)
      Point(8),
      Point(9),
      Point(9),
      Point(9),
      Point(9),
      // 5 Bomb orbs (high danger)
      Bomb(2),
      Bomb(3),
      Bomb(3),
      Bomb(3),
      Bomb(3),
      // 3 Health orbs (more healing needed)
      Health(1),
      Health(3),
      Health(3),
      // Strategic orbs with Choice
      Multiplier,
      Survivor,
      Choice,
    ]

    5 -> [
      // Level 5: Maximum challenge (18 orbs total)
      // 6 Point orbs (maximum values)
      Point(9),
      Point(9),
      Point(9),
      Point(9),
      Point(9),
      Point(9),
      // 6 Bomb orbs (maximum danger)
      Bomb(3),
      Bomb(3),
      Bomb(3),
      Bomb(3),
      Bomb(3),
      Bomb(3),
      // 3 Health orbs
      Health(3),
      Health(3),
      Health(3),
      // Strategic orbs with high-risk Gamble
      Collector,
      Survivor,
      Gamble,
    ]

    _ -> create_level_bag(5)
    // Default to level 5 for any level beyond 5
  }
}

pub fn get_milestone_for_level(level: Int) -> Int {
  case level {
    1 -> 50
    // Achievable with basic strategy
    2 -> 80
    // Requires some planning
    3 -> 120
    // Moderate challenge
    4 -> 180
    // High skill required
    5 -> 250
    // Maximum challenge
    _ -> 250 + { level - 5 } * 50
    // Scaling for higher levels
  }
}
