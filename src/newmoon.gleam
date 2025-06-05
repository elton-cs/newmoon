import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import lustre
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

pub fn main() -> Nil {
  let assert Ok(_) =
    lustre.simple(init, update, view) |> lustre.start("#app", Nil)

  Nil
}

type Orb {
  Bomb(Int)
  Point(Int)
  Health(Int)
  Collector
  Survivor
  Multiplier
}

fn get_orb_result_message(orb: Orb, model: Model) -> String {
  case orb {
    Point(value) -> {
      let multiplied_value = value * model.current_multiplier
      case model.current_multiplier > 1 {
        True ->
          "● DATA PACKET ["
          <> int.to_string(value)
          <> "×"
          <> int.to_string(model.current_multiplier)
          <> "] +"
          <> int.to_string(multiplied_value)
        False -> "● DATA PACKET ACQUIRED +" <> int.to_string(value)
      }
    }
    Bomb(damage) ->
      "○ HULL BREACH [SEVERITY-"
      <> int.to_string(damage)
      <> "] -"
      <> int.to_string(damage)
      <> " SYS"
    Health(value) ->
      "+ NANO-REPAIR DEPLOYED [EFFICIENCY-"
      <> int.to_string(value)
      <> "] +"
      <> int.to_string(value)
      <> " SYS"
    Collector -> {
      let base_points = list.length(model.bag)
      let multiplied_points = base_points * model.current_multiplier
      case model.current_multiplier > 1 {
        True ->
          "◯ DEEP SCAN ["
          <> int.to_string(base_points)
          <> "×"
          <> int.to_string(model.current_multiplier)
          <> "] +"
          <> int.to_string(multiplied_points)
        False -> "◯ DEEP SCAN COMPLETE +" <> int.to_string(base_points)
      }
    }
    Survivor -> {
      let base_points = model.bombs_pulled_this_level
      let multiplied_points = base_points * model.current_multiplier
      case model.current_multiplier > 1 {
        True ->
          "◈ DAMAGE ANALYSIS ["
          <> int.to_string(base_points)
          <> "×"
          <> int.to_string(model.current_multiplier)
          <> "] +"
          <> int.to_string(multiplied_points)
        False -> "◈ DAMAGE ANALYSIS +" <> int.to_string(base_points)
      }
    }
    Multiplier ->
      "✱ SIGNAL BOOST ["
      <> int.to_string(model.current_multiplier)
      <> "× AMPLIFICATION ACTIVE]"
  }
}

fn get_orb_result_color(orb: Orb) -> String {
  case orb {
    Point(_) -> "gray"
    Bomb(_) -> "default"
    Health(_) -> "green"
    Collector -> "blue"
    Survivor -> "purple"
    Multiplier -> "yellow"
  }
}

type GameStatus {
  Playing
  Won
  Lost
}

type Model {
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
  )
}

fn init(_) -> Model {
  Model(
    health: 5,
    points: 0,
    level: 1,
    milestone: 100,
    bag: create_level_bag(1),
    status: Playing,
    last_orb: None,
    bombs_pulled_this_level: 0,
    current_multiplier: 1,
  )
}

fn create_level_bag(level: Int) -> List(Orb) {
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

type Msg {
  PullOrb
  NextLevel
  RestartGame
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    PullOrb -> handle_pull_orb(model)
    NextLevel -> handle_next_level(model)
    RestartGame -> init(Nil)
  }
}

fn handle_pull_orb(model: Model) -> Model {
  case model.status {
    Playing -> {
      case model.bag {
        [] -> model
        [first_orb, ..rest] -> {
          let new_model = case first_orb {
            Point(value) -> {
              let multiplied_points = value * model.current_multiplier
              Model(..model, points: model.points + multiplied_points)
            }
            Bomb(damage) ->
              Model(
                ..model,
                health: model.health - damage,
                bombs_pulled_this_level: model.bombs_pulled_this_level + 1,
              )
            Health(value) -> {
              // Health orbs restore health up to maximum of 5, consumed even if no healing occurs
              let new_health = int.min(5, model.health + value)
              Model(..model, health: new_health)
            }
            Collector -> {
              // Collector grants 1 point per remaining orb (excluding itself) with multiplier
              let remaining_orbs = list.length(model.bag) - 1
              let collector_points = remaining_orbs * model.current_multiplier
              Model(..model, points: model.points + collector_points)
            }
            Survivor -> {
              // Survivor grants 1 point per bomb previously pulled in current level with multiplier
              let survivor_points =
                model.bombs_pulled_this_level * model.current_multiplier
              Model(..model, points: model.points + survivor_points)
            }
            Multiplier -> {
              // Multiplier doubles the current multiplier (1x → 2x → 4x → 8x, etc.)
              let new_multiplier = model.current_multiplier * 2
              Model(..model, current_multiplier: new_multiplier)
            }
          }

          let updated_model =
            Model(..new_model, bag: rest, last_orb: Some(first_orb))

          check_game_status(updated_model)
        }
      }
    }
    _ -> model
  }
}

