import gleam/float
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
import types.{type Model, type Msg, StartNewGame, ContinueGame, ShowHowToPlay, PullOrb, PauseGame, ResumeGame, NextLevel, RestartLevel, GoToMainMenu, GoToMarketplace, GoToTestingGrounds, ToggleShuffle, ToggleDevMode, ExitTestingGrounds, AddTestOrb, RemoveTestOrb, StartSimulations, ViewTestResults, ResetTestConfig, MainMenu, Playing, Paused, LevelComplete, GameOver, InMarketplace, InTestingGrounds, ConfiguringTest, RunningSimulations, ViewingResults}

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
    case model.status {
      Playing -> [view_header(), view_game_stats(model), view_game_content(model)]
      Paused -> [view_header(), view_game_stats(model), view_game_content(model)]
      _ -> [view_game_content(model)]
    },
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
    MainMenu -> view_main_menu(model)
    Playing -> view_playing_state(model)
    Paused -> view_paused_state(model)
    LevelComplete -> view_level_complete_state(model)
    GameOver -> view_game_over_state(model)
    InMarketplace -> marketplace.view_marketplace(model)
    InTestingGrounds -> view_testing_grounds(model)
  }
}

fn view_playing_state(model: Model) -> Element(Msg) {
  html.div([], [
    case model.dev_mode {
      True -> view_dev_mode_panel(model)
      False -> html.div([], [])
    },
    view_pause_button(),
    view_last_orb_result(model),
    view_bag_info(model),
    view_shuffle_toggle(model),
    view_pull_orb_button(model),
    view_dev_mode_toggle(model),
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

fn view_shuffle_toggle(model: Model) -> Element(Msg) {
  let toggle_text = case model.shuffle_enabled {
    True -> "SHUFFLE: ENABLED"
    False -> "SHUFFLE: DISABLED"
  }
  let toggle_color = case model.shuffle_enabled {
    True -> "bg-yellow-100 border-yellow-300 text-yellow-700"
    False -> "bg-gray-100 border-gray-300 text-gray-700"
  }

  html.div([attribute.class("mb-4")], [
    html.button(
      [
        attribute.class(
          string.concat([
            "w-full py-2 px-4 rounded border font-light text-xs tracking-wider transition ",
            toggle_color,
          ]),
        ),
        event.on_click(ToggleShuffle),
      ],
      [html.text(toggle_text)],
    ),
  ])
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

fn view_main_menu(model: Model) -> Element(Msg) {
  let has_progress = model.level > 1 || model.credits > 0
  
  html.div([attribute.class("text-center")], [
    // Game branding
    html.div([attribute.class("mb-8")], [
      html.h1(
        [attribute.class("text-4xl font-light text-black mb-2 tracking-wider")],
        [html.text("NEW MOON")],
      ),
      html.p(
        [attribute.class("text-lg text-gray-500 mb-2 font-light tracking-wide")],
        [html.text("DEEP SPACE EXPLORATION")],
      ),
      html.p(
        [attribute.class("text-sm text-gray-400 font-light tracking-wider")],
        [html.text("Extract samples • Manage risk • Survive the unknown")],
      ),
    ]),
    
    // Menu options
    html.div([attribute.class("space-y-4")], [
      html.button(
        [
          attribute.class(
            "w-full bg-black hover:bg-gray-800 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
          ),
          event.on_click(StartNewGame),
        ],
        [html.text("START NEW MISSION")],
      ),
      case has_progress {
        True ->
          html.button(
            [
              attribute.class(
                "w-full bg-blue-600 hover:bg-blue-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
              ),
              event.on_click(ContinueGame),
            ],
            [html.text("CONTINUE MISSION")],
          )
        False -> html.div([], [])
      },
      html.button(
        [
          attribute.class(
            "w-full bg-purple-600 hover:bg-purple-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
          ),
          event.on_click(GoToTestingGrounds),
        ],
        [html.text("FIELD TESTING")],
      ),
      html.button(
        [
          attribute.class(
            "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-light py-3 px-6 rounded transition text-sm tracking-wider",
          ),
          event.on_click(ShowHowToPlay),
        ],
        [html.text("HOW TO PLAY")],
      ),
    ]),
    
    // Progress indicator
    case has_progress {
      True ->
        html.div([attribute.class("mt-6 p-3 bg-gray-50 rounded border")], [
          html.p([attribute.class("text-xs text-gray-600")], [
            html.text("Progress: Sector " <> int.to_string(model.level) <> " • Credits: " <> int.to_string(model.credits)),
          ]),
        ])
      False -> html.div([], [])
    },
  ])
}

fn view_paused_state(_model: Model) -> Element(Msg) {
  html.div([attribute.class("text-center")], [
    html.div(
      [attribute.class("mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded")],
      [
        html.h2(
          [attribute.class("text-xl font-light text-black mb-2 tracking-wide")],
          [html.text("MISSION PAUSED")],
        ),
        html.p([attribute.class("text-yellow-700 text-sm font-light")], [
          html.text("Your progress is safe. Choose your next action."),
        ]),
      ],
    ),
    html.div([attribute.class("space-y-3")], [
      html.button(
        [
          attribute.class(
            "w-full bg-green-600 hover:bg-green-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
          ),
          event.on_click(ResumeGame),
        ],
        [html.text("RESUME MISSION")],
      ),
      html.button(
        [
          attribute.class(
            "w-full bg-blue-600 hover:bg-blue-700 text-white font-light py-3 px-6 rounded transition text-sm tracking-wider",
          ),
          event.on_click(RestartLevel),
        ],
        [html.text("RESTART SECTOR")],
      ),
      html.button(
        [
          attribute.class(
            "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-light py-3 px-6 rounded transition text-sm tracking-wider",
          ),
          event.on_click(GoToMainMenu),
        ],
        [html.text("MAIN MENU")],
      ),
    ]),
  ])
}

fn view_level_complete_state(model: Model) -> Element(Msg) {
  html.div([attribute.class("text-center")], [
    html.div(
      [attribute.class("mb-6 p-6 bg-green-50 border border-green-200 rounded")],
      [
        html.h2(
          [attribute.class("text-2xl font-light text-black mb-4 tracking-wide")],
          [html.text("SECTOR " <> int.to_string(model.level) <> " COMPLETE")],
        ),
        html.div([attribute.class("mb-4")], [
          html.p([attribute.class("text-green-700 text-lg font-medium mb-2")], [
            html.text("Mission successful!"),
          ]),
          html.p([attribute.class("text-gray-600 text-sm mb-1")], [
            html.text("Target achieved: " <> int.to_string(model.milestone) <> " data units"),
          ]),
          html.p([attribute.class("text-gray-600 text-sm")], [
            html.text("Final score: " <> int.to_string(model.points) <> " points"),
          ]),
        ]),
        html.p([attribute.class("text-green-600 text-lg font-medium mb-2")], [
          html.text("Credits earned: +" <> int.to_string(model.points)),
        ]),
        html.p([attribute.class("text-purple-600 text-sm font-light")], [
          html.text("Total credits: " <> int.to_string(model.credits)),
        ]),
      ],
    ),
    html.div([attribute.class("space-y-3")], [
      html.button(
        [
          attribute.class(
            "w-full bg-black hover:bg-gray-800 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
          ),
          event.on_click(NextLevel),
        ],
        [html.text("ADVANCE TO SECTOR " <> int.to_string(model.level + 1))],
      ),
      html.button(
        [
          attribute.class(
            "w-full bg-purple-600 hover:bg-purple-700 text-white font-light py-3 px-6 rounded transition text-sm tracking-wider",
          ),
          event.on_click(GoToMarketplace),
        ],
        [html.text("VISIT MARKETPLACE")],
      ),
      html.button(
        [
          attribute.class(
            "w-full bg-blue-600 hover:bg-blue-700 text-white font-light py-3 px-6 rounded transition text-sm tracking-wider",
          ),
          event.on_click(GoToTestingGrounds),
        ],
        [html.text("FIELD TESTING")],
      ),
      html.button(
        [
          attribute.class(
            "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-light py-2 px-6 rounded transition text-sm tracking-wider",
          ),
          event.on_click(GoToMainMenu),
        ],
        [html.text("MAIN MENU")],
      ),
    ]),
  ])
}

fn view_game_over_state(model: Model) -> Element(Msg) {
  html.div([attribute.class("text-center")], [
    html.div(
      [attribute.class("mb-6 p-6 bg-red-50 border border-red-200 rounded")],
      [
        html.h2(
          [attribute.class("text-xl font-light text-black mb-2 tracking-wide")],
          [html.text("MISSION FAILED")],
        ),
        html.p([attribute.class("text-red-700 text-sm font-light mb-3")], [
          html.text("All systems compromised. Mission terminated."),
        ]),
        html.div([attribute.class("text-sm text-gray-600")], [
          html.p([attribute.class("mb-1")], [
            html.text("Sector: " <> int.to_string(model.level)),
          ]),
          html.p([attribute.class("mb-1")], [
            html.text("Final score: " <> int.to_string(model.points) <> " / " <> int.to_string(model.milestone)),
          ]),
          html.p([], [
            html.text("Credits retained: " <> int.to_string(model.credits)),
          ]),
        ]),
      ],
    ),
    html.div([attribute.class("space-y-3")], [
      html.button(
        [
          attribute.class(
            "w-full bg-red-600 hover:bg-red-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider",
          ),
          event.on_click(RestartLevel),
        ],
        [html.text("RETRY SECTOR " <> int.to_string(model.level))],
      ),
      html.button(
        [
          attribute.class(
            "w-full bg-blue-600 hover:bg-blue-700 text-white font-light py-3 px-6 rounded transition text-sm tracking-wider",
          ),
          event.on_click(GoToTestingGrounds),
        ],
        [html.text("ANALYZE IN FIELD TESTING")],
      ),
      html.button(
        [
          attribute.class(
            "w-full bg-gray-600 hover:bg-gray-700 text-white font-light py-3 px-6 rounded transition text-sm tracking-wider",
          ),
          event.on_click(StartNewGame),
        ],
        [html.text("START NEW MISSION")],
      ),
      html.button(
        [
          attribute.class(
            "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-light py-2 px-6 rounded transition text-sm tracking-wider",
          ),
          event.on_click(GoToMainMenu),
        ],
        [html.text("MAIN MENU")],
      ),
    ]),
  ])
}

fn view_pause_button() -> Element(Msg) {
  html.div([attribute.class("flex justify-end mb-4")], [
    html.button(
      [
        attribute.class(
          "px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-light tracking-wider transition",
        ),
        event.on_click(PauseGame),
      ],
      [html.text("⏸ PAUSE")],
    ),
  ])
}

fn view_testing_grounds(model: Model) -> Element(Msg) {
  html.div([attribute.class("text-center")], [
    view_field_testing_header(),
    case model.testing_mode {
      ConfiguringTest -> view_test_configuration(model)
      RunningSimulations -> view_simulation_progress(model)
      ViewingResults -> view_test_results(model)
    },
  ])
}

fn view_field_testing_header() -> Element(Msg) {
  html.div(
    [attribute.class("mb-6 p-4 bg-blue-50 border border-blue-200 rounded")],
    [
      html.h2(
        [attribute.class("text-xl font-light text-black mb-2 tracking-wide")],
        [html.text("ORB FIELD TESTING")],
      ),
      html.p([attribute.class("text-blue-700 text-sm font-light")], [
        html.text("Simulate strategies and optimize your approach"),
      ]),
      html.button(
        [
          attribute.class(
            "mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-light tracking-wider transition",
          ),
          event.on_click(ExitTestingGrounds),
        ],
        [html.text("← BACK TO GAME")],
      ),
    ],
  )
}

fn view_test_configuration(model: Model) -> Element(Msg) {
  case model.testing_config {
    option.Some(config) ->
      html.div([], [
        view_test_bag_builder(config),
        view_test_settings(config),
        view_test_actions(config),
      ])
    option.None -> html.div([], [html.text("Configuration error")])
  }
}

fn view_simulation_progress(_model: Model) -> Element(Msg) {
  html.div([attribute.class("p-6")], [
    html.div([attribute.class("mb-4")], [
      html.h3([attribute.class("text-lg font-light mb-2")], [
        html.text("Running Simulations..."),
      ]),
      html.p([attribute.class("text-gray-600 text-sm")], [
        html.text("Please wait while we test your strategy"),
      ]),
    ]),
    html.div([attribute.class("bg-gray-200 rounded-full h-2 mb-4")], [
      html.div([attribute.class("bg-blue-600 h-2 rounded-full w-1/2")], []),
    ]),
    html.button(
      [
        attribute.class(
          "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-light tracking-wider transition",
        ),
        event.on_click(ViewTestResults),
      ],
      [html.text("VIEW RESULTS (DEMO)")],
    ),
  ])
}

fn view_test_results(model: Model) -> Element(Msg) {
  case model.testing_stats {
    option.Some(stats) ->
      html.div([attribute.class("p-6")], [
        html.h3([attribute.class("text-lg font-light mb-4")], [
          html.text("Simulation Results"),
        ]),
        view_comprehensive_stats(stats),
        html.div([attribute.class("space-y-3 mt-6")], [
          html.button(
            [
              attribute.class(
                "w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-light tracking-wider transition",
              ),
              event.on_click(ResetTestConfig),
            ],
            [html.text("NEW TEST")],
          ),
          html.button(
            [
              attribute.class(
                "w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-light tracking-wider transition",
              ),
              event.on_click(ExitTestingGrounds),
            ],
            [html.text("BACK TO GAME")],
          ),
        ]),
      ])
    option.None ->
      html.div([attribute.class("p-6")], [
        html.p([attribute.class("text-gray-600")], [
          html.text("No simulation results available"),
        ]),
      ])
  }
}

fn view_comprehensive_stats(stats: types.TestingStats) -> Element(Msg) {
  let win_rate_percent = 
    float.round(stats.win_rate *. 100.0) |> int.to_string() <> "%"
  let avg_points = 
    float.round(stats.average_points) |> int.to_string()

  html.div([], [
    // Primary stats grid
    html.div([attribute.class("grid grid-cols-2 gap-4 mb-6")], [
      view_stat_card("✓", "WIN RATE", win_rate_percent, case stats.win_rate >=. 0.7 {
        True -> "text-green-600"
        False -> case stats.win_rate >=. 0.4 {
          True -> "text-yellow-600"
          False -> "text-red-600"
        }
      }),
      view_stat_card("◎", "AVG SCORE", avg_points, "text-blue-600"),
    ]),
    
    // Secondary stats grid
    html.div([attribute.class("grid grid-cols-3 gap-3 mb-6")], [
      view_stat_card("◈", "WINS", int.to_string(stats.wins), "text-green-600"),
      view_stat_card("◇", "LOSSES", int.to_string(stats.losses), "text-red-600"),
      view_stat_card("⚬", "TOTAL", int.to_string(stats.total_runs), "text-gray-600"),
    ]),
    
    // Score range
    html.div([attribute.class("grid grid-cols-2 gap-4 mb-6")], [
      view_stat_card("↑", "BEST", int.to_string(stats.best_score), "text-purple-600"),
      view_stat_card("↓", "WORST", int.to_string(stats.worst_score), "text-gray-500"),
    ]),
    
    // Performance insights
    view_performance_insights(stats),
  ])
}

fn view_performance_insights(stats: types.TestingStats) -> Element(Msg) {
  let insights = generate_insights(stats)
  
  html.div([attribute.class("bg-gray-50 rounded border p-4")], [
    html.h4([attribute.class("text-sm font-medium text-gray-700 mb-2")], [
      html.text("STRATEGY INSIGHTS"),
    ]),
    html.div([attribute.class("space-y-2")], 
      list.map(insights, fn(insight) {
        html.p([attribute.class("text-xs text-gray-600")], [html.text(insight)])
      })
    ),
  ])
}

fn generate_insights(stats: types.TestingStats) -> List(String) {
  let win_rate_insight = case stats.win_rate {
    rate if rate >=. 0.8 -> "Excellent strategy! Very high success rate."
    rate if rate >=. 0.6 -> "Good strategy with solid win rate."
    rate if rate >=. 0.4 -> "Moderate success. Consider more health orbs."
    _ -> "Low win rate. Strategy needs significant improvement."
  }
  
  let score_insight = case stats.average_points >=. int.to_float(float.round(int.to_float(stats.best_score) *. 0.7)) {
    True -> "Consistent scoring with good point generation."
    False -> "High variance in scores. Strategy may be risky."
  }
  
  let sample_insight = case stats.total_runs {
    runs if runs >= 100 -> "Large sample size provides reliable results."
    runs if runs >= 50 -> "Good sample size for meaningful insights."
    _ -> "Small sample size. Consider running more simulations."
  }
  
  [win_rate_insight, score_insight, sample_insight]
}

fn view_test_bag_builder(config: types.TestingConfiguration) -> Element(Msg) {
  html.div([attribute.class("mb-6")], [
    html.h3([attribute.class("text-lg font-light mb-3")], [
      html.text("Test Bag Configuration"),
    ]),
    html.div([attribute.class("mb-4 p-4 bg-gray-50 rounded border")], [
      html.p([attribute.class("text-sm text-gray-600 mb-2")], [
        html.text("Orbs in bag: " <> int.to_string(list.length(config.test_bag))),
      ]),
      view_test_bag_contents(config.test_bag),
    ]),
    view_orb_selector(),
  ])
}

fn view_test_bag_contents(bag: List(types.Orb)) -> Element(Msg) {
  case list.is_empty(bag) {
    True ->
      html.p([attribute.class("text-gray-400 text-sm italic")], [
        html.text("No orbs added yet"),
      ])
    False ->
      html.div([attribute.class("flex flex-wrap gap-2")], 
        list.index_map(bag, fn(orb, index) {
          html.div([attribute.class("flex items-center bg-white rounded border px-2 py-1")], [
            html.span([attribute.class("text-xs mr-2")], [
              html.text(orb.get_orb_name(orb)),
            ]),
            html.button(
              [
                attribute.class("text-red-500 hover:text-red-700 text-xs"),
                event.on_click(RemoveTestOrb(index)),
              ],
              [html.text("×")],
            ),
          ])
        })
      )
  }
}

fn view_orb_selector() -> Element(Msg) {
  let available_orbs = [
    types.Point(8), types.Point(12), types.Point(15),
    types.Health(2), types.Health(4),
    types.Bomb(2), types.Bomb(3),
    types.Collector, types.Survivor, types.Multiplier,
  ]

  html.div([], [
    html.p([attribute.class("text-sm font-light mb-2")], [
      html.text("Add orbs to your test bag:"),
    ]),
    html.div([attribute.class("grid grid-cols-2 gap-2")], 
      list.map(available_orbs, fn(orb) {
        html.button(
          [
            attribute.class(
              "px-3 py-2 bg-white hover:bg-gray-100 border rounded text-xs font-light transition",
            ),
            event.on_click(AddTestOrb(orb)),
          ],
          [html.text(orb.get_orb_name(orb))],
        )
      })
    ),
  ])
}

fn view_test_settings(config: types.TestingConfiguration) -> Element(Msg) {
  html.div([attribute.class("mb-6 p-4 bg-gray-50 rounded border")], [
    html.h3([attribute.class("text-lg font-light mb-3")], [
      html.text("Test Settings"),
    ]),
    html.div([attribute.class("grid grid-cols-2 gap-4")], [
      html.div([], [
        html.label([attribute.class("block text-sm font-light mb-1")], [
          html.text("Target Score:"),
        ]),
        html.p([attribute.class("text-lg")], [
          html.text(int.to_string(config.target_milestone)),
        ]),
      ]),
      html.div([], [
        html.label([attribute.class("block text-sm font-light mb-1")], [
          html.text("Starting Health:"),
        ]),
        html.p([attribute.class("text-lg")], [
          html.text(int.to_string(config.starting_health)),
        ]),
      ]),
    ]),
    html.div([attribute.class("mt-4")], [
      html.label([attribute.class("block text-sm font-light mb-1")], [
        html.text("Simulation Count:"),
      ]),
      html.p([attribute.class("text-lg")], [
        html.text(int.to_string(config.simulation_count)),
      ]),
    ]),
  ])
}

fn view_test_actions(config: types.TestingConfiguration) -> Element(Msg) {
  let can_run = !list.is_empty(config.test_bag)
  let button_classes = case can_run {
    True -> "bg-green-600 hover:bg-green-700 text-white"
    False -> "bg-gray-300 cursor-not-allowed text-gray-500"
  }

  html.div([attribute.class("space-y-3")], [
    html.button(
      [
        attribute.class(
          string.concat([
            "w-full py-4 px-6 rounded font-light text-sm tracking-wider transition transform hover:scale-[1.02] ",
            button_classes,
          ]),
        ),
        event.on_click(StartSimulations),
      ],
      [html.text(case can_run {
        True -> "RUN SIMULATIONS"
        False -> "ADD ORBS TO BEGIN"
      })],
    ),
    html.button(
      [
        attribute.class(
          "w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-light text-sm tracking-wider transition",
        ),
        event.on_click(ResetTestConfig),
      ],
      [html.text("RESET CONFIGURATION")],
    ),
  ])
}

fn view_dev_mode_panel(model: Model) -> Element(Msg) {
  html.div([attribute.class("mb-4 p-3 bg-red-50 border border-red-300 rounded")], [
    html.div([attribute.class("flex items-center justify-between mb-2")], [
      html.h3([attribute.class("text-sm font-medium text-red-800")], [
        html.text("🔧 DEV MODE ACTIVE"),
      ]),
      html.button(
        [
          attribute.class("text-xs text-red-600 hover:text-red-800 underline"),
          event.on_click(ToggleDevMode),
        ],
        [html.text("Turn Off")],
      ),
    ]),
    view_next_orb_preview(model),
    view_bag_order_display(model),
  ])
}

fn view_next_orb_preview(model: Model) -> Element(Msg) {
  case model.bag {
    [] -> 
      html.p([attribute.class("text-xs text-red-700 mb-1")], [
        html.text("Next: No orbs remaining"),
      ])
    [next_orb, ..] ->
      html.p([attribute.class("text-xs text-red-700 mb-1")], [
        html.text("Next: " <> orb.get_orb_name(next_orb)),
      ])
  }
}

fn view_bag_order_display(model: Model) -> Element(Msg) {
  case model.bag {
    [] ->
      html.p([attribute.class("text-xs text-red-600")], [
        html.text("Bag: Empty"),
      ])
    orbs -> {
      let orb_names = list.map(orbs, orb.get_orb_name)
      let orb_list = string.join(orb_names, ", ")
      let display_text = case string.length(orb_list) > 60 {
        True -> string.slice(orb_list, 0, 57) <> "..."
        False -> orb_list
      }
      html.p([attribute.class("text-xs text-red-600")], [
        html.text("Order: " <> display_text),
      ])
    }
  }
}

fn view_dev_mode_toggle(model: Model) -> Element(Msg) {
  case model.dev_mode {
    True -> html.div([], []) // Toggle is shown in dev panel when active
    False ->
      html.div([attribute.class("mt-4")], [
        html.button(
          [
            attribute.class(
              "w-full py-2 px-4 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded text-xs font-light tracking-wider transition",
            ),
            event.on_click(ToggleDevMode),
          ],
          [html.text("🔧 ENABLE DEV MODE")],
        ),
      ])
  }
}

