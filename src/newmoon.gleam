import gleam/int
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

type Model =
  Int

fn init(_) -> Model {
  0
}

type Msg {
  UserClickedIncrement
  UserClickedDecrement
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    UserClickedIncrement -> model + 1
    UserClickedDecrement -> model - 1
  }
}

fn view(model: Model) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4",
      ),
    ],
    [view_counter_card(model)],
  )
}

fn view_counter_card(model: Model) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center",
      ),
    ],
    [view_header(), view_counter_controls(model)],
  )
}

fn view_header() -> Element(Msg) {
  html.h1([attribute.class("text-3xl font-bold text-gray-800 mb-8")], [
    html.text("COUNTER"),
  ])
}

fn view_counter_controls(model: Model) -> Element(Msg) {
  html.div(
    [attribute.class("flex items-center justify-center space-x-6 mb-8")],
    [
      view_decrement_button(),
      view_counter_display(model),
      view_increment_button(),
    ],
  )
}

fn view_decrement_button() -> Element(Msg) {
  html.button(
    [
      attribute.class(
        "bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 text-2xl w-16 h-16 flex items-center justify-center",
      ),
      event.on_click(UserClickedDecrement),
    ],
    [html.text("−")],
  )
}

fn view_increment_button() -> Element(Msg) {
  html.button(
    [
      attribute.class(
        "bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 text-2xl w-16 h-16 flex items-center justify-center",
      ),
      event.on_click(UserClickedIncrement),
    ],
    [html.text("+")],
  )
}

fn view_counter_display(model: Model) -> Element(Msg) {
  let count = int.to_string(model)

  html.div([attribute.class("bg-gray-50 rounded-xl px-6 py-4 min-w-[120px]")], [
    html.p(
      [
        attribute.class(
          "text-sm font-medium text-gray-500 uppercase tracking-wide",
        ),
      ],
      [html.text("Count")],
    ),
    html.p([attribute.class("text-4xl font-bold text-gray-800 mt-1")], [
      html.text(count),
    ]),
  ])
}