fn handle_next_level(model: Model) -> Model {
  let new_level = model.level + 1
  Model(
    health: 5,
    points: 0,
    level: new_level,
    milestone: model.milestone + 200,
    bag: create_level_bag(new_level),
    status: Playing,
    last_orb: None,
    bombs_pulled_this_level: 0,
    current_multiplier: 1,
  )
}

fn check_game_status(model: Model) -> Model {
  case model.health <= 0, model.points >= model.milestone {
    True, _ -> Model(..model, status: Lost)
    False, True -> Model(..model, status: Won)
    False, False -> model
  }
}

fn view(model: Model) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "min-h-screen bg-gradient-to-br from-gray-500 via-black to-gray-800 flex items-center justify-center p-4",
      ),
    ],
    [view_game_card(model)],
  )
}

fn view_game_card(model: Model) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center border border-gray-200",
      ),
    ],
    [view_header(), view_game_stats(model), view_game_content(model)],
  )
}

fn view_header() -> Element(Msg) {
  html.div([], [
    html.h1(
      [attribute.class("text-3xl font-light text-black mb-2 tracking-wide")],
      [html.text("NEW MOON")],
    ),
    html.p(
      [attribute.class("text-sm text-gray-500 mb-6 font-light tracking-wider")],
      [html.text("DEEP SPACE EXPLORATION")],
    ),
  ])
}

fn view_game_stats(model: Model) -> Element(Msg) {
  html.div([], [
    // Main stats grid
    html.div([attribute.class("grid grid-cols-2 gap-3 mb-4")], [
      view_stat_card("○", "SYSTEMS", int.to_string(model.health), "text-black"),
      view_stat_card("●", "DATA", int.to_string(model.points), "text-gray-700"),
      view_stat_card(
        "◎",
        "TARGET",
        int.to_string(model.milestone),
        "text-gray-600",
      ),
      view_stat_card("◉", "SECTOR", int.to_string(model.level), "text-gray-500"),
    ]),
    // Multiplier status (only shown when active)
    view_multiplier_status(model),
  ])
}

fn view_stat_card(
  symbol: String,
  label: String,
  value: String,
  color_class: String,
) -> Element(Msg) {
  html.div([attribute.class("bg-gray-50 rounded border border-gray-100 p-4")], [
    html.div([attribute.class("text-lg font-light mb-1")], [html.text(symbol)]),
    html.div(
      [
        attribute.class(
          "text-xs text-gray-400 uppercase tracking-widest mb-1 font-light",
        ),
      ],
      [html.text(label)],
    ),
    html.div(
      [attribute.class(string.concat(["text-2xl font-light ", color_class]))],
      [html.text(value)],
    ),
  ])
}

fn view_multiplier_status(model: Model) -> Element(Msg) {
  case model.current_multiplier > 1 {
    True ->
      view_result_card(
        "✱ SIGNAL AMPLIFICATION ACTIVE: "
          <> int.to_string(model.current_multiplier)
          <> "× DATA BOOST",
        "yellow",
        True,
      )
    False -> html.div([], [])
  }
}

