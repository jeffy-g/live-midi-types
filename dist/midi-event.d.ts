/*!
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  Copyright (C) 2025 jeffy-g <hirotom1107@gmail.com>
//  Released under the MIT license
//  https://opensource.org/licenses/mit-license.php
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file src/midi-event.ts
 * @summary Common MIDI event types for Ableton Live and related tools.
 */
import type { TextEventTypesUnion } from "./midi10-smf-types.ts";
export type BaseEvent = {
  /**
   * Time relative to the start of the clip.
   *
   * **This is a floating point number representing the time in quarter notes. (Ableton Live)**
   *
   * + Beat-based timestamps (e.g. 4.5 = 4 beats and an eighth note)
   */
  time: number;
  /**
   * Interpolation method used to generate this envelope sample.
   *
   * - `"bezier"`: Generated using Bézier interpolation.
   * - `"linear"`: Generated using linear interpolation.
   *
   * Intended for diagnostics. Omitted for original or discrete events.
   * @date 2026/09/16 21:09:00
   */
  source?: "bezier" | "linear";
};
/**
 * ```
 * // Path to `MidiClip` element
 * `/Ableton/LiveSet/Tracks/MidiTrack[]/DeviceChain/MainSequencer/ClipTimeable/ArrangerAutomation/Events/MidiClip[]`
 * // this type is `MidiNoteEvent`
 * `<MidiClip>/Notes/KeyTracks/KeyTrack[]/Notes/MidiNoteEvent[]`
 * ```
 */
export type NoteEvent = BaseEvent & {
  /**
   * NOTE: floating number
   * + quarter-note beats
   */
  duration: number;
  /**
   * NOTE: Must be an integer. Floating-point values are invalid.
   * + `0..127` integer
   */
  pitch: number;
  /**
   * `0` to `127`
   * NOTE: floating number
   */
  velocity: number;
};
export type ControlChangeEvent = BaseEvent & {
  /**
   * MIDI controller number.
   *
   * NOTE: Must be an integer. Floating-point values are invalid.
   * + `0..127` integer
   */
  controller: number;
  /**
   * `0` to `127`
   *
   * Value of the controller (0-127, floating number).
   */
  value: number;
};
/**
 * @date 2026/09/14 06:21:51
 */
export type ChannelPressureEvent = BaseEvent & {
  /**
   * `0` to `127`
   *
   * Value of the ChannelPressure (0-127, floating number).
   */
  value: number;
};
/**
 * @date 2026/09/14 06:21:51
 */
export type PitchBendEvent = BaseEvent & {
  /**
   * `-8192 to 8191` (Live)
   *
   * Value of the PitchBend (floating number).
   */
  value: number;
};
/**
 * Tempo event object.
 */
export type TempoEvent = BaseEvent & {
  /**
   * Tempo in BPM. (floating number)
   */
  bpm: number;
};
/**
 * Shared processing shape for Control Change, Channel Pressure, and Pitch Bend
 * envelope events extracted from an Ableton Live MIDI clip.
 *
 * + This is an intermediate event type, not an SMF wire event.
 * + It retains beat-based time, fractional Live values, and optional interpolation diagnostics until the target-specific MIDI encoding step.
 * + A Control Change carries `controller`, Pitch Bend and Channel Pressure do not.
 *
 * @see {@linkcode ControlChangeEvent}
 * @see {@linkcode ChannelPressureEvent}
 * @see {@linkcode PitchBendEvent}
 *
 * @since v0.10.0
 */
export type TEnvelopeEvent = BaseEvent & {
  /**
   * Floating-point envelope value in the target's native Live range.
   *
   * - Control Change / Channel Pressure: `0..127`
   * - Pitch Bend: signed `-8192..8191` with center `0`
   *
   * Preserve fractional values while processing the envelope. At the SMF encode
   * boundary, values are quantized with `Math.floor()`; Pitch Bend remains signed
   * until the MIDI writer applies the single `+0x2000` conversion.
   */
  value: number;
  /**
   * MIDI controller number (`0..127`) for a Control Change event.
   *
   * Omitted for Pitch Bend and Channel Pressure. Their internal target numbers
   * (`-2` and `-1`) identify envelope-map buckets and must not be stored here.
   */
  controller?: number;
};
/**
 * @since v0.10.0
 */
export type MetaTextEvent = {
  /** Time in quarter-note beats. */
  time: number;
  text: string;
  type: TextEventTypesUnion;
};
/**
 * @since v0.10.0
 */
export type TimeSignatureEvent = {
  /** Time in quarter-note beats. */
  time: number;
  numerator: number;
  denominator: number;
  metronome?: number;
  thirtyseconds?: number;
};
/**
 * @since v0.10.0
 */
export type KeySignatureEvent = {
  /** Time in quarter-note beats. */
  time: number;
  key: string;
  scale: "major" | "minor";
};
/**
 * Type alias for MIDI event types.
 *
 * This type maps event names to their corresponding event types.
 */
export type TEventMap = {
  note: NoteEvent[];
  cc: ControlChangeEvent[];
  tempo: TempoEvent[];
};
/**
 * Type guard to check if the events array contains a specific type of MIDI event.
 * @template {keyof TEventMap} K
 * @param {unknown[]} events Array of events to check.
 * @param {K} type Type of event to check against.
 * @returns {events is TEventMap[K]} True if the events match the specified type.
 */
export declare const eventsIs: <K extends keyof TEventMap>(events: unknown[], type: K) => events is TEventMap[K];
