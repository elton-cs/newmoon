import types.{type Orb, Bomb, Collector, Health, Multiplier, Point, Survivor}

pub fn create_level_bag(level: Int) -> List(Orb) {
  case level {
    1 -> [
      // Level 1: Basic introduction (10 orbs total)
      Collector,
      Multiplier,
      Survivor,
      // 4 Point orbs (low-medium values)
      Point(5),
      Point(5),
      Collector,
      Point(7),
      Point(8),
      // 3 Bomb orbs (low damage)  
      Bomb(1),
      Bomb(1),
      Bomb(2),
      // 2 Health orbs
      Health(1),
      Health(3),
      // 1 Collector for strategy
    ]

    2 -> [
      // Level 2: Adding multipliers (12 orbs total)
      // 4 Point orbs (medium values)
      Point(7),
      Point(8),
      Point(8),
      Point(9),
      // 3 Bomb orbs (mixed damage)
      Bomb(1),
      Bomb(2),
      Bomb(3),
      // 2 Health orbs
      Health(1),
      Health(3),
      // 1 Collector, 1 Multiplier, 1 Survivor
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
      // 2 Collector, 1 Multiplier
      Collector,
      Collector,
      Multiplier,
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
      // 2 Multiplier, 1 Survivor
      Multiplier,
      Multiplier,
      Survivor,
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
      // 2 Collector, 1 Survivor
      Collector,
      Collector,
      Survivor,
    ]

    _ -> create_level_bag(5)
    // Default to level 5 for any level beyond 5
  }
}

pub fn get_milestone_for_level(level: Int) -> Int {
  100 + { level - 1 } * 200
}