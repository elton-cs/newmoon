import display
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import types.{type Msg, type Orb, PullOrb, UpdateInputValue}

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
        "bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center border border-gray-200 flex flex-col gap-3",
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
  html.div([attribute.class("grid grid-cols-2 gap-3")], stats)
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

pub fn orb_result_display(
  orb: Option(Orb),
  message: Option(String),
) -> Element(Msg) {
  case orb, message {
    None, _ -> html.div([attribute.class("h-8")], [])
    Some(orb_value), Some(orb_message) -> {
      case orb_value {
        types.PointOrb(_) ->
          info_panel(orb_message, "text-gray-700", "bg-gray-50 border-gray-200")
        types.BombOrb(_) ->
          info_panel(
            orb_message,
            "text-gray-800",
            "bg-gray-100 border-gray-300",
          )
        types.HealthOrb(_) ->
          info_panel(
            orb_message,
            "text-green-700",
            "bg-green-50 border-green-200",
          )
        types.AllCollectorOrb ->
          info_panel(
            orb_message,
            "text-purple-700",
            "bg-purple-50 border-purple-200",
          )
        types.PointCollectorOrb ->
          info_panel(orb_message, "text-blue-700", "bg-blue-50 border-blue-200")
        types.BombSurvivorOrb ->
          info_panel(
            orb_message,
            "text-orange-700",
            "bg-orange-50 border-orange-200",
          )
        types.MultiplierOrb ->
          info_panel(
            orb_message,
            "text-yellow-700",
            "bg-yellow-50 border-yellow-200",
          )
        types.BombImmunityOrb ->
          info_panel(orb_message, "text-cyan-700", "bg-cyan-50 border-cyan-200")
      }
    }
    Some(orb_value), None -> {
      // Fallback to generating message if none stored
      let fallback_message = display.orb_result_message(orb_value)
      case orb_value {
        types.PointOrb(_) ->
          info_panel(
            fallback_message,
            "text-gray-700",
            "bg-gray-50 border-gray-200",
          )
        types.BombOrb(_) ->
          info_panel(
            fallback_message,
            "text-gray-800",
            "bg-gray-100 border-gray-300",
          )
        types.HealthOrb(_) ->
          info_panel(
            fallback_message,
            "text-green-700",
            "bg-green-50 border-green-200",
          )
        types.AllCollectorOrb ->
          info_panel(
            fallback_message,
            "text-purple-700",
            "bg-purple-50 border-purple-200",
          )
        types.PointCollectorOrb ->
          info_panel(
            fallback_message,
            "text-blue-700",
            "bg-blue-50 border-blue-200",
          )
        types.BombSurvivorOrb ->
          info_panel(
            fallback_message,
            "text-orange-700",
            "bg-orange-50 border-orange-200",
          )
        types.MultiplierOrb ->
          info_panel(
            fallback_message,
            "text-yellow-700",
            "bg-yellow-50 border-yellow-200",
          )
        types.BombImmunityOrb ->
          info_panel(
            fallback_message,
            "text-cyan-700",
            "bg-cyan-50 border-cyan-200",
          )
      }
    }
  }
}

fn info_panel(
  message: String,
  text_class: String,
  bg_class: String,
) -> Element(Msg) {
  html.div([attribute.class("p-3 " <> bg_class <> " rounded border")], [
    html.p([attribute.class(text_class <> " font-light text-sm")], [
      html.text(message),
    ]),
  ])
}

// Container Components

pub fn container_display(orbs_left: Int) -> Element(Msg) {
  html.div([attribute.class("p-4 bg-gray-50 rounded border border-gray-100")], [
    html.p(
      [attribute.class("text-gray-500 mb-2 text-sm font-light tracking-wide")],
      [html.text(display.container_label)],
    ),
    html.p([attribute.class("text-2xl font-light text-black")], [
      html.text(
        string.concat([int.to_string(orbs_left), display.specimens_suffix]),
      ),
    ]),
  ])
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
    [html.text(display.extract_button_text)],
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

pub fn success_button(text: String, msg: Msg) -> Element(Msg) {
  html.button(
    [
      attribute.class(
        "w-full bg-green-600 hover:bg-green-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider border-2 border-green-500 hover:border-green-600",
      ),
      event.on_click(msg),
    ],
    [html.text(text)],
  )
}

pub fn failure_button(text: String, msg: Msg) -> Element(Msg) {
  html.button(
    [
      attribute.class(
        "w-full bg-red-600 hover:bg-red-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider border-2 border-red-500 hover:border-red-600",
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
  html.div([attribute.class("p-6 " <> bg_class <> " rounded border")], [
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
  html.div([attribute.class("p-6 bg-red-50 border border-red-200 rounded")], [
    html.h2(
      [attribute.class("text-xl font-light text-red-800 mb-2 tracking-wide")],
      [html.text(title)],
    ),
    html.p([attribute.class("text-red-700 text-sm font-light")], [
      html.text(message),
    ]),
  ])
}

// Orb Testing Components

pub fn orb_selection_button(text: String, msg: Msg) -> Element(Msg) {
  html.button(
    [
      attribute.class(
        "w-full bg-purple-600 hover:bg-purple-700 text-white font-light py-3 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
      ),
      event.on_click(msg),
    ],
    [html.text(text)],
  )
}

// Input Components

pub fn number_input(value: String) -> Element(Msg) {
  html.div([attribute.class("mb-4")], [
    html.label(
      [
        attribute.class("block text-sm font-light text-gray-700 mb-2"),
        attribute.for("value-input"),
      ],
      [html.text("Value:")],
    ),
    html.input([
      attribute.id("value-input"),
      attribute.type_("number"),
      attribute.value(value),
      attribute.min("1"),
      attribute.placeholder("Enter a positive number"),
      attribute.class(
        "w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg",
      ),
      event.on_input(UpdateInputValue),
    ]),
  ])
}

pub fn testing_mode_indicator() -> Element(Msg) {
  html.div(
    [attribute.class("p-2 bg-yellow-50 border border-yellow-200 rounded")],
    [
      html.p(
        [attribute.class("text-yellow-700 font-medium text-xs tracking-wider")],
        [html.text(display.testing_mode_indicator)],
      ),
    ],
  )
}

// Status Effects Components

pub fn status_effects_display(status_effects: List(String)) -> Element(Msg) {
  case status_effects {
    [] -> html.div([attribute.class("h-0")], [])
    effects ->
      html.div(
        [attribute.class("flex flex-wrap gap-2")],
        list.map(effects, fn(effect_text) {
          html.div(
            [
              attribute.class(
                "px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 text-xs font-medium shadow-sm",
              ),
            ],
            [html.text(effect_text)],
          )
        }),
      )
  }
}
