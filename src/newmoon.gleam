import gleam/int
import lustre
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
  let count = int.to_string(model)

  html.div([], [
    html.button([event.on_click(UserClickedDecrement)], [html.text("-")]),
    html.p([], [html.text("Count: "), html.text(count)]),
    html.button([event.on_click(UserClickedIncrement)], [html.text("+")]),
  ])
}
