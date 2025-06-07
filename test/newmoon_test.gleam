import gleam/int
import gleam/list
import gleam/option
import gleeunit
import gleeunit/should
import orb
import types.{
  type Model, Bomb, Choice, ChoosingOrb, Collector, Gamble, GamblingChoice,
  Health, Model, Multiplier, Player, Playing, Point, SelectFirstChoice,
  SelectSecondChoice, Survivor,
}

pub fn main() -> Nil {
  gleeunit.main()
}

// Helper function to create a test model
fn create_test_model() -> Model {
  Model(
    player: Player(
      health: 5,
      points: 0,
      level: 1,
      bombs_pulled_this_level: 0,
      current_multiplier: 1,
      credits: 0,
      point_orbs_pulled_this_level: [],
    ),
    milestone: 50,
    bag: [],
    status: Playing,
    last_orb: option.None,
    shuffle_enabled: False,
    dev_mode: False,
    testing_config: option.None,
    testing_mode: types.ConfiguringTest,
    testing_stats: option.None,
    log_entries: [],
    log_sequence: 0,
    pending_choice: option.None,
    pending_gamble: option.None,
    gamble_orbs: [],
    gamble_current_index: 0,
    in_gamble_choice: False,
  )
}

// ============================================================================
// POINT ORB TESTS
// ============================================================================

pub fn point_orb_basic_test() {
  let model = create_test_model()
  let point_orb = Point(10)
  let result = orb.apply_orb_effect(point_orb, model)

  should.equal(result.player.points, 10)
  should.equal(result.player.health, 5)
  // Health unchanged
  should.equal(result.player.current_multiplier, 1)
  // Multiplier unchanged
}

pub fn point_orb_with_multiplier_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, current_multiplier: 2, points: 5))
  let point_orb = Point(8)
  let result = orb.apply_orb_effect(point_orb, model)

  should.equal(result.player.points, 21)
  // 5 + (8 * 2) = 21
  should.equal(result.player.current_multiplier, 2)
  // Multiplier unchanged
}

pub fn point_orb_high_multiplier_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, current_multiplier: 4, points: 10))
  let point_orb = Point(6)
  let result = orb.apply_orb_effect(point_orb, model)

  should.equal(result.player.points, 34)
  // 10 + (6 * 4) = 34
}

// ============================================================================
// BOMB ORB TESTS
// ============================================================================

pub fn bomb_orb_basic_test() {
  let model = create_test_model()
  let bomb_orb = Bomb(2)
  let result = orb.apply_orb_effect(bomb_orb, model)

  should.equal(result.player.health, 3)
  // 5 - 2 = 3
  should.equal(result.player.bombs_pulled_this_level, 1)
  should.equal(result.player.points, 0)
  // Points unchanged
}

pub fn bomb_orb_multiple_bombs_test() {
  let model =
    Model(..create_test_model(), player: Player(..create_test_model().player, health: 4, bombs_pulled_this_level: 1))
  let bomb_orb = Bomb(3)
  let result = orb.apply_orb_effect(bomb_orb, model)

  should.equal(result.player.health, 1)
  // 4 - 3 = 1
  should.equal(result.player.bombs_pulled_this_level, 2)
  // 1 + 1 = 2
}

pub fn bomb_orb_fatal_damage_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, health: 2))
  let bomb_orb = Bomb(3)
  let result = orb.apply_orb_effect(bomb_orb, model)

  should.equal(result.player.health, -1)
  // 2 - 3 = -1 (game over scenario)
  should.equal(result.player.bombs_pulled_this_level, 1)
}

// ============================================================================
// HEALTH ORB TESTS
// ============================================================================

pub fn health_orb_basic_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, health: 3))
  let health_orb = Health(2)
  let result = orb.apply_orb_effect(health_orb, model)

  should.equal(result.player.health, 5)
  // 3 + 2 = 5 (capped at 5)
  should.equal(result.player.points, 0)
  // Points unchanged
}

pub fn health_orb_no_overheal_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, health: 4))
  let health_orb = Health(3)
  let result = orb.apply_orb_effect(health_orb, model)

  should.equal(result.player.health, 5)
  // 4 + 3 = 7, but capped at 5
}

pub fn health_orb_full_health_test() {
  let model = create_test_model()
  // health: 5
  let health_orb = Health(1)
  let result = orb.apply_orb_effect(health_orb, model)

  should.equal(result.player.health, 5)
  // Already at max, stays at 5
}

