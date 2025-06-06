import gleam/int
import gleam/list
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import orb
import types.{type MarketItem, type Model, type Msg, type Orb, Bomb, BuyOrb, Collector, Health, MarketItem, Multiplier, NextLevel, Point, Survivor}

pub fn get_market_items() -> List(MarketItem) {
  [
    MarketItem(Point(5), 10, "Basic data packet - reliable points"),
    MarketItem(Point(8), 15, "Advanced data packet - higher value"),
    MarketItem(Health(2), 12, "Standard repair kit - moderate healing"),
    MarketItem(Health(4), 20, "Enhanced repair kit - superior healing"),
    MarketItem(Collector, 25, "Deep scanner - points for remaining orbs"),
    MarketItem(Survivor, 30, "Damage analyzer - points for bombs survived"),
    MarketItem(Multiplier, 35, "Signal amplifier - doubles point multiplier"),
    MarketItem(Bomb(1), 5, "Minor explosive - low risk training"),
  ]
}

pub fn can_afford(model: Model, item: MarketItem) -> Bool {
  model.credits >= item.price
}

pub fn purchase_orb(model: Model, orb: Orb) -> Model {
  let market_items = get_market_items()
  case list.find(market_items, fn(item) { item.orb == orb }) {
    Ok(item) -> {
      case can_afford(model, item) {
        True -> {
          let new_credits = model.credits - item.price
          let new_bag = [orb, ..model.bag]
          types.Model(..model, credits: new_credits, bag: new_bag)
        }
        False -> model
      }
    }
    Error(_) -> model
  }
}

pub fn view_marketplace(model: Model) -> Element(Msg) {
  let market_items = get_market_items()
  
  html.div([attribute.class("text-center")], [
    html.div(
      [attribute.class("mb-6 p-6 bg-purple-50 border border-purple-200 rounded")],
      [
        html.h2(
          [attribute.class("text-xl font-light text-black mb-2 tracking-wide")],
          [html.text("ORBITAL MARKETPLACE")],
        ),
        html.p([attribute.class("text-purple-700 text-sm font-light mb-2")], [
          html.text("Enhance your exploration capabilities"),
        ]),
        html.p([attribute.class("text-purple-600 text-xs font-light")], [
          html.text("Credits available: " <> int.to_string(model.credits)),
        ]),
      ],
    ),
    html.div([attribute.class("space-y-3 mb-6 max-h-64 overflow-y-auto")], 
      list.map(market_items, fn(item) { view_market_item(model, item) })
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

fn view_market_item(model: Model, item: MarketItem) -> Element(Msg) {
  let can_buy = can_afford(model, item)
  let button_classes = case can_buy {
    True -> "bg-purple-600 hover:bg-purple-700 text-white"
    False -> "bg-gray-300 cursor-not-allowed text-gray-500"
  }
  let price_color = case can_buy {
    True -> "text-purple-600"
    False -> "text-red-500"
  }

  html.div([attribute.class("bg-white border border-gray-200 rounded p-4")], [
    html.div([attribute.class("text-left mb-3")], [
      html.h3([attribute.class("font-medium text-gray-800 mb-1")], [
        html.text(orb.get_orb_name(item.orb)),
      ]),
      html.p([attribute.class("text-xs text-gray-600 mb-2")], [
        html.text(item.description),
      ]),
      html.p([attribute.class("text-sm font-light " <> price_color)], [
        html.text("Cost: " <> int.to_string(item.price) <> " credits"),
      ]),
    ]),
    html.button(
      [
        attribute.class(
          string.concat([
            "w-full py-2 px-4 rounded text-sm font-light transition transform hover:scale-[1.02] ",
            button_classes,
          ]),
        ),
        event.on_click(BuyOrb(item.orb)),
      ],
      [html.text(case can_buy {
        True -> "PURCHASE"
        False -> "INSUFFICIENT CREDITS"
      })],
    ),
  ])
}