import display
import gleam/float
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import types.{
  type Msg, type Orb, type Screen, type StatusDuration, type StatusEffect,
  AllCollectorOrb, BombImmunity, BombImmunityOrb, BombOrb, BombSurvivorOrb,
  ChoiceOrb, ChooseOrb, Countdown, HealthOrb, MultiplierOrb, NextPointMultiplier,
  NextPointMultiplierOrb, Permanent, PointCollectorOrb, PointMultiplier,
  PointOrb, PointRecoveryOrb, PullOrb, PullRiskOrb, RiskOrb, ToggleDevMode,
  Triggered,
}

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
  html.div([attribute.class("grid grid-cols-2 grid-rows-3 gap-3")], stats)
}

pub fn marketplace_grid(items: List(Element(Msg))) -> Element(Msg) {
  html.div([attribute.class("grid grid-cols-3 grid-rows-2 gap-3")], items)
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

pub fn status_stat_card(status_effects: List(String)) -> Element(Msg) {
  let status_text = case status_effects {
    [] -> "NONE"
    effects ->
      effects
      |> list.take(2)
      |> string.join(" • ")
  }

  html.div([attribute.class("bg-gray-50 rounded border border-gray-100 p-4")], [
    html.div([attribute.class("text-lg font-light mb-1")], [html.text("◈")]),
    html.div(
      [
        attribute.class(
          "text-xs text-gray-400 uppercase tracking-widest mb-1 font-light",
        ),
      ],
      [html.text("STATUS")],
    ),
    html.div(
      [attribute.class("text-sm font-light text-gray-600 leading-tight")],
      [html.text(status_text)],
    ),
  ])
}

pub fn marketplace_item_card(
  symbol: String,
  name: String,
  price: Int,
  can_afford: Bool,
  purchase_msg: Msg,
) -> Element(Msg) {
  let purchase_classes = case can_afford {
    True -> "bg-gray-700 hover:bg-black text-white cursor-pointer"
    False -> "bg-gray-300 text-gray-500 cursor-not-allowed"
  }

  html.div([attribute.class("bg-gray-50 rounded border border-gray-100 p-4")], [
    html.div([attribute.class("text-lg font-light mb-1")], [html.text(symbol)]),
    html.div(
      [
        attribute.class(
          "text-xs text-gray-400 uppercase tracking-widest mb-2 font-light",
        ),
      ],
      [html.text(name)],
    ),
    html.button(
      [
        attribute.class(
          "w-full text-xs font-light uppercase tracking-wider py-2 px-3 rounded transition-colors "
          <> purchase_classes,
        ),
        attribute.disabled(!can_afford),
        event.on_click(purchase_msg),
      ],
      [html.text(int.to_string(price) <> " CREDITS")],
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
        types.AllCollectorOrb(_) ->
          info_panel(
            orb_message,
            "text-purple-700",
            "bg-purple-50 border-purple-200",
          )
        types.PointCollectorOrb(_) ->
          info_panel(orb_message, "text-blue-700", "bg-blue-50 border-blue-200")
        types.BombSurvivorOrb(_) ->
          info_panel(
            orb_message,
            "text-orange-700",
            "bg-orange-50 border-orange-200",
          )
        types.MultiplierOrb(_) ->
          info_panel(
            orb_message,
            "text-yellow-700",
            "bg-yellow-50 border-yellow-200",
          )
        types.NextPointMultiplierOrb(_) ->
          info_panel(
            orb_message,
            "text-orange-700",
            "bg-orange-50 border-orange-200",
          )
        types.BombImmunityOrb ->
          info_panel(orb_message, "text-cyan-700", "bg-cyan-50 border-cyan-200")
        types.ChoiceOrb ->
          info_panel(
            orb_message,
            "text-indigo-700",
            "bg-indigo-50 border-indigo-200",
          )
        types.RiskOrb ->
          info_panel(
            orb_message,
            "text-orange-700",
            "bg-orange-50 border-orange-200",
          )
        types.PointRecoveryOrb ->
          info_panel(orb_message, "text-teal-700", "bg-teal-50 border-teal-200")
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
        types.AllCollectorOrb(_) ->
          info_panel(
            fallback_message,
            "text-purple-700",
            "bg-purple-50 border-purple-200",
          )
        types.PointCollectorOrb(_) ->
          info_panel(
            fallback_message,
            "text-blue-700",
            "bg-blue-50 border-blue-200",
          )
        types.BombSurvivorOrb(_) ->
          info_panel(
            fallback_message,
            "text-orange-700",
            "bg-orange-50 border-orange-200",
          )
        types.MultiplierOrb(_) ->
          info_panel(
            fallback_message,
            "text-yellow-700",
            "bg-yellow-50 border-yellow-200",
          )
        types.NextPointMultiplierOrb(_) ->
          info_panel(
            fallback_message,
            "text-orange-700",
            "bg-orange-50 border-orange-200",
          )
        types.BombImmunityOrb ->
          info_panel(
            fallback_message,
            "text-cyan-700",
            "bg-cyan-50 border-cyan-200",
          )
        types.ChoiceOrb ->
          info_panel(
            fallback_message,
            "text-indigo-700",
            "bg-indigo-50 border-indigo-200",
          )
        types.RiskOrb ->
          info_panel(
            fallback_message,
            "text-orange-700",
            "bg-orange-50 border-orange-200",
          )
        types.PointRecoveryOrb ->
          info_panel(
            fallback_message,
            "text-teal-700",
            "bg-teal-50 border-teal-200",
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

// Choice Orb Display - shows two orb options side by side as clickable buttons
pub fn choice_orb_display(
  choice_orb_1: Option(Orb),
  choice_orb_2: Option(Orb),
) -> Element(Msg) {
  case choice_orb_1, choice_orb_2 {
    Some(first_choice), Some(second_choice) ->
      html.div(
        [attribute.class("p-3 bg-gray-50 rounded border border-gray-200")],
        [
          html.p(
            [
              attribute.class(
                "text-gray-700 font-light text-sm uppercase tracking-wider mb-3",
              ),
            ],
            [html.text("◈ CHOICE PORTAL ACTIVATED")],
          ),
          html.div([attribute.class("grid grid-cols-2 gap-2")], [
            html.button(
              [
                attribute.class(
                  "p-3 bg-white hover:bg-gray-100 rounded border border-gray-300 text-left transition-colors",
                ),
                event.on_click(ChooseOrb(0)),
              ],
              [
                html.p(
                  [
                    attribute.class(
                      "text-sm font-light text-gray-900 uppercase tracking-wider",
                    ),
                  ],
                  [html.text(display.orb_choice_display(first_choice))],
                ),
              ],
            ),
            html.button(
              [
                attribute.class(
                  "p-3 bg-white hover:bg-gray-100 rounded border border-gray-300 text-left transition-colors",
                ),
                event.on_click(ChooseOrb(1)),
              ],
              [
                html.p(
                  [
                    attribute.class(
                      "text-sm font-light text-gray-900 uppercase tracking-wider",
                    ),
                  ],
                  [html.text(display.orb_choice_display(second_choice))],
                ),
              ],
            ),
          ]),
        ],
      )
    _, _ ->
      info_panel(
        "CHOICE ERROR - No choice options available.",
        "text-red-700",
        "bg-red-50 border-red-200",
      )
  }
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

pub fn purchase_button(
  item_name: String,
  cost_text: String,
  can_afford: Bool,
  msg: Msg,
) -> Element(Msg) {
  let button_classes = case can_afford {
    True ->
      "bg-purple-600 hover:bg-purple-700 text-white border-purple-500 hover:border-purple-600"
    False -> "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
  }

  html.button(
    [
      attribute.class(
        string.concat([
          "w-full font-light py-4 px-6 rounded transition transform text-sm tracking-wider border-2 ",
          button_classes,
          case can_afford {
            True -> " hover:scale-[1.02]"
            False -> ""
          },
        ]),
      ),
      attribute.disabled(!can_afford),
      event.on_click(msg),
    ],
    [
      html.div([attribute.class("flex justify-between items-center")], [
        html.span([], [html.text(item_name)]),
        html.span([attribute.class("text-xs opacity-75")], [
          html.text(cost_text),
        ]),
      ]),
    ],
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

// Pulled Orbs Log Components

pub fn pulled_orbs_log(pulled_orbs: List(Orb)) -> Element(Msg) {
  case pulled_orbs {
    [] -> html.div([attribute.class("h-0")], [])
    _orbs ->
      html.div(
        [attribute.class("p-3 bg-gray-50 border border-gray-200 rounded")],
        [
          html.div(
            [
              attribute.class(
                "text-xs text-gray-500 uppercase tracking-wider mb-3 font-light",
              ),
            ],
            [html.text("EXTRACTION LOG")],
          ),
          html.div(
            [attribute.class("space-y-2 max-h-32 overflow-y-auto")],
            list.map(pulled_orbs, fn(orb) {
              let #(bg_class, text_class, border_class) =
                get_orb_style_classes(orb)
              html.div(
                [
                  attribute.class(
                    "flex items-center px-2 py-1 "
                    <> bg_class
                    <> " border "
                    <> border_class
                    <> " rounded text-xs",
                  ),
                ],
                [
                  html.span([attribute.class("mr-2 text-gray-400")], [
                    html.text("●"),
                  ]),
                  html.span([attribute.class(text_class <> " font-medium")], [
                    html.text(display.orb_display_name(orb)),
                  ]),
                ],
              )
            }),
          ),
        ],
      )
  }
}

fn get_orb_style_classes(orb: Orb) -> #(String, String, String) {
  case orb {
    PointOrb(_) -> #("bg-gray-50", "text-gray-700", "border-gray-200")
    BombOrb(_) -> #("bg-red-50", "text-red-700", "border-red-200")
    HealthOrb(_) -> #("bg-green-50", "text-green-700", "border-green-200")
    AllCollectorOrb(_) -> #(
      "bg-purple-50",
      "text-purple-700",
      "border-purple-200",
    )
    PointCollectorOrb(_) -> #("bg-blue-50", "text-blue-700", "border-blue-200")
    BombSurvivorOrb(_) -> #(
      "bg-orange-50",
      "text-orange-700",
      "border-orange-200",
    )
    MultiplierOrb(_) -> #(
      "bg-yellow-50",
      "text-yellow-700",
      "border-yellow-200",
    )
    NextPointMultiplierOrb(_) -> #(
      "bg-orange-50",
      "text-orange-700",
      "border-orange-200",
    )
    BombImmunityOrb -> #("bg-cyan-50", "text-cyan-700", "border-cyan-200")
    ChoiceOrb -> #("bg-indigo-50", "text-indigo-700", "border-indigo-200")
    RiskOrb -> #("bg-red-100", "text-red-800", "border-red-300")
    PointRecoveryOrb -> #("bg-teal-50", "text-teal-700", "border-teal-200")
  }
}

// Choice Components

// Dev Mode Components

pub fn dev_mode_panel(
  enabled: Bool,
  bag: List(Orb),
  screen: Screen,
  choice_orb_1: Option(Orb),
  choice_orb_2: Option(Orb),
  active_statuses: List(StatusEffect),
  pulled_orbs: List(Orb),
) -> Element(Msg) {
  let dev_display = case enabled {
    True -> [
      html.div(
        [
          attribute.class(
            "mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded font-mono text-xs w-64",
          ),
        ],
        [
          render_dev_mode_content(
            screen,
            bag,
            choice_orb_1,
            choice_orb_2,
            active_statuses,
            pulled_orbs,
          ),
        ],
      ),
    ]
    False -> []
  }

  html.div([attribute.class("fixed top-4 right-4 z-50")], [
    html.button(
      [
        attribute.class(case enabled {
          True ->
            "bg-yellow-600 hover:bg-yellow-700 text-white font-mono text-xs py-2 px-3 rounded border-2 border-yellow-500"
          False ->
            "bg-gray-600 hover:bg-gray-700 text-white font-mono text-xs py-2 px-3 rounded border-2 border-gray-500"
        }),
        event.on_click(ToggleDevMode),
      ],
      [
        html.text(case enabled {
          True -> "DEV ON"
          False -> "DEV OFF"
        }),
      ],
    ),
    ..dev_display
  ])
}

fn render_dev_mode_content(
  _screen: Screen,
  bag: List(Orb),
  _choice_orb_1: Option(Orb),
  _choice_orb_2: Option(Orb),
  active_statuses: List(StatusEffect),
  pulled_orbs: List(Orb),
) -> Element(Msg) {
  let status_section = case list.is_empty(active_statuses) {
    False -> [
      render_active_statuses(active_statuses),
      html.div([attribute.class("mt-3 pt-3 border-t border-yellow-300")], []),
    ]
    True -> []
  }

  let choice_section = []

  let pulled_orbs_section = case list.is_empty(pulled_orbs) {
    False -> [
      render_pulled_orbs_log(pulled_orbs),
      html.div([attribute.class("mt-3 pt-3 border-t border-yellow-300")], []),
    ]
    True -> []
  }

  let container_section = [render_container_contents(bag)]

  element.fragment(
    status_section
    |> list.append(choice_section)
    |> list.append(pulled_orbs_section)
    |> list.append(container_section),
  )
}

fn render_pulled_orbs_log(pulled_orbs: List(Orb)) -> Element(Msg) {
  html.div([], [
    html.div(
      [
        attribute.class(
          "text-xs text-yellow-700 uppercase tracking-wider mb-2 font-light",
        ),
      ],
      [html.text("EXTRACTION LOG")],
    ),
    html.div(
      [attribute.class("space-y-1 max-h-32 overflow-y-auto")],
      list.index_map(pulled_orbs, fn(orb, index) {
        html.div([attribute.class("flex items-center text-yellow-800")], [
          html.span([attribute.class("mr-2 w-6 text-right")], [
            html.text(int.to_string(list.length(pulled_orbs) - index) <> "."),
          ]),
          html.span([attribute.class("font-medium")], [
            html.text(format_orb_for_dev_display(orb)),
          ]),
        ])
      }),
    ),
  ])
}

fn render_container_contents(bag: List(Orb)) -> Element(Msg) {
  html.div([], [
    html.div(
      [
        attribute.class(
          "text-xs text-yellow-700 uppercase tracking-wider mb-2 font-light",
        ),
      ],
      [html.text("CONTAINER CONTENTS")],
    ),
    html.div(
      [attribute.class("space-y-1 max-h-32 overflow-y-auto")],
      list.index_map(bag, fn(orb, index) {
        html.div([attribute.class("flex items-center text-yellow-800")], [
          html.span([attribute.class("mr-2 w-6 text-right")], [
            html.text(int.to_string(index + 1) <> "."),
          ]),
          html.span([attribute.class("font-medium")], [
            html.text(format_orb_for_dev_display(orb)),
          ]),
        ])
      }),
    ),
  ])
}

fn render_active_statuses(active_statuses: List(StatusEffect)) -> Element(Msg) {
  html.div([], [
    html.div(
      [
        attribute.class(
          "text-xs text-yellow-700 uppercase tracking-wider mb-2 font-light",
        ),
      ],
      [html.text("ACTIVE STATUS EFFECTS")],
    ),
    html.div(
      [attribute.class("space-y-1")],
      case list.is_empty(active_statuses) {
        True -> [
          html.div([attribute.class("text-yellow-600 text-xs")], [
            html.text("No active effects"),
          ]),
        ]
        False ->
          list.map(active_statuses, fn(status) {
            html.div([attribute.class("flex items-center text-yellow-800")], [
              html.span([attribute.class("mr-2")], [html.text("•")]),
              html.span([attribute.class("font-medium")], [
                html.text(format_status_for_dev_display(status)),
              ]),
            ])
          })
      },
    ),
  ])
}

fn format_status_for_dev_display(status: StatusEffect) -> String {
  // Technical format for dev display
  case status {
    PointMultiplier(multiplier, duration) ->
      "PointMultiplier(×"
      <> float.to_string(multiplier)
      <> ", "
      <> format_duration_for_dev(duration)
      <> ")"
    NextPointMultiplier(multiplier) ->
      "NextPointMultiplier(×" <> float.to_string(multiplier) <> ")"
    BombImmunity(duration) ->
      "BombImmunity(" <> format_duration_for_dev(duration) <> ")"
  }
}

fn format_duration_for_dev(duration: StatusDuration) -> String {
  case duration {
    Permanent -> "Permanent"
    Countdown(n) -> "Countdown(" <> int.to_string(n) <> ")"
    Triggered(n) -> "Triggered(" <> int.to_string(n) <> ")"
  }
}

fn format_orb_for_dev_display(orb: Orb) -> String {
  case orb {
    PointOrb(value) -> "Data(" <> int.to_string(value) <> ")"
    BombOrb(value) -> "Hazard(" <> int.to_string(value) <> ")"
    HealthOrb(value) -> "Health(" <> int.to_string(value) <> ")"
    AllCollectorOrb(value) -> "AllCollector(" <> int.to_string(value) <> ")"
    PointCollectorOrb(value) -> "PointCollector(" <> int.to_string(value) <> ")"
    BombSurvivorOrb(value) -> "BombSurvivor(" <> int.to_string(value) <> ")"
    MultiplierOrb(multiplier) ->
      "FullAmplifier(" <> float.to_string(multiplier) <> ")"
    NextPointMultiplierOrb(multiplier) ->
      "SingleAmplifier(" <> float.to_string(multiplier) <> ")"
    BombImmunityOrb -> "ShieldGenerator"
    ChoiceOrb -> "ChoicePortal"
    RiskOrb -> "VoidPortal"
    PointRecoveryOrb -> "PointRecovery"
  }
}

// Risk Mode UI Components

pub fn risk_orbs_display(risk_orbs: List(Orb)) -> Element(Msg) {
  html.div(
    [attribute.class("p-4 bg-red-50 border border-red-200 rounded text-center")],
    [
      html.div(
        [
          attribute.class(
            "text-sm text-red-700 uppercase tracking-wider mb-3 font-light",
          ),
        ],
        [html.text("YOUR DESTINY AWAITS")],
      ),
      html.div(
        [attribute.class("grid grid-cols-5 gap-2")],
        list.index_map(risk_orbs, fn(orb, index) {
          let #(bg_class, text_class, border_class) = get_orb_style_classes(orb)
          html.div(
            [
              attribute.class(
                "p-2 rounded text-xs text-center "
                <> bg_class
                <> " "
                <> text_class
                <> " border "
                <> border_class,
              ),
            ],
            [
              html.div([attribute.class("font-bold mb-1")], [
                html.text(int.to_string(index + 1)),
              ]),
              html.div([attribute.class("text-xs")], [
                html.text(display.orb_display_name(orb)),
              ]),
            ],
          )
        }),
      ),
    ],
  )
}

pub fn risk_orbs_progress_display(
  all_risk_orbs: List(Orb),
  remaining_risk_orbs: List(Orb),
) -> Element(Msg) {
  let completed_count =
    list.length(all_risk_orbs) - list.length(remaining_risk_orbs)

  html.div(
    [attribute.class("p-4 bg-red-50 border border-red-200 rounded text-center")],
    [
      html.div(
        [
          attribute.class(
            "text-sm text-red-700 uppercase tracking-wider mb-3 font-light",
          ),
        ],
        [html.text("YOUR DESTINY AWAITS")],
      ),
      html.div(
        [attribute.class("grid grid-cols-5 gap-2")],
        list.index_map(all_risk_orbs, fn(orb, index) {
          let is_completed = index < completed_count
          let #(bg_class, text_class, border_class) = case is_completed {
            True -> #("bg-gray-200", "text-gray-400", "border-gray-300")
            False -> get_orb_style_classes(orb)
          }
          html.div(
            [
              attribute.class(
                "p-2 rounded text-xs text-center transition-colors "
                <> bg_class
                <> " "
                <> text_class
                <> " border "
                <> border_class
                <> case is_completed {
                  True -> " opacity-50"
                  False -> ""
                },
              ),
            ],
            [
              html.div([attribute.class("font-bold mb-1")], [
                html.text(int.to_string(index + 1)),
              ]),
              html.div([attribute.class("text-xs")], [
                html.text(display.orb_display_name(orb)),
              ]),
            ],
          )
        }),
      ),
    ],
  )
}

pub fn risk_health_display(risk_health: Int) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "p-3 bg-red-100 border border-red-300 rounded text-center",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "text-sm text-red-800 uppercase tracking-wider mb-2 font-light",
          ),
        ],
        [html.text("VOID PROTECTION")],
      ),
      html.div([attribute.class("text-2xl font-bold text-red-900")], [
        html.text(int.to_string(risk_health)),
      ]),
    ],
  )
}