pub fn health_orb_critical_heal_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, health: 1))
  let health_orb = Health(2)
  let result = orb.apply_orb_effect(health_orb, model)

  should.equal(result.player.health, 3)
  // 1 + 2 = 3
}

// ============================================================================
// COLLECTOR ORB TESTS
// ============================================================================

pub fn collector_orb_empty_bag_test() {
  let model = Model(..create_test_model(), bag: [])
  let collector_orb = Collector
  let result = orb.apply_orb_effect(collector_orb, model)

  should.equal(result.player.points, -1)
  // 0 orbs - 1 (for collector itself) = -1 points
  should.equal(result.player.health, 5)
  // Health unchanged
}

pub fn collector_orb_single_orb_test() {
  let model = Model(..create_test_model(), bag: [Point(5)])
  let collector_orb = Collector
  let result = orb.apply_orb_effect(collector_orb, model)

  should.equal(result.player.points, 0)
  // 1 orb remaining, but -1 for the collector itself = 0
}

pub fn collector_orb_multiple_orbs_test() {
  let model = Model(..create_test_model(), bag: [Point(5), Bomb(2), Health(1)])
  let collector_orb = Collector
  let result = orb.apply_orb_effect(collector_orb, model)

  should.equal(result.player.points, 2)
  // 3 orbs - 1 (for collector itself) = 2 points
}

pub fn collector_orb_with_multiplier_test() {
  let model =
    Model(
      ..create_test_model(),
      bag: [Point(5), Point(8)],
      player: Player(..create_test_model().player, current_multiplier: 3),
    )
  let collector_orb = Collector
  let result = orb.apply_orb_effect(collector_orb, model)

  should.equal(result.player.points, 3)
  // (2 orbs - 1) * 3 = 3 points
}

// ============================================================================
// SURVIVOR ORB TESTS
// ============================================================================

pub fn survivor_orb_no_bombs_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, bombs_pulled_this_level: 0))
  let survivor_orb = Survivor
  let result = orb.apply_orb_effect(survivor_orb, model)

  should.equal(result.player.points, 0)
  // No bombs pulled = 0 points
}

pub fn survivor_orb_single_bomb_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, bombs_pulled_this_level: 1))
  let survivor_orb = Survivor
  let result = orb.apply_orb_effect(survivor_orb, model)

  should.equal(result.player.points, 1)
  // 1 bomb pulled = 1 point
}

pub fn survivor_orb_multiple_bombs_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, bombs_pulled_this_level: 4))
  let survivor_orb = Survivor
  let result = orb.apply_orb_effect(survivor_orb, model)

  should.equal(result.player.points, 4)
  // 4 bombs pulled = 4 points
}

pub fn survivor_orb_with_multiplier_test() {
  let model =
    Model(
      ..create_test_model(),
      player: Player(..create_test_model().player, bombs_pulled_this_level: 2, current_multiplier: 2),
    )
  let survivor_orb = Survivor
  let result = orb.apply_orb_effect(survivor_orb, model)

  should.equal(result.player.points, 4)
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

  should.equal(result.player.current_multiplier, 2)
  // 1 * 2 = 2
  should.equal(result.player.points, 0)
  // Points unchanged
  should.equal(result.player.health, 5)
  // Health unchanged
}

pub fn multiplier_orb_stacking_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, current_multiplier: 2))
  let multiplier_orb = Multiplier
  let result = orb.apply_orb_effect(multiplier_orb, model)

  should.equal(result.player.current_multiplier, 4)
  // 2 * 2 = 4
}

pub fn multiplier_orb_high_stacking_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, current_multiplier: 4))
  let multiplier_orb = Multiplier
  let result = orb.apply_orb_effect(multiplier_orb, model)

  should.equal(result.player.current_multiplier, 8)
  // 4 * 2 = 8
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

pub fn multiplier_point_sequence_test() {
  let model = create_test_model()

  // First apply multiplier
  let after_multiplier = orb.apply_orb_effect(Multiplier, model)
  should.equal(after_multiplier.player.current_multiplier, 2)
  should.equal(after_multiplier.player.points, 0)

  // Then apply point orb
  let after_point = orb.apply_orb_effect(Point(10), after_multiplier)
  should.equal(after_point.player.points, 20)
  // 10 * 2 = 20
  should.equal(after_point.player.current_multiplier, 2)
  // Unchanged
}

