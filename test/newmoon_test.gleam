import gleam/option
import gleeunit
import gleeunit/should
import orb
import types.{
  type Model, Bomb, Collector, Health, Model, Multiplier, Playing, Point,
  Survivor,
}

pub fn main() -> Nil {
  gleeunit.main()
}

// Helper function to create a test model
fn create_test_model() -> Model {
  Model(
    health: 5,
    points: 0,
    level: 1,
    milestone: 50,
    bag: [],
    status: Playing,
    last_orb: option.None,
    bombs_pulled_this_level: 0,
    current_multiplier: 1,
    credits: 0,
    shuffle_enabled: False,
    dev_mode: False,
    testing_config: option.None,
    testing_mode: types.ConfiguringTest,
    testing_stats: option.None,
    log_entries: [],
    log_sequence: 0,
  )
}

// ============================================================================
// POINT ORB TESTS
// ============================================================================

pub fn point_orb_basic_test() {
  let model = create_test_model()
  let point_orb = Point(10)
  let result = orb.apply_orb_effect(point_orb, model)

  should.equal(result.points, 10)
  should.equal(result.health, 5)
  // Health unchanged
  should.equal(result.current_multiplier, 1)
  // Multiplier unchanged
}

pub fn point_orb_with_multiplier_test() {
  let model = Model(..create_test_model(), current_multiplier: 2, points: 5)
  let point_orb = Point(8)
  let result = orb.apply_orb_effect(point_orb, model)

  should.equal(result.points, 21)
  // 5 + (8 * 2) = 21
  should.equal(result.current_multiplier, 2)
  // Multiplier unchanged
}

pub fn point_orb_high_multiplier_test() {
  let model = Model(..create_test_model(), current_multiplier: 4, points: 10)
  let point_orb = Point(6)
  let result = orb.apply_orb_effect(point_orb, model)

  should.equal(result.points, 34)
  // 10 + (6 * 4) = 34
}

// ============================================================================
// BOMB ORB TESTS
// ============================================================================

pub fn bomb_orb_basic_test() {
  let model = create_test_model()
  let bomb_orb = Bomb(2)
  let result = orb.apply_orb_effect(bomb_orb, model)

  should.equal(result.health, 3)
  // 5 - 2 = 3
  should.equal(result.bombs_pulled_this_level, 1)
  should.equal(result.points, 0)
  // Points unchanged
}

pub fn bomb_orb_multiple_bombs_test() {
  let model =
    Model(..create_test_model(), health: 4, bombs_pulled_this_level: 1)
  let bomb_orb = Bomb(3)
  let result = orb.apply_orb_effect(bomb_orb, model)

  should.equal(result.health, 1)
  // 4 - 3 = 1
  should.equal(result.bombs_pulled_this_level, 2)
  // 1 + 1 = 2
}

pub fn bomb_orb_fatal_damage_test() {
  let model = Model(..create_test_model(), health: 2)
  let bomb_orb = Bomb(3)
  let result = orb.apply_orb_effect(bomb_orb, model)

  should.equal(result.health, -1)
  // 2 - 3 = -1 (game over scenario)
  should.equal(result.bombs_pulled_this_level, 1)
}

// ============================================================================
// HEALTH ORB TESTS
// ============================================================================

pub fn health_orb_basic_test() {
  let model = Model(..create_test_model(), health: 3)
  let health_orb = Health(2)
  let result = orb.apply_orb_effect(health_orb, model)

  should.equal(result.health, 5)
  // 3 + 2 = 5 (capped at 5)
  should.equal(result.points, 0)
  // Points unchanged
}

pub fn health_orb_no_overheal_test() {
  let model = Model(..create_test_model(), health: 4)
  let health_orb = Health(3)
  let result = orb.apply_orb_effect(health_orb, model)

  should.equal(result.health, 5)
  // 4 + 3 = 7, but capped at 5
}

pub fn health_orb_full_health_test() {
  let model = create_test_model()
  // health: 5
  let health_orb = Health(1)
  let result = orb.apply_orb_effect(health_orb, model)

  should.equal(result.health, 5)
  // Already at max, stays at 5
}

pub fn health_orb_critical_heal_test() {
  let model = Model(..create_test_model(), health: 1)
  let health_orb = Health(2)
  let result = orb.apply_orb_effect(health_orb, model)

  should.equal(result.health, 3)
  // 1 + 2 = 3
}