pub fn risk_container_display(orbs_left: Int) -> Element(Msg) {
  html.div(
    [attribute.class("p-3 bg-red-50 border border-red-200 rounded text-center")],
    [
      html.div(
        [
          attribute.class(
            "text-sm text-red-700 uppercase tracking-wider mb-2 font-light",
          ),
        ],
        [html.text("VOID SPECIMENS REMAINING")],
      ),
      html.div([attribute.class("text-2xl font-bold text-red-800")], [
        html.text(int.to_string(orbs_left)),
      ]),
    ],
  )
}

pub fn risk_extract_button(is_disabled: Bool) -> Element(Msg) {
  html.button(
    [
      attribute.class(case is_disabled {
        True ->
          "bg-gray-400 text-gray-600 font-light py-4 px-6 rounded-lg w-full cursor-not-allowed"
        False ->
          "bg-red-600 hover:bg-red-700 text-white font-light py-4 px-6 rounded-lg transition-colors tracking-wide w-full"
      }),
      attribute.disabled(is_disabled),
      event.on_click(PullRiskOrb),
    ],
    [html.text("EXTRACT FROM VOID")],
  )
}

pub fn risk_effects_summary(risk_effects: types.RiskEffects) -> Element(Msg) {
  html.div(
    [attribute.class("p-4 bg-green-50 border border-green-200 rounded")],
    [
      html.div(
        [
          attribute.class(
            "text-sm text-green-700 uppercase tracking-wider mb-3 font-light",
          ),
        ],
        [html.text("ACCUMULATED EFFECTS")],
      ),
      html.div([attribute.class("space-y-2")], [
        case risk_effects.health_gained > 0 {
          True ->
            html.div([attribute.class("text-green-800")], [
              html.text(
                "◇ SYSTEMS RESTORED: +"
                <> int.to_string(risk_effects.health_gained),
              ),
            ])
          False -> html.div([], [])
        },
        case risk_effects.damage_taken > 0 {
          True ->
            html.div([attribute.class("text-red-800")], [
              html.text(
                "○ HAZARD DAMAGE: -" <> int.to_string(risk_effects.damage_taken),
              ),
            ])
          False -> html.div([], [])
        },
        case risk_effects.points_gained > 0 {
          True ->
            html.div([attribute.class("text-green-800")], [
              html.text(
                "● ENHANCED DATA: +"
                <> int.to_string(risk_effects.points_gained),
              ),
            ])
          False -> html.div([], [])
        },
        case list.is_empty(risk_effects.special_orbs) {
          True -> html.div([], [])
          False ->
            html.div([attribute.class("text-green-800")], [
              html.text(
                "◈ SPECIAL EFFECTS: "
                <> int.to_string(list.length(risk_effects.special_orbs))
                <> " activated",
              ),
            ])
        },
      ]),
    ],
  )
}

