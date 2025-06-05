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
        "min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4",
      ),
    ],
    [view_game_card(model)],
  )
}

fn view_game_card(model: Model) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-700",
      ),
    ],
    [view_header(), view_game_stats(model), view_game_content(model)],
  )
}

fn view_header() -> Element(Msg) {
  html.h1(
    [
      attribute.class(
        "text-4xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent",
      ),
    ],
    [html.text("NEWMOON")],
  )
}

fn view_game_stats(model: Model) -> Element(Msg) {
  html.div([attribute.class("grid grid-cols-2 gap-4 mb-6")], [
    view_stat_card("❤️", "Health", int.to_string(model.health), "text-red-400"),
    view_stat_card(
      "⭐",
      "Points",
      int.to_string(model.points),
      "text-yellow-400",
    ),
    view_stat_card(
      "🎯",
      "Goal",
      int.to_string(model.milestone),
      "text-green-400",
    ),
    view_stat_card("📊", "Level", int.to_string(model.level), "text-blue-400"),
  ])
}

fn view_stat_card(
  emoji: String,
  label: String,
  value: String,
  color_class: String,
) -> Element(Msg) {
  html.div(
    [attribute.class("bg-gray-800 rounded-lg p-3 border border-gray-600")],
    [
      html.div([attribute.class("text-lg")], [html.text(emoji)]),
      html.div(
        [attribute.class("text-xs text-gray-400 uppercase tracking-wide")],
        [html.text(label)],
      ),
      html.div(
        [attribute.class(string.concat(["text-xl font-bold ", color_class]))],
        [html.text(value)],
      ),
    ],
  )
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
    None -> html.div([attribute.class("h-12")], [])
    Some(PointOrb) ->
      html.div(
        [
          attribute.class(
            "mb-4 p-3 bg-green-900 border border-green-600 rounded-lg",
          ),
        ],
        [
          html.p([attribute.class("text-green-300 font-bold")], [
            html.text("🌟 Point Orb! +1 Point"),
          ]),
        ],
      )
    Some(BombOrb) ->
      html.div(
        [
          attribute.class(
            "mb-4 p-3 bg-red-900 border border-red-600 rounded-lg",
          ),
        ],
        [
          html.p([attribute.class("text-red-300 font-bold")], [
            html.text("💥 Bomb Orb! -1 Health"),
          ]),
        ],
      )
  }
}

fn view_bag_info(model: Model) -> Element(Msg) {
  let orbs_left = list.length(model.bag)

  html.div(
    [attribute.class("mb-6 p-4 bg-gray-800 rounded-lg border border-gray-600")],
    [
      html.p([attribute.class("text-gray-300 mb-2")], [
        html.text("🎒 Mystical Bag"),
      ]),
      html.p([attribute.class("text-2xl font-bold text-purple-400")], [
        html.text(string.concat([int.to_string(orbs_left), " orbs remaining"])),
      ]),
    ],
  )
}

fn view_pull_orb_button(model: Model) -> Element(Msg) {
  let is_disabled = list.is_empty(model.bag)
  let button_classes = case is_disabled {
    True -> "bg-gray-600 cursor-not-allowed text-gray-400"
    False -> "bg-purple-600 hover:bg-purple-700 text-white hover:scale-105"
  }

  html.button(
    [
      attribute.class(
        string.concat([
          "w-full py-4 px-6 rounded-lg font-bold text-lg transition transform ",
          button_classes,
        ]),
      ),
      event.on_click(PullOrb),
    ],
    [html.text("🔮 Pull an Orb")],
  )
}

fn view_won_state(model: Model) -> Element(Msg) {
  html.div([attribute.class("text-center")], [
    html.div(
      [
        attribute.class(
          "mb-6 p-6 bg-green-900 border border-green-600 rounded-lg",
        ),
      ],
      [
        html.h2([attribute.class("text-2xl font-bold text-green-300 mb-2")], [
          html.text("🎉 Level Complete!"),
        ]),
        html.p([attribute.class("text-green-400")], [
          html.text(
            string.concat([
              "You reached ",
              int.to_string(model.milestone),
              " points!",
            ]),
          ),
        ]),
      ],
    ),
    html.button(
      [
        attribute.class(
          "w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105",
        ),
        event.on_click(NextLevel),
      ],
      [html.text("🚀 Next Level")],
    ),
  ])
}

fn view_lost_state() -> Element(Msg) {
  html.div([attribute.class("text-center")], [
    html.div(
      [attribute.class("mb-6 p-6 bg-red-900 border border-red-600 rounded-lg")],
      [
        html.h2([attribute.class("text-2xl font-bold text-red-300 mb-2")], [
          html.text("💀 Game Over!"),
        ]),
        html.p([attribute.class("text-red-400")], [
          html.text("Your health reached zero. Try again!"),
        ]),
      ],
    ),
    html.button(
      [
        attribute.class(
          "w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105",
        ),
        event.on_click(RestartGame),
      ],
      [html.text("🔄 Play Again")],
    ),
  ])
}