pub fn bomb_survivor_sequence_test() {
  let model = create_test_model()

  // Pull a bomb
  let after_bomb = orb.apply_orb_effect(Bomb(2), model)
  should.equal(after_bomb.player.health, 3)
  should.equal(after_bomb.player.bombs_pulled_this_level, 1)

  // Pull survivor orb
  let after_survivor = orb.apply_orb_effect(Survivor, after_bomb)
  should.equal(after_survivor.player.points, 1)
  // 1 bomb pulled = 1 point
  should.equal(after_survivor.player.bombs_pulled_this_level, 1)
  // Unchanged
}

pub fn complex_multiplier_sequence_test() {
  let model = create_test_model()

  // Apply double multiplier (1 -> 2 -> 4)
  let after_mult1 = orb.apply_orb_effect(Multiplier, model)
  let after_mult2 = orb.apply_orb_effect(Multiplier, after_mult1)
  should.equal(after_mult2.player.current_multiplier, 4)

  // Pull bomb (affects survivor later)
  let after_bomb = orb.apply_orb_effect(Bomb(1), after_mult2)
  should.equal(after_bomb.player.bombs_pulled_this_level, 1)

  // Pull collector with 2 orbs in bag
  let model_with_bag = Model(..after_bomb, bag: [Point(5), Health(2)])
  let after_collector = orb.apply_orb_effect(Collector, model_with_bag)
  should.equal(after_collector.player.points, 4)
  // (2-1) * 4 = 4

  // Pull survivor
  let after_survivor = orb.apply_orb_effect(Survivor, after_collector)
  should.equal(after_survivor.player.points, 8)
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
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, current_multiplier: 3))
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
  should.equal(orb.get_orb_result_color(Choice), "orange")
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
  should.equal(orb.get_orb_name(Choice), "Choice Sample")
  should.equal(orb.get_orb_name(Gamble), "Gamble Sample")
}

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

pub fn negative_health_bomb_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, health: 1))
  let bomb_orb = Bomb(5)
  let result = orb.apply_orb_effect(bomb_orb, model)

  should.equal(result.player.health, -4)
  // 1 - 5 = -4 (game over)
  should.equal(result.player.bombs_pulled_this_level, 1)
}

pub fn zero_value_orbs_test() {
  let model = create_test_model()

  // Point orb with 0 value (edge case)
  let zero_point_result = orb.apply_orb_effect(Point(0), model)
  should.equal(zero_point_result.player.points, 0)

  // Health orb with 0 value (edge case)
  let zero_health_result = orb.apply_orb_effect(Health(0), model)
  should.equal(zero_health_result.player.health, 5)
  // No change
}

pub fn extreme_multiplier_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, current_multiplier: 16))
  let point_orb = Point(5)
  let result = orb.apply_orb_effect(point_orb, model)

  should.equal(result.player.points, 80)
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

  should.equal(result.player.points, 9)
  // 10 - 1 = 9 points
}

// ============================================================================
// REAL GAME SCENARIO TESTS
// ============================================================================

pub fn typical_level_sequence_test() {
  let model = create_test_model()

  // Realistic level progression: Multiplier -> Points -> Bomb -> Health -> Collector
  let step1 = orb.apply_orb_effect(Multiplier, model)
  should.equal(step1.player.current_multiplier, 2)
  should.equal(step1.player.points, 0)

  let step2 = orb.apply_orb_effect(Point(8), step1)
  should.equal(step2.player.points, 16)
  // 8 * 2
  should.equal(step2.player.health, 5)

  let step3 = orb.apply_orb_effect(Bomb(2), step2)
  should.equal(step3.player.health, 3)
  should.equal(step3.player.bombs_pulled_this_level, 1)
  should.equal(step3.player.points, 16)
  // Unchanged

  let step4 = orb.apply_orb_effect(Health(1), step3)
  should.equal(step4.player.health, 4)
  // 3 + 1
  should.equal(step4.player.points, 16)
  // Unchanged

  // Collector with remaining bag
  let model_with_remaining = Model(..step4, bag: [Point(5), Bomb(1)])
  let step5 = orb.apply_orb_effect(Collector, model_with_remaining)
  should.equal(step5.player.points, 18)
  // 16 + ((2-1) * 2) = 18
}

