/*!
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  Copyright (C) 2025 jeffy-g <hirotom1107@gmail.com>
//  Released under the MIT license
//  https://opensource.org/licenses/mit-license.php
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file src/project.ts
 */
import type { TempoEvent, MetaTextEvent, TimeSignatureEvent, KeySignatureEvent } from "./midi-event.ts";
/**
 * Summary information for an Ableton Live MIDI clip.
 */
export type TClipSummary<T extends Record<string, any>> = {
  /**
   * Original `MidiClip` ID from the ALS document.
   *
   * + Stored as a numeric string.
   *
   * ```
   * "/Ableton/LiveSet/Tracks/MidiTrack[4]/DeviceChain/MainSequencer/ClipTimeable/ArrangerAutomation/Events/MidiClip[3]/@Id"
   * ```
   * @date 2026/07/02
   */
  originId: string;
  /**
   * Application-specific ID assigned for use by the UI and other consumers.
   *
   * ```
   * `clip-${crypto.randomUUID()}`
   * ```
   */
  id: string;
  /**
   * Index into the Ableton Live color palette.
   * + This value is always the index of the color palette.
   * ```
   * // e.g. xpath
   * "/Ableton/LiveSet/Tracks/MidiTrack/DeviceChain/MainSequencer/ClipTimeable/ArrangerAutomation/Events/MidiClip/Color/@Value"
   *
   * // how to actual color
   * // e.g - "0" to "#ff94a6", "12" to "#e553a0"
   * const hexColor = getColorFromIndex(+clip.color);
   * ```
   *
   * @see {@link getColorFromIndex}
   */
  color: string;
  /**
   * Whether the clip is disabled.
   */
  disabled: boolean;
  /**
   * Original name of the `MidiClip`.
   *
   * ```
   * // e.g
   * "/Ableton/LiveSet/Tracks/MidiTrack/DeviceChain/MainSequencer/ClipTimeable/ArrangerAutomation/Events/MidiClip/Name/@Value"
   * ```
   */
  clipName: string;
  /**
   * Name of the parent track.
   */
  trackName: string;
  /**
   * Annotation attached to this `MidiClip` in Ableton Live.
   *
   * + Any text value appears to be accepted.
   *
   * ```
   * // e.g
   * "/Ableton/LiveSet/Tracks/MidiTrack/DeviceChain/MainSequencer/ClipTimeable/ArrangerAutomation/Events/MidiClip/Annotation/@Value"
   * ```
   */
  annotation: string;
} & T;
/**
 * Summary information for an Ableton Live track.
 */
export type TTrackInfo<T extends Record<string, any>> = {
  /**
   * Original track ID from the ALS document.
   *
   * ```
   * // e.g
   * "/Ableton/LiveSet/Tracks/MidiTrack[4]/@Id"
   * ```
   * @date 2026/07/02
   */
  originId: string;
  /**
   * Application-specific ID assigned for use by the UI and other consumers.
   *
   * ```
   * // e.g.
   * "track-" + crypto.randomUUID()
   * ```
   */
  id: string;
  /**
   * Original name of the track.
   *
   * ```
   * // e.g MidiTrack
   * "/Ableton/LiveSet/Tracks/MidiTrack/Name/EffectiveName/@Value"
   * ```
   */
  name: string;
  /**
   * Index into the Ableton Live color palette.
   * + This value is always the index of the color palette.
   *
   * ```
   * // e.g. xpath (MidiTrack)
   * "/Ableton/LiveSet/Tracks/MidiTrack/Color/@Value"
   *
   * // Convert the index to a CSS color:
   * // e.g - "0" to "#ff94a6", "12" to "#e553a0"
   * const hexColor = getColorFromIndex(+track.color);
   * ```
   * @see {@link getColorFromIndex}
   */
  color: string;
  /**
   * Annotation attached to this track in Ableton Live. (MidiTrack etc).
   *
   * + Any text value appears to be accepted.
   * ```
   * // e.g (MidiTrack)
   * "/Ableton/LiveSet/Tracks/MidiTrack/Name/Annotation/@Value"
   * ```
   */
  annotation: string;
  /**
   * MIDI clips indexed by {@linkcode TClipSummary.id TClipSummary.id}
   */
  clips: {
    [uuidLike: string]: TClipSummary<T>;
  };
  /**
   * @since v0.10.0
   */
  meta?: MetaTextEvent[];
};
export type TMidiTrackInfo<T extends Record<string, any>> = TTrackInfo<T> & {
  /**
   * Midi Track output channel
   * @since v0.11.1
   */
  channel: number;
};
/**
 * @since v0.11.1
 */
export type TGeneralTrack<T extends Record<string, any>> = TTrackInfo<T> | TMidiTrackInfo<T>;
/**
 * Parsed data required by the Ableton Live project UI.
 */
export type TParsedAbletonLiveSet<GTrackType = TGeneralTrack<Record<string, any>>> = {
  /**
   * Ableton Live project name.
   *
   * + Usually the `.als` filename without its extension.
   */
  alsName: string;
  /**
   * Pulses per quarter note (PPQ).
   *
   * + This value is not stored in the ALS document; it is supplied by the application.
   */
  ticksPerQuarter: number;
  /**
   * Tracks in the project.
   *
   * + Currently contains only MIDI tracks.
   *
   * + Future versions may also include other track types, such as audio tracks.
   *
   * ```ts
   * declare const als: TParsedAbletonLiveSet<Record<string, never>>;
   * const tracks = als.tracks;
   *
   * for (let idx = 0, tracksLen = tracks.length; idx < tracksLen;) {
   *   const track = tracks[idx++];
   *   if ("channel" in track) {
   *     // track.channel is number
   *     track.channel;
   *   }
   * }
   * ```
   */
  tracks: GTrackType[];
  /**
   * Tempo automation events extracted from the master track.
   *
   * + Retrieving tempo event data requires a version-dependent XPath.
   * ```
   * // Specific XPath examples (live 12.x)
   * "/Ableton/LiveSet/MasterTrack/AutomationEnvelopes/Envelopes/AutomationEnvelope[2]/Automation/Events"
   * ```
   */
  tempoAutomation: TempoEvent[];
  /**
   * @since v0.10.0
   */
  timeSignatures?: TimeSignatureEvent[];
  /**
   * @since v0.10.0
   */
  keySignatures?: KeySignatureEvent[];
};
