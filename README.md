# @jeffy-g/live-midi-types

[![npm version](https://img.shields.io/npm/v/@jeffy-g/live-midi-types.svg)](https://www.npmjs.com/package/@jeffy-g/live-midi-types)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![npm](https://img.shields.io/npm/dm/@jeffy-g/live-midi-types.svg?style=plastic)

Shared TypeScript types and small runtime helpers for Ableton Live MIDI clip data, project summaries, and Standard MIDI Files.

## Scope

The package provides three related contracts:

- beat-based MIDI events and clip data extracted from Ableton Live Sets;
- application-facing clip, track, and project summaries;
- numeric MIDI 1.0 SMF event types for parsers and writers.

The Ableton data shapes were reverse engineered from observed Live 11 and Live 12 `.als` documents. Ableton does not publish an official `.als` specification, so consumers should expect the model to grow as more real projects are inspected.

## Installation

```sh
npm install @jeffy-g/live-midi-types
```

## Entry points

| Entry point | Contents |
|---|---|
| `@jeffy-g/live-midi-types` | Ableton MIDI events, clip data, project summaries, color helpers, and runtime utilities |
| `@jeffy-g/live-midi-types/midi10-smf-types` | MIDI 1.0 SMF header, event, file, and writer option types |
| `@jeffy-g/live-midi-types/midi10-smf-io` | MIDI 1.0 SMF parser, writer, and VLQ size helper |
| `@jeffy-g/live-midi-types/ESMFEventType` | Runtime numeric SMF event type constants |

## Ableton MIDI clip data

`TMidiClipData` stores beat-based source data and the clip's Program Change number. MIDI CC events are grouped by controller in `ccMap`; `knownCCEvents` determines which controller buckets are present and their traversal order.

```ts
import {
  flattenCCEventMap,
  type ControlChangeEvent,
  type NoteEvent,
  type TMidiClipData,
} from "@jeffy-g/live-midi-types";

const note: NoteEvent = {
  time: 0,
  duration: 1,
  pitch: 60,
  velocity: 100,
};

const sustain: ControlChangeEvent = {
  time: 0.5,
  controller: 64,
  value: 127,
  source: "linear",
};

const clip: TMidiClipData = {
  clipStartInBeats: 8,
  clipLength: 4,
  adjustTimeOftempee: 0,
  programChange: 0,
  knownCCEvents: [64],
  notes: [note],
  ccMap: {
    "64": [sustain],
  },
  pitchBends: [
    { time: 1, value: -4096 },
    { time: 2, value: 4096, source: "bezier" },
  ],
  channelPressures: [
    { time: 1.5, value: 96 },
  ],
};

const controlChanges = flattenCCEventMap(
  clip.ccMap,
  clip.knownCCEvents,
);
```

Pass a raw-data type to `TMidiClipData` when an application also needs source-specific clip data. Omitting the generic parameter leaves the `raw` property out of the contract.

```ts
type TRawClipData = {
  currentStart: number;
  currentEnd: number;
};

declare const clipWithRawData: TMidiClipData<TRawClipData>;
clipWithRawData.raw.currentStart;
```

### Event value contracts

All event `time` values are floating point quarter-note beats relative to the start of the clip.

| Type | Value contract |
|---|---|
| `NoteEvent` | `duration` and `velocity` may be fractional; `pitch` is an integer from `0` to `127` |
| `ControlChangeEvent` | `controller` is an integer from `0` to `127`; `value` may remain fractional in the `0..127` range |
| `ChannelPressureEvent` | `value` may remain fractional in the `0..127` range |
| `PitchBendEvent` | signed, possibly fractional Live value from `-8192` to `8191` |
| `TempoEvent` | floating point BPM |

`BaseEvent.source` is optional interpolation metadata. It is either `"linear"` or `"bezier"` and is normally omitted for original or discrete events.

`TEnvelopeEvent` is the shared processing shape for Control Change, Channel Pressure, and Pitch Bend envelopes. Its `controller` property is present only for Control Change. Pitch Bend and Channel Pressure remain in their dedicated arrays and do not use negative controller numbers in serialized event data.

`TMidiClipData.cc?()` is an optional compatibility helper. New code should treat `ccMap` as the stored representation and call `flattenCCEventMap()` when it needs one time-sorted CC array.

### Clip metadata

The following optional event collections were added in version 0.10:

- `pitchBends?: PitchBendEvent[]`
- `channelPressures?: ChannelPressureEvent[]`
- `meta?: MetaTextEvent[]`

The root entry point also exports `TimeSignatureEvent` and `KeySignatureEvent` for project-level musical metadata.

## Project summaries

The project types add application IDs and display metadata to clip data. `TTrackInfo.clips` is a map keyed by each `TClipSummary.id`. `TMidiTrackInfo` adds the MIDI output channel, while `TGeneralTrack` represents the track types that may appear in a parsed project.

```ts
import type {
  TMidiClipData,
  TClipSummary,
  TMidiTrackInfo,
  TParsedAbletonLiveSet,
} from "@jeffy-g/live-midi-types";

declare const clip: TMidiClipData;

const clipSummary: TClipSummary<TMidiClipData> = {
  originId: "0",
  id: "clip-6e8c",
  color: "0",
  disabled: false,
  clipName: "Piano",
  trackName: "Track 1",
  annotation: "",
  ...clip,
};

const track: TMidiTrackInfo<TMidiClipData> = {
  originId: "12",
  id: "track-91d2",
  name: "Track 1",
  color: "0",
  annotation: "",
  channel: 0,
  clips: {
    [clipSummary.id]: clipSummary,
  },
};

const project: TParsedAbletonLiveSet<TMidiClipData> = {
  alsName: "MyProject",
  ticksPerQuarter: 480,
  tracks: [track],
  tempoAutomation: [{ time: 0, bpm: 120 }],
};

const tracks = project.tracks;
for (let idx = 0, tracksLen = tracks.length; idx < tracksLen;) {
  const currentTrack = tracks[idx++];
  if ("channel" in currentTrack) {
    // currentTrack.channel is number
    currentTrack.channel;
  }
}
```

`color` is the Ableton palette index stored as a string. Convert it to a CSS color with `getColorFromIndex()`.

## MIDI 1.0 SMF types

SMF types use numeric `ESMFEventType` discriminants. Meta events do not carry a separate marker property; their numeric `type` identifies them. Import the runtime constants and type declarations from their dedicated entry points.

```ts
import { ESMFEventType } from "@jeffy-g/live-midi-types/ESMFEventType";
import type {
  MidiData,
  MidiEndOfTrackEvent,
  MidiNoteOnEvent,
} from "@jeffy-g/live-midi-types/midi10-smf-types";

const noteOn: MidiNoteOnEvent = {
  deltaTime: 0,
  type: ESMFEventType.noteOn,
  channel: 0,
  noteNumber: 60,
  velocity: 100,
};

const endOfTrack: MidiEndOfTrackEvent = {
  deltaTime: 480,
  type: ESMFEventType.endOfTrack,
};

const midi: MidiData = {
  header: {
    format: 0,
    numTracks: 1,
    ticksPerBeat: 480,
  },
  tracks: [[noteOn, endOfTrack]],
};
```

### SMF parser and writer

The codec entry point parses MIDI bytes into `MidiData` and writes the same numeric event contract back to a `Uint8Array`.

```ts
import {
  parseMidi,
  writeMidi,
} from "@jeffy-g/live-midi-types/midi10-smf-io";

declare const source: Uint8Array;

const parsed = parseMidi(source);
const encoded = writeMidi(parsed, {
  running: true,
});
```

`getVarIntSize()` is also exported from this entry point for code that needs to calculate the encoded byte size of an SMF variable-length quantity.

The SMF contract includes:

- format 0, 1, and 2 headers;
- channel voice events, including Note On/Off, CC, Program Change, Channel Aftertouch, and signed Pitch Bend;
- tempo, time signature, key signature, text, and other meta events;
- SysEx, sequencer-specific, and unknown meta events;
- running-status and velocity-zero Note On writer options.

SMF event values are wire-boundary values. In particular, `MidiPitchBendEvent.value` remains signed from `-8192` to `8191`; a writer performs the 14-bit unsigned conversion when encoding the two data bytes.

## Runtime helpers

The root entry point includes a small set of runtime exports:

```ts
import {
  abletonColorPalette,
  eventsIs,
  flattenCCEventMap,
  getColorFromIndex,
  version,
} from "@jeffy-g/live-midi-types";

const color = getColorFromIndex(5); // "#1aff2f"
```

- `flattenCCEventMap()` flattens the listed controller buckets and sorts the result by event time.
- `eventsIs()` identifies note, CC, or tempo event arrays from their first event.
- `getColorFromIndex()` returns the Ableton palette color or `"#888"` for an unknown index.
- `version` exposes the package source version string.

## Source layout

```text
src/
├─ midi-event.ts          # beat-based Ableton event contracts
├─ midi-clip.ts           # clip data and CC map flattening
├─ project.ts             # clip, track, and project summaries
├─ midi10-smf-types.ts    # MIDI 1.0 SMF type declarations
├─ midi10-smf-io.ts       # SMF codec entry point
├─ smf-parser.ts          # numeric SMF parser
├─ smf-writer.ts          # numeric SMF writer
├─ ESMFEventType.ts       # numeric SMF enum declarations
├─ smf-event-type.ts      # runtime numeric SMF constants
├─ ableton-colors.ts      # Live palette and color lookup
└─ index.ts               # root package exports
```

## Related project

- [live-midi-export](https://github.com/jeffy-g/live-midi-export) extracts MIDI clips and project metadata from Ableton Live Sets.

## License

MIT
