import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct WorkoutLiveActivity: Widget {
  let name: String = "WorkoutLiveActivity"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("BuiltMode Active Workout")
    .description("Track your active workout from the Lock Screen and Dynamic Island.")
    .supportedFamilies([.systemSmall])
    .contentMarginsDisabled()
  }
}