import lustre
import update
import view

pub fn main() -> Nil {
  let assert Ok(_) =
    lustre.simple(update.init, update.update, view.view)
    |> lustre.start("#app", Nil)

  Nil
}
