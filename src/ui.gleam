import gleam/int
import gleam/option.{type Option, None, Some}
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import types.{type Msg, type Orb, BombOrb, PointOrb, PullOrb}

// Layout Components

pub fn app_container(content: Element(Msg)) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4",
      ),
    ],
    [content],
  )
}

pub fn game_card(content: List(Element(Msg))) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center border border-gray-200",
      ),
    ],
    content,
  )
}

// Header Components

pub fn game_header() -> Element(Msg) {
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

// Stat Display Components

pub fn stats_grid(stats: List(Element(Msg))) -> Element(Msg) {
  html.div([attribute.class("grid grid-cols-2 gap-3 mb-8")], stats)
}

pub fn stat_card(
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

// Feedback Components

pub fn orb_result_display(orb: Option(Orb)) -> Element(Msg) {
  case orb {
    None -> html.div([attribute.class("h-8 mb-4")], [])
    Some(PointOrb) ->
      info_panel(
        "● DATA ACQUIRED +1",
        "text-gray-700",
        "bg-gray-50 border-gray-200",
      )
    Some(BombOrb) ->
      info_panel(
        "○ SYSTEM DAMAGE -1",
        "text-gray-800",
        "bg-gray-100 border-gray-300",
      )
  }
}

fn info_panel(
  message: String,
  text_class: String,
  bg_class: String,
) -> Element(Msg) {
  html.div([attribute.class("mb-4 p-3 " <> bg_class <> " rounded border")], [
    html.p([attribute.class(text_class <> " font-light text-sm")], [
      html.text(message),
    ]),
  ])
}

// Container Components

pub fn container_display(orbs_left: Int) -> Element(Msg) {
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

// Button Components

pub fn extract_button(is_disabled: Bool) -> Element(Msg) {
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

pub fn primary_button(text: String, msg: Msg) -> Element(Msg) {
  html.button(
    [
      attribute.class(
        "w-full bg-black hover:bg-gray-800 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
      ),
      event.on_click(msg),
    ],
    [html.text(text)],
  )
}

pub fn secondary_button(text: String, msg: Msg) -> Element(Msg) {
  html.button(
    [
      attribute.class(
        "w-full bg-gray-800 hover:bg-black text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
      ),
      event.on_click(msg),
    ],
    [html.text(text)],
  )
}

// Status Display Components

pub fn status_panel(
  title: String,
  message: String,
  bg_class: String,
) -> Element(Msg) {
  html.div([attribute.class("mb-6 p-6 " <> bg_class <> " rounded border")], [
    html.h2(
      [attribute.class("text-xl font-light text-black mb-2 tracking-wide")],
      [html.text(title)],
    ),
    html.p([attribute.class("text-gray-600 text-sm font-light")], [
      html.text(message),
    ]),
  ])
}

pub fn failure_panel(title: String, message: String) -> Element(Msg) {
  html.div(
    [attribute.class("mb-6 p-6 bg-gray-100 border border-gray-300 rounded")],
    [
      html.h2(
        [attribute.class("text-xl font-light text-black mb-2 tracking-wide")],
        [html.text(title)],
      ),
      html.p([attribute.class("text-gray-700 text-sm font-light")], [
        html.text(message),
      ]),
    ],
  )
}