// ============================================================================
// COLLECTOR ORB TESTS
// ============================================================================

pub fn collector_orb_empty_bag_test() {
  let model = Model(..create_test_model(), bag: [])
  let collector_orb = Collector
  let result = orb.apply_orb_effect(collector_orb, model)

  should.equal(result.points, -1)
  // 0 orbs - 1 (for collector itself) = -1 points
  should.equal(result.health, 5)
  // Health unchanged
}

pub fn collector_orb_single_orb_test() {
  let model = Model(..create_test_model(), bag: [Point(5)])
  let collector_orb = Collector
  let result = orb.apply_orb_effect(collector_orb, model)

  should.equal(result.points, 0)
  // 1 orb remaining, but -1 for the collector itself = 0
}

pub fn collector_orb_multiple_orbs_test() {
  let model = Model(..create_test_model(), bag: [Point(5), Bomb(2), Health(1)])
  let collector_orb = Collector
  let result = orb.apply_orb_effect(collector_orb, model)

  should.equal(result.points, 2)
  // 3 orbs - 1 (for collector itself) = 2 points
}

pub fn collector_orb_with_multiplier_test() {
  let model =
    Model(
      ..create_test_model(),
      bag: [Point(5), Point(8)],
      current_multiplier: 3,
    )
  let collector_orb = Collector
  let result = orb.apply_orb_effect(collector_orb, model)

  should.equal(result.points, 3)
  // (2 orbs - 1) * 3 = 3 points
}

// ============================================================================
// SURVIVOR ORB TESTS
// ============================================================================

pub fn survivor_orb_no_bombs_test() {
  let model = Model(..create_test_model(), bombs_pulled_this_level: 0)
  let survivor_orb = Survivor
  let result = orb.apply_orb_effect(survivor_orb, model)

  should.equal(result.points, 0)
  // No bombs pulled = 0 points
}

pub fn survivor_orb_single_bomb_test() {
  let model = Model(..create_test_model(), bombs_pulled_this_level: 1)
  let survivor_orb = Survivor
  let result = orb.apply_orb_effect(survivor_orb, model)

  should.equal(result.points, 1)
  // 1 bomb pulled = 1 point
}

pub fn survivor_orb_multiple_bombs_test() {
  let model = Model(..create_test_model(), bombs_pulled_this_level: 4)
  let survivor_orb = Survivor
  let result = orb.apply_orb_effect(survivor_orb, model)

  should.equal(result.points, 4)
  // 4 bombs pulled = 4 points
}

pub fn survivor_orb_with_multiplier_test() {
  let model =
    Model(
      ..create_test_model(),
      bombs_pulled_this_level: 2,
      current_multiplier: 2,
    )
  let survivor_orb = Survivor
  let result = orb.apply_orb_effect(survivor_orb, model)

  should.equal(result.points, 4)
  // 2 bombs * 2 multiplier = 4 points
}

// ============================================================================
// MULTIPLIER ORB TESTS
// ============================================================================

pub fn multiplier_orb_basic_test() {
  let model = create_test_model()
  // current_multiplier: 1
  let multiplier_orb = Multiplier
  let result = orb.apply_orb_effect(multiplier_orb, model)

  should.equal(result.current_multiplier, 2)
  // 1 * 2 = 2
  should.equal(result.points, 0)
  // Points unchanged
  should.equal(result.health, 5)
  // Health unchanged
}

pub fn multiplier_orb_stacking_test() {
  let model = Model(..create_test_model(), current_multiplier: 2)
  let multiplier_orb = Multiplier
  let result = orb.apply_orb_effect(multiplier_orb, model)

  should.equal(result.current_multiplier, 4)
  // 2 * 2 = 4
}