// Marketplace Components

// Compact item card for catalog grid - matches stat card design
pub fn compact_marketplace_item(
  item_name: String,
  price: Int,
  rarity_color: String,
  can_afford: Bool,
  is_selected: Bool,
  msg: Msg,
) -> Element(Msg) {
  let base_classes =
    "rounded border cursor-pointer transition-all duration-200 p-4 "
  let selection_classes = case is_selected {
    True -> "border-purple-500 bg-purple-50 hover:bg-purple-100 "
    False ->
      "border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 "
  }
  let affordability_classes = case can_afford {
    True -> ""
    False -> "opacity-50 "
  }

  html.div(
    [
      attribute.class(
        base_classes <> selection_classes <> affordability_classes,
      ),
      event.on_click(msg),
    ],
    [
      // Rarity indicator at top
      html.div([attribute.class("flex justify-center mb-2")], [
        html.div([attribute.class("w-3 h-3 rounded-full " <> rarity_color)], []),
      ]),
      // Item name (centered like stat labels)
      html.div(
        [
          attribute.class(
            "text-xs text-gray-400 uppercase tracking-widest mb-1 font-light text-center",
          ),
        ],
        [html.text(item_name)],
      ),
      // Price (larger like stat values)
      html.div(
        [attribute.class("text-lg font-light text-gray-600 text-center")],
        [html.text(int.to_string(price) <> "C")],
      ),
    ],
  )
}

