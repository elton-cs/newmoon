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
  PointOrb
  BombOrb
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
  )
}

fn init(_) -> Model {
  Model(
    health: 5,
    points: 0,
    level: 1,
    milestone: 5,
    bag: create_bag(),
    status: Playing,
    last_orb: None,
  )
}

fn create_bag() -> List(Orb) {
  list.append(list.repeat(PointOrb, 5), list.repeat(BombOrb, 5))
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
            PointOrb -> Model(..model, points: model.points + 1)
            BombOrb -> Model(..model, health: model.health - 1)
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
  Model(
    health: 5,
    points: 0,
    level: model.level + 1,
    milestone: model.milestone + 2,
    bag: create_bag(),
    status: Playing,
    last_orb: None,
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
        "min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4",
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
  html.div([attribute.class("grid grid-cols-2 gap-3 mb-8")], [
    view_stat_card("○", "SYSTEMS", int.to_string(model.health), "text-black"),
    view_stat_card("●", "DATA", int.to_string(model.points), "text-gray-700"),
    view_stat_card(
      "◎",
      "TARGET",
      int.to_string(model.milestone),
      "text-gray-600",
    ),
    view_stat_card("◉", "SECTOR", int.to_string(model.level), "text-gray-500"),
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
    Some(PointOrb) ->
      html.div(
        [attribute.class("mb-4 p-3 bg-gray-50 border border-gray-200 rounded")],
        [
          html.p([attribute.class("text-gray-700 font-light text-sm")], [
            html.text("● DATA ACQUIRED +1"),
          ]),
        ],
      )
    Some(BombOrb) ->
      html.div(
        [attribute.class("mb-4 p-3 bg-gray-100 border border-gray-300 rounded")],
        [
          html.p([attribute.class("text-gray-800 font-light text-sm")], [
            html.text("○ SYSTEM DAMAGE -1"),
          ]),
        ],
      )
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
