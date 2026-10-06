/*!
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  Copyright (C) 2025 jeffy-g <hirotom1107@gmail.com>
//  Released under the MIT license
//  https://opensource.org/licenses/mit-license.php
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file src/midi-clip.ts
 * @summary Common MIDI clip data type for Ableton Live and related tools.
 */
import type { NoteEvent, MetaTextEvent, PitchBendEvent, ControlChangeEvent, ChannelPressureEvent } from "./midi-event.ts";
/**
 * MIDI clip data extracted from Ableton Live's MidiClip object.
 *
 * This type represents all essential information for a single MIDI clip,
 * including note events, control change events, and timing information.
 *
 * ```ts
 * import type { TMidiClipData } from "@jeffy-g/live-midi-types";
 * const data: TMidiClipData = ...;
 * ```
 */
export type TMidiClipData<GRawData = never> = {
  /**
   * Start position of the clip on the Live MidiTrack (in beats).
   */
  clipStartInBeats: number;
  /**
   * Length of the clip (in beats). Usually `CurrentEnd.Value - CurrentStart.Value`.
   *
   * ```
   * // e.g. obtain `midiClip` object
   * // xpath: "/Ableton/LiveSet/Tracks/MidiTrack[1]/DeviceChain/MainSequencer/ClipTimeable/ArrangerAutomation/Events/MidiClip[1]"
   * const midiClip = Ableton.LiveSet.Tracks.MidiTrack[1].DeviceChain.MainSequencer.ClipTimeable.ArrangerAutomation.Events.MidiClip[1];
   * // clip start position in Live arrangement view
   * const clipStart = midiClip.CurrentStart.Value;
   * // clip end position in Live arrangement view
   * const clipEnd = midiClip.CurrentEnd.Value;
   * // calculate clip range
   * const clipLength = +clipEnd - +clipStart;
   * ```
   */
  clipLength: number;
  /**
   * Time adjustment for tempo mapping (in beats).
   */
  adjustTimeOftempee: number;
  /**
   * @since v0.11.1
   */
  programChange: number;
  /**
   * CC numbers known to this clip, sorted in ascending order.
   *
   * {@link TMidiClipData.ccMap __`ccMap`__}
   */
  knownCCEvents: number[];
  /**
   * Array of extracted note events.
   */
  notes: NoteEvent[];
  /**
   * Control change event map. (key: cc number, `0..127`)
   * @since v0.8.0
   */
  ccMap: {
    [ccNumber: `${number}`]: ControlChangeEvent[];
  };
  /**
   * Array of extracted control change events. (flatten {@link TMidiClipData.ccMap __`ccMap`__}, sort by time)
   * + use `flattenCCEventMap` (recommended)
   * @since v0.8.0
   * @see {@link flattenCCEventMap}
   */
  cc?(): ControlChangeEvent[];
  /**
   * @since v0.10.0
   */
  pitchBends?: PitchBendEvent[];
  /**
   * @since v0.10.0
   */
  channelPressures?: ChannelPressureEvent[];
  /**
   * @since v0.10.0
   */
  meta?: MetaTextEvent[];
} & (
  [GRawData] extends [never] ? {} : { raw: GRawData }
);
/**
 * @param {Record<string, ControlChangeEvent[]>} ccEventMap
 * @param {number[]} knownCCEvents
 */
export declare const flattenCCEventMap: (ccEventMap: Record<string, ControlChangeEvent[]>, knownCCEvents: number[]) => ControlChangeEvent[];
/**
 * @import { ControlChangeEvent } from "./midi-event.ts";
 */