fn view_result_card(
  message: String,
  color: String,
  centered: Bool,
) -> Element(Msg) {
  let base_classes = "mb-4 p-3 rounded"
  let center_class = case centered {
    True -> " text-center"
    False -> ""
  }
  let color_classes = case color {
    "gray" -> " bg-gray-50 border border-gray-200"
    "green" -> " bg-green-50 border border-green-200"
    "blue" -> " bg-blue-50 border border-blue-200"
    "purple" -> " bg-purple-50 border border-purple-200"
    "yellow" -> " bg-yellow-50 border border-yellow-200"
    _ -> " bg-gray-100 border border-gray-300"
  }
  let text_color_class = case color {
    "gray" -> "text-gray-700"
    "green" -> "text-green-700"
    "blue" -> "text-blue-700"
    "purple" -> "text-purple-700"
    "yellow" -> "text-yellow-700"
    _ -> "text-gray-800"
  }

  html.div([attribute.class(base_classes <> color_classes <> center_class)], [
    html.p([attribute.class(text_color_class <> " font-light text-sm")], [
      html.text(message),
    ]),
  ])
}

fn view_game_content(model: Model) -> Element(Msg) {
  case model.status {
    Playing -> view_playing_state(model)
    Won -> view_won_state(model)
    Lost -> view_lost_state()
  }
}

fn view_playing_state(model: Model) -> Element(Msg) {
  html.div([], [
    view_last_orb_result(model),
    view_bag_info(model),
    view_pull_orb_button(model),
  ])
}

fn view_last_orb_result(model: Model) -> Element(Msg) {
  case model.last_orb {
    None -> html.div([attribute.class("h-8 mb-4")], [])
    Some(orb) -> {
      let message = get_orb_result_message(orb, model)
      let color = get_orb_result_color(orb)
      view_result_card(message, color, False)
    }
  }
}

fn view_bag_info(model: Model) -> Element(Msg) {
  let orbs_left = list.length(model.bag)

  html.div(
    [attribute.class("mb-6 p-4 bg-gray-50 rounded border border-gray-100")],
    [
      html.p(
        [attribute.class("text-gray-500 mb-2 text-sm font-light tracking-wide")],
        [html.text("SAMPLE CONTAINER")],
      ),
      html.p([attribute.class("text-2xl font-light text-black")], [
        html.text(string.concat([int.to_string(orbs_left), " specimens"])),
      ]),
    ],
  )
}

fn view_pull_orb_button(model: Model) -> Element(Msg) {
  let is_disabled = list.is_empty(model.bag)
  let button_classes = case is_disabled {
    True -> "bg-gray-200 cursor-not-allowed text-gray-400 border-gray-200"
    False ->
      "bg-black hover:bg-gray-800 text-white border-black hover:scale-[1.02]"
  }

  html.button(
    [
      attribute.class(
        string.concat([
          "w-full py-4 px-6 rounded border font-light text-sm tracking-wider transition transform ",
          button_classes,
        ]),
      ),
      event.on_click(PullOrb),
    ],
    [html.text("EXTRACT SAMPLE")],
  )
}

fn view_won_state(model: Model) -> Element(Msg) {
  html.div([attribute.class("text-center")], [
    html.div(
      [attribute.class("mb-6 p-6 bg-gray-50 border border-gray-200 rounded")],
      [
        html.h2(
          [attribute.class("text-xl font-light text-black mb-2 tracking-wide")],
          [html.text("SECTOR COMPLETE")],
        ),
        html.p([attribute.class("text-gray-600 text-sm font-light")], [
          html.text(
            string.concat([
              "Data target achieved: ",
              int.to_string(model.milestone),
              " units",
            ]),
          ),
        ]),
      ],
    ),
    html.button(
      [
        attribute.class(
          "w-full bg-black hover:bg-gray-800 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
        ),
        event.on_click(NextLevel),
      ],
      [html.text("ADVANCE TO NEXT SECTOR")],
    ),
  ])
}

fn view_lost_state() -> Element(Msg) {
  html.div([attribute.class("text-center")], [
    html.div(
      [attribute.class("mb-6 p-6 bg-gray-100 border border-gray-300 rounded")],
      [
        html.h2(
          [attribute.class("text-xl font-light text-black mb-2 tracking-wide")],
          [html.text("MISSION FAILED")],
        ),
        html.p([attribute.class("text-gray-700 text-sm font-light")], [
          html.text("All systems compromised. Initiating reset protocol."),
        ]),
      ],
    ),
    html.button(
      [
        attribute.class(
          "w-full bg-gray-800 hover:bg-black text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
        ),
        event.on_click(RestartGame),
      ],
      [html.text("🔄 Play Again")],
    ),
  ])
}