pub fn multiplier_orb_high_stacking_test() {
  let model = Model(..create_test_model(), current_multiplier: 4)
  let multiplier_orb = Multiplier
  let result = orb.apply_orb_effect(multiplier_orb, model)

  should.equal(result.current_multiplier, 8)
  // 4 * 2 = 8
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

pub fn multiplier_point_sequence_test() {
  let model = create_test_model()

  // First apply multiplier
  let after_multiplier = orb.apply_orb_effect(Multiplier, model)
  should.equal(after_multiplier.current_multiplier, 2)
  should.equal(after_multiplier.points, 0)

  // Then apply point orb
  let after_point = orb.apply_orb_effect(Point(10), after_multiplier)
  should.equal(after_point.points, 20)
  // 10 * 2 = 20
  should.equal(after_point.current_multiplier, 2)
  // Unchanged
}

pub fn bomb_survivor_sequence_test() {
  let model = create_test_model()

  // Pull a bomb
  let after_bomb = orb.apply_orb_effect(Bomb(2), model)
  should.equal(after_bomb.health, 3)
  should.equal(after_bomb.bombs_pulled_this_level, 1)

  // Pull survivor orb
  let after_survivor = orb.apply_orb_effect(Survivor, after_bomb)
  should.equal(after_survivor.points, 1)
  // 1 bomb pulled = 1 point
  should.equal(after_survivor.bombs_pulled_this_level, 1)
  // Unchanged
}

pub fn complex_multiplier_sequence_test() {
  let model = create_test_model()

  // Apply double multiplier (1 -> 2 -> 4)
  let after_mult1 = orb.apply_orb_effect(Multiplier, model)
  let after_mult2 = orb.apply_orb_effect(Multiplier, after_mult1)
  should.equal(after_mult2.current_multiplier, 4)

  // Pull bomb (affects survivor later)
  let after_bomb = orb.apply_orb_effect(Bomb(1), after_mult2)
  should.equal(after_bomb.bombs_pulled_this_level, 1)

  // Pull collector with 2 orbs in bag
  let model_with_bag = Model(..after_bomb, bag: [Point(5), Health(2)])
  let after_collector = orb.apply_orb_effect(Collector, model_with_bag)
  should.equal(after_collector.points, 4)
  // (2-1) * 4 = 4

  // Pull survivor
  let after_survivor = orb.apply_orb_effect(Survivor, after_collector)
  should.equal(after_survivor.points, 8)
  // 4 + (1 bomb * 4) = 8
}

// ============================================================================
// ORB RESULT MESSAGE TESTS
// ============================================================================

pub fn point_orb_message_test() {
  let model = create_test_model()
  let point_orb = Point(8)
  let message = orb.get_orb_result_message(point_orb, model)

  should.equal(message, "● DATA PACKET ACQUIRED +8")
}

pub fn point_orb_message_with_multiplier_test() {
  let model = Model(..create_test_model(), current_multiplier: 3)
  let point_orb = Point(5)
  let message = orb.get_orb_result_message(point_orb, model)

  should.equal(message, "● DATA PACKET [5×3] +15")
}

pub fn bomb_orb_message_test() {
  let model = create_test_model()
  let bomb_orb = Bomb(2)
  let message = orb.get_orb_result_message(bomb_orb, model)

  should.equal(message, "○ HULL BREACH [SEVERITY-2] -2 SYS")
}

pub fn health_orb_message_test() {
  let model = create_test_model()
  let health_orb = Health(3)
  let message = orb.get_orb_result_message(health_orb, model)

  should.equal(message, "+ NANO-REPAIR DEPLOYED [EFFICIENCY-3] +3 SYS")
}

// ============================================================================
// ORB COLOR TESTS
// ============================================================================

pub fn orb_colors_test() {
  should.equal(orb.get_orb_result_color(Point(5)), "gray")
  should.equal(orb.get_orb_result_color(Bomb(2)), "default")
  should.equal(orb.get_orb_result_color(Health(1)), "green")
  should.equal(orb.get_orb_result_color(Collector), "blue")
  should.equal(orb.get_orb_result_color(Survivor), "purple")
  should.equal(orb.get_orb_result_color(Multiplier), "yellow")
}

// ============================================================================
// ORB NAME TESTS
// ============================================================================

pub fn orb_names_test() {
  should.equal(orb.get_orb_name(Point(8)), "Data Sample (+8)")
  should.equal(orb.get_orb_name(Bomb(3)), "Hazard Sample (-3 health)")
  should.equal(orb.get_orb_name(Health(2)), "Medical Sample (+2 health)")
  should.equal(orb.get_orb_name(Collector), "Scanner Sample")
  should.equal(orb.get_orb_name(Survivor), "Analyzer Sample")
  should.equal(orb.get_orb_name(Multiplier), "Amplifier Sample")
}

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

pub fn negative_health_bomb_test() {
  let model = Model(..create_test_model(), health: 1)
  let bomb_orb = Bomb(5)
  let result = orb.apply_orb_effect(bomb_orb, model)

  should.equal(result.health, -4)
  // 1 - 5 = -4 (game over)
  should.equal(result.bombs_pulled_this_level, 1)
}

pub fn zero_value_orbs_test() {
  let model = create_test_model()

  // Point orb with 0 value (edge case)
  let zero_point_result = orb.apply_orb_effect(Point(0), model)
  should.equal(zero_point_result.points, 0)

  // Health orb with 0 value (edge case)
  let zero_health_result = orb.apply_orb_effect(Health(0), model)
  should.equal(zero_health_result.health, 5)
  // No change
}

pub fn extreme_multiplier_test() {
  let model = Model(..create_test_model(), current_multiplier: 16)
  let point_orb = Point(5)
  let result = orb.apply_orb_effect(point_orb, model)

  should.equal(result.points, 80)
  // 5 * 16 = 80
}

pub fn collector_with_large_bag_test() {
  let large_bag = [
    Point(1),
    Point(2),
    Point(3),
    Point(4),
    Point(5),
    Bomb(1),
    Bomb(2),
    Health(1),
    Health(2),
    Collector,
  ]
  // 10 orbs
  let model = Model(..create_test_model(), bag: large_bag)
  let collector_orb = Collector
  let result = orb.apply_orb_effect(collector_orb, model)

  should.equal(result.points, 9)
  // 10 - 1 = 9 points
}

// ============================================================================
// REAL GAME SCENARIO TESTS
// ============================================================================

pub fn typical_level_sequence_test() {
  let model = create_test_model()

  // Realistic level progression: Multiplier -> Points -> Bomb -> Health -> Collector
  let step1 = orb.apply_orb_effect(Multiplier, model)
  should.equal(step1.current_multiplier, 2)
  should.equal(step1.points, 0)

  let step2 = orb.apply_orb_effect(Point(8), step1)
  should.equal(step2.points, 16)
  // 8 * 2
  should.equal(step2.health, 5)

  let step3 = orb.apply_orb_effect(Bomb(2), step2)
  should.equal(step3.health, 3)
  should.equal(step3.bombs_pulled_this_level, 1)
  should.equal(step3.points, 16)
  // Unchanged

  let step4 = orb.apply_orb_effect(Health(1), step3)
  should.equal(step4.health, 4)
  // 3 + 1
  should.equal(step4.points, 16)
  // Unchanged

  // Collector with remaining bag
  let model_with_remaining = Model(..step4, bag: [Point(5), Bomb(1)])
  let step5 = orb.apply_orb_effect(Collector, model_with_remaining)
  should.equal(step5.points, 18)
  // 16 + ((2-1) * 2) = 18
}

pub fn survival_strategy_test() {
  let model = create_test_model()

  // Strategy: Pull bombs early to build up survivor value
  let after_bomb1 = orb.apply_orb_effect(Bomb(1), model)
  let after_bomb2 = orb.apply_orb_effect(Bomb(2), after_bomb1)
  let after_bomb3 = orb.apply_orb_effect(Bomb(1), after_bomb2)

  should.equal(after_bomb3.health, 1)
  // 5 - 1 - 2 - 1 = 1
  should.equal(after_bomb3.bombs_pulled_this_level, 3)

  // Pull multiplier
  let after_multiplier = orb.apply_orb_effect(Multiplier, after_bomb3)
  should.equal(after_multiplier.current_multiplier, 2)

  // Pull survivor for big payoff
  let after_survivor = orb.apply_orb_effect(Survivor, after_multiplier)
  should.equal(after_survivor.points, 6)
  // 3 bombs * 2 multiplier = 6
}

pub fn defensive_healing_test() {
  let model = Model(..create_test_model(), health: 2)
  // Low health

  // Healing sequence to recover
  let after_heal1 = orb.apply_orb_effect(Health(2), model)
  should.equal(after_heal1.health, 4)

  let after_heal2 = orb.apply_orb_effect(Health(3), after_heal1)
  should.equal(after_heal2.health, 5)
  // Capped at 5

  // Now safe to take some risk
  let after_bomb = orb.apply_orb_effect(Bomb(2), after_heal2)
  should.equal(after_bomb.health, 3)
  // Still healthy
}