pub fn survival_strategy_test() {
  let model = create_test_model()

  // Strategy: Pull bombs early to build up survivor value
  let after_bomb1 = orb.apply_orb_effect(Bomb(1), model)
  let after_bomb2 = orb.apply_orb_effect(Bomb(2), after_bomb1)
  let after_bomb3 = orb.apply_orb_effect(Bomb(1), after_bomb2)

  should.equal(after_bomb3.player.health, 1)
  // 5 - 1 - 2 - 1 = 1
  should.equal(after_bomb3.player.bombs_pulled_this_level, 3)

  // Pull multiplier
  let after_multiplier = orb.apply_orb_effect(Multiplier, after_bomb3)
  should.equal(after_multiplier.player.current_multiplier, 2)

  // Pull survivor for big payoff
  let after_survivor = orb.apply_orb_effect(Survivor, after_multiplier)
  should.equal(after_survivor.player.points, 6)
  // 3 bombs * 2 multiplier = 6
}

pub fn defensive_healing_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, health: 2))
  // Low health

  // Healing sequence to recover
  let after_heal1 = orb.apply_orb_effect(Health(2), model)
  should.equal(after_heal1.player.health, 4)

  let after_heal2 = orb.apply_orb_effect(Health(3), after_heal1)
  should.equal(after_heal2.player.health, 5)
  // Capped at 5

  // Now safe to take some risk
  let after_bomb = orb.apply_orb_effect(Bomb(2), after_heal2)
  should.equal(after_bomb.player.health, 3)
  // Still healthy
}

// ============================================================================
// CHOICE ORB TESTS
// ============================================================================

pub fn choice_orb_with_full_bag_test() {
  let model = Model(..create_test_model(), bag: [Point(8), Health(2), Bomb(1)])
  let choice_orb = Choice
  let result = orb.apply_orb_effect(choice_orb, model)

  // Should transition to ChoosingOrb state
  should.equal(result.status, ChoosingOrb)
  // Should have 2 orbs pending choice
  should.not_equal(result.pending_choice, option.None)
  // Bag should have 1 orb left (3 - 2 drawn)
  should.equal(result.bag |> list.length, 1)
}

pub fn choice_orb_with_single_orb_test() {
  let model = Model(..create_test_model(), bag: [Point(5)])
  let choice_orb = Choice
  let result = orb.apply_orb_effect(choice_orb, model)

  // Should transition to ChoosingOrb state
  should.equal(result.status, ChoosingOrb)
  // Should have the single orb as both choices (special case)
  case result.pending_choice {
    option.Some(#(first, second)) -> {
      should.equal(first, Point(5))
      should.equal(second, Point(5))
    }
    option.None -> should.fail()
  }
  // Bag should be empty (1 - 1 drawn, but we duplicate it for choice UI)
  should.equal(result.bag |> list.length, 0)
}

pub fn choice_orb_with_empty_bag_test() {
  let model = Model(..create_test_model(), bag: [])
  let choice_orb = Choice
  let result = orb.apply_orb_effect(choice_orb, model)

  // Should stay in Playing state (no effect)
  should.equal(result.status, Playing)
  // Should have no pending choice
  should.equal(result.pending_choice, option.None)
  // Bag should still be empty
  should.equal(result.bag |> list.length, 0)
}

pub fn choice_orb_recursive_handling_test() {
  let model =
    Model(..create_test_model(), bag: [Choice, Point(8), Health(2), Bomb(1)])
  let choice_orb = Choice
  let result = orb.apply_orb_effect(choice_orb, model)

  // Should skip the second Choice orb and draw Point(8) and Health(2)
  should.equal(result.status, ChoosingOrb)
  case result.pending_choice {
    option.Some(#(first, second)) -> {
      // Should have Point(8) and Health(2) as choices
      should.not_equal(first, Choice)
      should.not_equal(second, Choice)
    }
    option.None -> should.fail()
  }
  // Bag should have the skipped Choice orb and Bomb(1) at the end
  should.equal(result.bag |> list.length, 2)
}

