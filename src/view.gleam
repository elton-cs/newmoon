import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import marketplace
import orb
import types.{type Model, type Msg, InMarketplace, Lost, NextLevel, Playing, PullOrb, RestartGame, Won}

pub fn view(model: Model) -> Element(Msg) {
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
    // Primary stats - most important for gameplay
    html.div([attribute.class("grid grid-cols-2 gap-3 mb-3")], [
      view_stat_card("○", "SYSTEMS", int.to_string(model.health), "text-black"),
      view_stat_card("●", "DATA", int.to_string(model.points), "text-gray-700"),
    ]),
    // Secondary stats - progression and resources
    html.div([attribute.class("grid grid-cols-3 gap-2 mb-4")], [
      view_stat_card(
        "◎",
        "TARGET",
        int.to_string(model.milestone),
        "text-gray-600",
      ),
      view_stat_card("◉", "SECTOR", int.to_string(model.level), "text-gray-500"),
      view_stat_card("◈", "CREDITS", int.to_string(model.credits), "text-purple-600"),
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

pub fn view_result_card(
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
    InMarketplace -> marketplace.view_marketplace(model)
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
      let message = orb.get_orb_result_message(orb, model)
      let color = orb.get_orb_result_color(orb)
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
        html.p([attribute.class("text-gray-600 text-sm font-light mb-2")], [
          html.text(
            string.concat([
              "Data target achieved: ",
              int.to_string(model.milestone),
              " units",
            ]),
          ),
        ]),
        html.p([attribute.class("text-purple-600 text-sm font-light")], [
          html.text("Credits earned: +" <> int.to_string(model.points)),
        ]),
      ],
    ),
    html.div([attribute.class("space-y-3")], [
      html.button(
        [
          attribute.class(
            "w-full bg-purple-600 hover:bg-purple-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
          ),
          event.on_click(types.EnterMarketplace),
        ],
        [html.text("VISIT MARKETPLACE")],
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
    ]),
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