// Detailed item view panel
pub fn marketplace_item_detail(
  item_name: String,
  description: String,
  price: Int,
  rarity_name: String,
  rarity_color: String,
  can_afford: Bool,
  purchase_msg: Msg,
) -> Element(Msg) {
  html.div([attribute.class("border rounded-lg p-6 bg-white h-full")], [
    html.div([attribute.class("mb-4")], [
      html.div([attribute.class("flex items-center gap-2 mb-2")], [
        html.div([attribute.class("w-4 h-4 rounded-full " <> rarity_color)], []),
        html.span([attribute.class("text-sm font-medium " <> rarity_color)], [
          html.text(rarity_name),
        ]),
      ]),
      html.h2([attribute.class("text-xl font-semibold text-gray-900")], [
        html.text(item_name),
      ]),
    ]),
    html.p([attribute.class("text-gray-600 mb-6 leading-relaxed")], [
      html.text(description),
    ]),
    html.div([attribute.class("mt-auto")], [
      html.div([attribute.class("flex items-center justify-between mb-4")], [
        html.span([attribute.class("text-lg font-semibold text-gray-900")], [
          html.text(int.to_string(price) <> " CREDITS"),
        ]),
      ]),
      purchase_button_large(can_afford, purchase_msg),
    ]),
  ])
}