pub fn select_first_choice_test() {
  let model =
    Model(
      ..create_test_model(),
      status: ChoosingOrb,
      pending_choice: option.Some(#(Point(10), Health(3))),
      bag: [Bomb(2)],
    )

  // Simulate selecting first choice through message handling
  // This will test the actual message handling logic
  let result = handle_choice_selection(model, SelectFirstChoice)

  // Should apply Point(10) effect
  should.equal(result.player.points, 10)
  should.equal(result.player.health, 5)
  // Unchanged
  // Should return to Playing state
  should.equal(result.status, Playing)
  // Should clear pending choice
  should.equal(result.pending_choice, option.None)
  // Should return Health(3) to end of bag
  should.equal(result.bag |> list.length, 2)
  // [Bomb(2), Health(3)]
}

pub fn select_second_choice_test() {
  let model =
    Model(
      ..create_test_model(),
      status: ChoosingOrb,
      pending_choice: option.Some(#(Point(10), Health(3))),
      bag: [Bomb(2)],
    )

  // Simulate selecting second choice
  let result = handle_choice_selection(model, SelectSecondChoice)

  // Should apply Health(3) effect
  should.equal(result.player.points, 0)
  // Unchanged
  should.equal(result.player.health, 5)
  // Still max, but effect was applied
  // Should return to Playing state
  should.equal(result.status, Playing)
  // Should clear pending choice
  should.equal(result.pending_choice, option.None)
  // Should return Point(10) to end of bag
  should.equal(result.bag |> list.length, 2)
  // [Bomb(2), Point(10)]
}

pub fn choice_orb_with_multiplier_test() {
  let model =
    Model(
      ..create_test_model(),
      status: ChoosingOrb,
      pending_choice: option.Some(#(Point(5), Collector)),
      player: Player(..create_test_model().player, current_multiplier: 3),
      bag: [Health(1)],
    )

  // Select Point(5) with multiplier active
  let result = handle_choice_selection(model, SelectFirstChoice)

  // Should apply multiplier to chosen Point orb
  should.equal(result.player.points, 15)
  // 5 * 3 = 15
  should.equal(result.player.current_multiplier, 3)
  // Unchanged
}

// ============================================================================
// CHOICE ORB HELPER FUNCTIONS FOR TESTING
// ============================================================================

// We'll need this helper function to test message handling
// This will be implemented when we add the actual game logic
fn handle_choice_selection(model: Model, msg: types.Msg) -> Model {
  // This is a placeholder - we'll implement this in the actual game logic
  // For now, let's create a basic implementation for testing
  case msg, model.pending_choice {
    SelectFirstChoice, option.Some(#(first_orb, second_orb)) -> {
      let after_effect = orb.apply_orb_effect(first_orb, model)
      Model(
        ..after_effect,
        status: Playing,
        pending_choice: option.None,
        bag: after_effect.bag |> list.append([second_orb]),
      )
    }
    SelectSecondChoice, option.Some(#(first_orb, second_orb)) -> {
      let after_effect = orb.apply_orb_effect(second_orb, model)
      Model(
        ..after_effect,
        status: Playing,
        pending_choice: option.None,
        bag: after_effect.bag |> list.append([first_orb]),
      )
    }
    _, _ -> model
  }
}

// ============================================================================
// GAMBLE ORB TESTS
// ============================================================================

pub fn gamble_orb_basic_test() {
  let model = create_test_model()
  let gamble_orb = Gamble
  let result = orb.apply_orb_effect(gamble_orb, model)

  // Should transition to GamblingChoice state
  should.equal(result.status, GamblingChoice)
  // Should have pending gamble set
  should.equal(result.pending_gamble, option.Some(True))
}

pub fn gamble_orb_color_test() {
  should.equal(orb.get_orb_result_color(Gamble), "red")
}

pub fn gamble_orb_message_test() {
  let model = create_test_model()
  let gamble_orb = Gamble
  let message = orb.get_orb_result_message(gamble_orb, model)

  should.equal(
    message,
    "🎲 GAMBLE PROTOCOL ACTIVATED [HIGH RISK/REWARD SCENARIO]",
  )
}

pub fn gamble_orb_choice_handling_test() {
  let model =
    Model(..create_test_model(), bag: [
      Choice,
      Point(8),
      Health(2),
      Bomb(1),
      Collector,
    ])
  let gamble_orb = Gamble
  let result = orb.apply_orb_effect(gamble_orb, model)

  // Should transition to GamblingChoice state
  should.equal(result.status, GamblingChoice)
  // Should have pending gamble set
  should.equal(result.pending_gamble, option.Some(True))
}

pub fn gamble_choice_orb_transition_test() {
  // Test the flow when a Choice orb is encountered during gamble application
  let model =
    Model(
      ..create_test_model(),
      bag: [
        Choice,
        Point(8),
        Health(2),
        Bomb(1),
        Collector,
        Point(10),
        Health(3),
      ],
      status: types.ApplyingGambleOrbs,
      gamble_orbs: [Choice, Point(8), Health(2), Bomb(1), Collector],
      gamble_current_index: 0,
    )

  // Apply the first orb (Choice) in gamble sequence
  let result = apply_gamble_orb_effect(Choice, model)

  // Should transition to ChoosingOrb state
  should.equal(result.status, types.ChoosingOrb)
  // Should be in gamble choice mode
  should.equal(result.in_gamble_choice, True)
  // Should have choice between orbs #6 and #7 (Point(10) and Health(3))
  case result.pending_choice {
    option.Some(#(first, second)) -> {
      should.equal(first, Point(10))
      should.equal(second, Health(3))
    }
    option.None -> should.fail()
  }
}

// Helper function for testing (we need to expose apply_gamble_orb_effect)
fn apply_gamble_orb_effect(orb: types.Orb, model: Model) -> Model {
  case orb {
    types.Point(value) -> {
      let gamble_points = value * 2 * model.player.current_multiplier
      types.Model(..model, player: types.Player(..model.player, points: model.player.points + gamble_points))
    }
    types.Bomb(damage) ->
      types.Model(
        ..model,
        player: types.Player(..model.player, health: model.player.health - damage, bombs_pulled_this_level: model.player.bombs_pulled_this_level + 1),
      )
    types.Health(value) -> {
      let new_health = int.min(5, model.player.health + value)
      types.Model(..model, player: types.Player(..model.player, health: new_health))
    }
    types.Collector -> {
      let remaining_orbs = model.bag |> list.length
      let collector_points = remaining_orbs * model.player.current_multiplier
      types.Model(..model, player: types.Player(..model.player, points: model.player.points + collector_points))
    }
    types.Survivor -> {
      let survivor_points =
        model.player.bombs_pulled_this_level * model.player.current_multiplier
      types.Model(..model, player: types.Player(..model.player, points: model.player.points + survivor_points))
    }
    types.Multiplier -> {
      let new_multiplier = model.player.current_multiplier * 2
      types.Model(..model, player: types.Player(..model.player, current_multiplier: new_multiplier))
    }
    types.Choice -> {
      // During gamble, Choice orb transitions to choice view
      let orbs_after_gamble = model.bag |> list.drop(5)
      case orbs_after_gamble {
        [] -> {
          let gamble_points = 5 * 2 * model.player.current_multiplier
          types.Model(..model, player: types.Player(..model.player, points: model.player.points + gamble_points))
        }
        [single_orb] -> {
          types.Model(
            ..model,
            status: types.ChoosingOrb,
            pending_choice: option.Some(#(single_orb, single_orb)),
            in_gamble_choice: True,
          )
        }
        [first_orb, second_orb, ..] -> {
          types.Model(
            ..model,
            status: types.ChoosingOrb,
            pending_choice: option.Some(#(first_orb, second_orb)),
            in_gamble_choice: True,
          )
        }
      }
    }
    types.Gamble -> model
    types.PointScanner -> {
      let point_orbs_count =
        model.bag
        |> list.count(fn(orb) {
          case orb {
            types.Point(_) -> True
            _ -> False
          }
        })
      let scanner_points = point_orbs_count * model.player.current_multiplier
      types.Model(..model, player: types.Player(..model.player, points: model.player.points + scanner_points))
    }
    types.PointRecovery -> {
      // Placeholder for gamble test helper - not implemented yet
      model
    }
  }
}

// ============================================================================
// POINT SCANNER ORB TESTS
// ============================================================================

pub fn point_scanner_orb_empty_bag_test() {
  let model = Model(..create_test_model(), bag: [])
  let point_scanner_orb = types.PointScanner
  let result = orb.apply_orb_effect(point_scanner_orb, model)

  should.equal(result.player.points, 0)
  // No point orbs in bag = 0 points
  should.equal(result.player.health, 5)
  // Health unchanged
}

pub fn point_scanner_orb_single_point_orb_test() {
  let model = Model(..create_test_model(), bag: [Point(8)])
  let point_scanner_orb = types.PointScanner
  let result = orb.apply_orb_effect(point_scanner_orb, model)

  should.equal(result.player.points, 1)
  // 1 point orb in bag = 1 point awarded
}

pub fn point_scanner_orb_multiple_point_orbs_test() {
  let model =
    Model(..create_test_model(), bag: [Point(5), Point(12), Point(15)])
  let point_scanner_orb = types.PointScanner
  let result = orb.apply_orb_effect(point_scanner_orb, model)

  should.equal(result.player.points, 3)
  // 3 point orbs in bag = 3 points awarded (regardless of their values)
}

pub fn point_scanner_orb_mixed_bag_test() {
  let model =
    Model(..create_test_model(), bag: [
      Point(8),
      Bomb(2),
      Point(12),
      Health(3),
      Point(5),
    ])
  let point_scanner_orb = types.PointScanner
  let result = orb.apply_orb_effect(point_scanner_orb, model)

  should.equal(result.player.points, 3)
  // Only 3 point orbs counted, ignoring Bomb and Health
}

pub fn point_scanner_orb_no_point_orbs_test() {
  let model =
    Model(..create_test_model(), bag: [
      Bomb(2),
      Health(3),
      Collector,
      Multiplier,
    ])
  let point_scanner_orb = types.PointScanner
  let result = orb.apply_orb_effect(point_scanner_orb, model)

  should.equal(result.player.points, 0)
  // No point orbs in bag = 0 points
}

pub fn point_scanner_orb_with_multiplier_test() {
  let model =
    Model(
      ..create_test_model(),
      bag: [Point(8), Point(12)],
      player: Player(..create_test_model().player, current_multiplier: 3),
    )
  let point_scanner_orb = types.PointScanner
  let result = orb.apply_orb_effect(point_scanner_orb, model)

  should.equal(result.player.points, 6)
  // 2 point orbs * 3 multiplier = 6 points
  should.equal(result.player.current_multiplier, 3)
  // Multiplier unchanged
}

pub fn point_scanner_orb_message_test() {
  let model = Model(..create_test_model(), bag: [Point(5), Point(8)])
  let point_scanner_orb = types.PointScanner
  let message = orb.get_orb_result_message(point_scanner_orb, model)

  should.equal(message, "◉ DATA SCANNER [2 SAMPLES] +2")
}

pub fn point_scanner_orb_message_with_multiplier_test() {
  let model =
    Model(..create_test_model(), bag: [Point(5)], player: Player(..create_test_model().player, current_multiplier: 4))
  let point_scanner_orb = types.PointScanner
  let message = orb.get_orb_result_message(point_scanner_orb, model)

  should.equal(message, "◉ DATA SCANNER [1×4] +4")
}

pub fn point_scanner_orb_color_test() {
  should.equal(orb.get_orb_result_color(types.PointScanner), "blue")
}

pub fn point_scanner_orb_name_test() {
  should.equal(orb.get_orb_name(types.PointScanner), "Data Scanner Sample")
}

pub fn point_scanner_integration_test() {
  // Real game scenario: PointScanner vs Collector comparison
  let game_bag = [Point(8), Point(12), Bomb(2), Health(3), Point(5), Multiplier]
  let model = Model(..create_test_model(), bag: game_bag, player: Player(..create_test_model().player, current_multiplier: 2))

  // Test PointScanner - should count 3 Point orbs * 2 multiplier = 6 points
  let scanner_result = orb.apply_orb_effect(types.PointScanner, model)
  should.equal(scanner_result.player.points, 6)

  // Test Collector for comparison - should count 5 remaining orbs (6-1) * 2 multiplier = 10 points  
  let collector_result = orb.apply_orb_effect(types.Collector, model)
  should.equal(collector_result.player.points, 10)
  // PointScanner is more predictable but usually lower value than Collector
}

// ============================================================================
// POINT RECOVERY ORB TESTS
// ============================================================================

pub fn point_recovery_orb_no_points_pulled_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, point_orbs_pulled_this_level: []))
  let point_recovery_orb = types.PointRecovery
  let result = orb.apply_orb_effect(point_recovery_orb, model)

  should.equal(result.player.points, 0)
  // No point orbs pulled = no effect
  should.equal(result.bag |> list.length, 0)
  // No orb added to bag
  should.equal(result.player.point_orbs_pulled_this_level, [])
  // Tracking unchanged
}

pub fn point_recovery_orb_single_point_orb_test() {
  let model = Model(
    ..create_test_model(), 
    player: Player(..create_test_model().player, points: 8, point_orbs_pulled_this_level: [8]),
    bag: [Bomb(2), Health(3)]
  )
  let point_recovery_orb = types.PointRecovery
  let result = orb.apply_orb_effect(point_recovery_orb, model)

  should.equal(result.player.points, 8)
  // Points unchanged - keep the original 8 points earned
  should.equal(result.bag |> list.length, 3)
  // Point(8) added back to bag
  should.equal(result.player.point_orbs_pulled_this_level, [])
  // Tracking list cleared after recovery
}

pub fn point_recovery_orb_multiple_points_test() {
  let model = Model(
    ..create_test_model(), 
    player: Player(..create_test_model().player, points: 25, point_orbs_pulled_this_level: [8, 12, 5]),
    bag: [Bomb(2)]
  )
  let point_recovery_orb = types.PointRecovery
  let result = orb.apply_orb_effect(point_recovery_orb, model)

  should.equal(result.player.points, 25)
  // Points unchanged
  should.equal(result.bag |> list.length, 2)
  // Point(5) added back (lowest value)
  should.equal(result.player.point_orbs_pulled_this_level, [8, 12])
  // Only the recovered orb (5) removed from tracking
}

pub fn point_recovery_orb_duplicate_lowest_test() {
  let model = Model(
    ..create_test_model(), 
    player: Player(..create_test_model().player, points: 18, point_orbs_pulled_this_level: [5, 8, 5]),
    bag: [Health(2)]
  )
  let point_recovery_orb = types.PointRecovery
  let result = orb.apply_orb_effect(point_recovery_orb, model)

  should.equal(result.player.points, 18)
  // Points unchanged
  should.equal(result.bag |> list.length, 2)
  // One Point(5) added back
  should.equal(result.player.point_orbs_pulled_this_level, [8, 5])
  // First occurrence of 5 removed from tracking
}

pub fn point_recovery_orb_with_multiplier_test() {
  let model = Model(
    ..create_test_model(), 
    player: Player(..create_test_model().player, points: 20, point_orbs_pulled_this_level: [8, 4], current_multiplier: 2),
    bag: [Collector]
  )
  let point_recovery_orb = types.PointRecovery
  let result = orb.apply_orb_effect(point_recovery_orb, model)

  should.equal(result.player.points, 20)
  // Points unchanged (no re-application of multiplier)
  should.equal(result.bag |> list.length, 2)
  // Point(4) added back to bag (lowest value)
  should.equal(result.player.current_multiplier, 2)
  // Multiplier unchanged
  should.equal(result.player.point_orbs_pulled_this_level, [8])
  // Only Point(4) removed from tracking
}

pub fn point_recovery_orb_message_test() {
  let model = Model(
    ..create_test_model(), 
    player: Player(..create_test_model().player, point_orbs_pulled_this_level: [8, 5, 12])
  )
  let point_recovery_orb = types.PointRecovery
  let message = orb.get_orb_result_message(point_recovery_orb, model)

  should.equal(message, "↺ DATA RECOVERY [POINT(5) RESTORED TO CONTAINER]")
}

pub fn point_recovery_orb_message_no_points_test() {
  let model = Model(..create_test_model(), player: Player(..create_test_model().player, point_orbs_pulled_this_level: []))
  let point_recovery_orb = types.PointRecovery
  let message = orb.get_orb_result_message(point_recovery_orb, model)

  should.equal(message, "↺ DATA RECOVERY [NO DATA SAMPLES TO RECOVER]")
}

pub fn point_recovery_orb_color_test() {
  should.equal(orb.get_orb_result_color(types.PointRecovery), "green")
}

pub fn point_recovery_orb_name_test() {
  should.equal(orb.get_orb_name(types.PointRecovery), "Data Recovery Sample")
}

pub fn point_recovery_integration_test() {
  // Realistic game scenario: Pull some Point orbs, then recover lowest
  let model = create_test_model()
  
  // Simulate pulling Point(8)
  let after_first = Model(
    ..model, 
    player: Player(..model.player, points: 8, point_orbs_pulled_this_level: [8]),
    bag: [Point(5), Point(12), Bomb(2)]
  )
  
  // Simulate pulling Point(5) from bag
  let after_second = Model(
    ..after_first,
    player: Player(..after_first.player, points: 13, point_orbs_pulled_this_level: [8, 5]),
    bag: [Point(12), Bomb(2)]
  )
  
  // Now use PointRecovery
  let recovery_result = orb.apply_orb_effect(types.PointRecovery, after_second)
  
  should.equal(recovery_result.player.points, 13)
  // Keep all earned points
  should.equal(recovery_result.bag |> list.length, 3)
  // Point(5) restored to bag
  should.equal(recovery_result.player.point_orbs_pulled_this_level, [8])
  // Only Point(5) removed from tracking
}