// Large purchase button for detail view
pub fn purchase_button_large(can_afford: Bool, msg: Msg) -> Element(Msg) {
  let button_classes = case can_afford {
    True ->
      "bg-purple-600 hover:bg-purple-700 text-white border-purple-500 hover:border-purple-600 hover:scale-[1.02]"
    False -> "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
  }

  html.button(
    [
      attribute.class(
        "w-full font-medium py-4 px-6 rounded-lg transition-all duration-200 text-lg tracking-wide border-2 "
        <> button_classes,
      ),
      attribute.disabled(!can_afford),
      event.on_click(msg),
    ],
    [html.text("PURCHASE")],
  )
}

// Default detail view when no item is selected
pub fn marketplace_default_detail() -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "border rounded-lg p-6 bg-gray-50 h-full flex items-center justify-center",
      ),
    ],
    [
      html.div([attribute.class("text-center text-gray-500")], [
        html.div([attribute.class("text-4xl mb-4")], [html.text("📦")]),
        html.h3([attribute.class("text-lg font-medium mb-2")], [
          html.text("Select an Item"),
        ]),
        html.p([attribute.class("text-sm")], [
          html.text(
            "Choose an item from the catalog to view details and purchase.",
          ),
        ]),
      ]),
    ],
  )
}

// Ultra-compact marketplace item for horizontal scrolling
pub fn ultra_compact_marketplace_item(
  item_code: String,
  rarity_bg_color: String,
  can_afford: Bool,
  is_selected: Bool,
  msg: Msg,
) -> Element(Msg) {
  let base_classes =
    "relative w-14 h-14 flex-shrink-0 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-white font-bold text-sm border-2 "
  let selection_classes = case is_selected {
    True -> "border-white shadow-lg scale-110 "
    False -> "border-transparent hover:border-white/50 hover:scale-105 "
  }
  let affordability_classes = case can_afford {
    True -> ""
    False -> "opacity-40 "
  }

  html.div(
    [
      attribute.class(
        base_classes
        <> rarity_bg_color
        <> " "
        <> selection_classes
        <> affordability_classes,
      ),
      event.on_click(msg),
    ],
    [
      // Item code in center
      html.div([attribute.class("text-center leading-none")], [
        html.text(item_code),
      ]),
    ],
  )
}
