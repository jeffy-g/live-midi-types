/*!
 * Original Source: midi-file (https://github.com/carter-thaxton/midi-file/blob/master/index.d.ts)
 * Original License: MIT License
 *
 * + Adapted the original string-based `type` discriminants to use numeric SMF event type codes.
 *
 * Copyright (c) 2025 jeffy-g
 * Released under the MIT license.
 */
/**
 * @file src/midi10-smf-types.ts
 */
import type { ESMFEventType } from "./ESMFEventType.ts";
/**
 * Standard MIDI File `MThd` header fields.
 *
 * Choose either `ticksPerBeat` for musical timing or `framesPerSecond` and
 * `ticksPerFrame` for SMPTE timing. The optional `timeDivision` supplies the
 * encoded 16-bit division word directly when writing.
 *
 * @see ./midi10-header.md for field details and parser/writer behavior.
 */
export interface MidiHeader {
  /** SMF organization: `0` for one track, `1` for synchronous tracks, or `2` for independent sequences. */
  format: 0 | 1 | 2;
  /** Number of `MTrk` chunks reported by the header when parsing. */
  numTracks: number;
  /**
   * Optional raw, unsigned 16-bit division word; takes precedence when writing. (__`0 - 32767`__)
   */
  timeDivision?: number;
  /** SMPTE frames per second; use with `ticksPerFrame`. */
  framesPerSecond?: number;
  /** Number of ticks in one SMPTE frame; use with `framesPerSecond`. */
  ticksPerFrame?: number;
  /** Number of ticks in one quarter note (PPQ); alternative to SMPTE timing. */
  ticksPerBeat?: number;
}
export type TextEventTypesUnion = ESMFEventType.text | ESMFEventType.copyrightNotice | ESMFEventType.trackName | ESMFEventType.instrumentName | ESMFEventType.lyrics | ESMFEventType.marker | ESMFEventType.cuePoint;
export interface MidiBaseEvent<GEventType> {
  /**
   * serialize/deserialize by `writeVarInt/readVarInt`
   * + byte range are __`1 to 4`__ (unsigned integer)
   */
  deltaTime: number;
  /**
   * Numeric event discriminator shared by channel, system-exclusive, and meta events.
   * SHOULD be `ESMFEventType`.
   * @see {@link ESMFEventType}
   */
  type: GEventType;
}
export type MidiEndOfTrackEvent = MidiBaseEvent<ESMFEventType.endOfTrack>;
export type FrameRate = 24 | 25 | 29.97 | 30;
export interface MidiSmpteOffsetMixins {
  frameRate: FrameRate;
  hour: number;
  min: number;
  sec: number;
  frame: number;
  subFrame: number;
}
export type MidiSmpteOffsetEvent = MidiBaseEvent<ESMFEventType.smpteOffset> & MidiSmpteOffsetMixins;
export interface MidiTimeSignatureMixins {
  numerator: number;
  denominator: number;
  /** @todo whats this? */
  metronome: number;
  /** @todo whats this? */
  thirtyseconds: number;
}
export type MidiTimeSignatureEvent = MidiBaseEvent<ESMFEventType.timeSignature> & MidiTimeSignatureMixins;
export interface MidiKeySignatureMixins {
  key: number;
  scale: number;
}
export type MidiKeySignatureEvent = MidiBaseEvent<ESMFEventType.keySignature> & MidiKeySignatureMixins;
export interface MidiDataMixins {
  data: ArrayLike<number>;
}
export type MidiSysExEvent = MidiBaseEvent<ESMFEventType.sysEx> & MidiDataMixins;
export type MidiEndSysExEvent = MidiBaseEvent<ESMFEventType.endSysEx> & MidiDataMixins;
export type MidiSequencerSpecificEvent = MidiBaseEvent<ESMFEventType.sequencerSpecific> & MidiDataMixins;
export interface MidiUnknownMixins {
  data: ArrayLike<number>;
  metatypeByte: number;
}
export type MidiUnknownEvent = MidiBaseEvent<ESMFEventType.unknownMeta> & MidiUnknownMixins;
export interface MidiNumberMixins {
  number: number;
}
export type MidiSequenceNumberEvent = MidiBaseEvent<ESMFEventType.sequenceNumber> & MidiNumberMixins;
export interface MidiTextMixins {
  text: string;
}
export type MidiTextEvent = MidiBaseEvent<ESMFEventType.text> & MidiTextMixins;
export type MidiLyricsEvent = MidiBaseEvent<ESMFEventType.lyrics> & MidiTextMixins;
export type MidiMarkerEvent = MidiBaseEvent<ESMFEventType.marker> & MidiTextMixins;
export type MidiCuePointEvent = MidiBaseEvent<ESMFEventType.cuePoint> & MidiTextMixins;
export type MidiTrackNameEvent = MidiBaseEvent<ESMFEventType.trackName> & MidiTextMixins;
export type MidiInstrumentNameEvent = MidiBaseEvent<ESMFEventType.instrumentName> & MidiTextMixins;
export type MidiCopyrightNoticeEvent = MidiBaseEvent<ESMFEventType.copyrightNotice> & MidiTextMixins;
export type MidiSetTempoEvent = MidiBaseEvent<ESMFEventType.setTempo> & {
  /**
   * __`unsigned 24-bit integer`__
   */
  microsecondsPerBeat: number;
};
export type MidiPortPrefixEvent = MidiBaseEvent<ESMFEventType.portPrefix> & {
  port: number;
};
export type MidiChannelPrefixEvent = MidiBaseEvent<ESMFEventType.channelPrefix> & {
  channel: number;
};
export interface MidiNoteMixins {
  noteNumber: number;
  /**
   * __`unsigned 7-bit integer`__
   * + `0 to 127(0x7f)`
   */
  velocity: number;
  byte9?: true;
}
export type MidiNoteOnEvent = MidiChannelEvent<ESMFEventType.noteOn> & MidiNoteMixins;
export type MidiNoteOffEvent = MidiChannelEvent<ESMFEventType.noteOff> & MidiNoteMixins;
export interface MidiNoteAftertouchMixins {
  noteNumber: number;
  amount: number;
}
export type MidiNoteAftertouchEvent = MidiChannelEvent<ESMFEventType.noteAftertouch> & MidiNoteAftertouchMixins;
export interface MidiControllerMixins {
  controllerType: number;
  /**
   * __`unsigned 7-bit integer`__
   * + `0 to 127(0x7f)`
   */
  value: number;
}
export interface MidiChannelEvent<GEventType> extends MidiBaseEvent<GEventType> {
  running?: true;
  channel: number;
}
export type MidiPitchBendEvent = MidiChannelEvent<ESMFEventType.pitchBend> & {
  /**
   * __`SPEC`__: 14bit `-8192 to 8191` (integer)
   */
  value: number;
};
/**
 * @see {@link https://anotherproducer.com/online-tools-for-musicians/midi-cc-list/ MIDI CC List for Continuous Controllers}
 */
export type MidiControllerEvent = MidiChannelEvent<ESMFEventType.controller> & MidiControllerMixins;
export type MidiProgramChangeEvent = MidiChannelEvent<ESMFEventType.programChange> & {
  programNumber: number;
};
export type MidiChannelAftertouchEvent = MidiChannelEvent<ESMFEventType.channelAftertouch> & {
  amount: number;
};
export type MidiEvent =
  | MidiTextEvent
  | MidiSysExEvent
  | MidiLyricsEvent
  | MidiMarkerEvent
  | MidiNoteOnEvent
  | MidiNoteOffEvent
  | MidiUnknownEvent
  | MidiCuePointEvent
  | MidiEndSysExEvent
  | MidiSetTempoEvent
  | MidiPitchBendEvent
  | MidiTrackNameEvent
  | MidiControllerEvent
  | MidiEndOfTrackEvent
  | MidiPortPrefixEvent
  | MidiSmpteOffsetEvent
  | MidiKeySignatureEvent
  | MidiChannelPrefixEvent
  | MidiProgramChangeEvent
  | MidiTimeSignatureEvent
  | MidiInstrumentNameEvent
  | MidiNoteAftertouchEvent
  | MidiSequenceNumberEvent
  | MidiCopyrightNoticeEvent
  | MidiChannelAftertouchEvent
  | MidiSequencerSpecificEvent;
/**
 * Common Utilities
 */
export type WithAbsoluteTime = {
  /**
   * `absoluteTime` is same as `ticks`
   */
  absoluteTime: number;
};
/**
 * MIDI Event Derivation
 */
export type MidiEventWithAbsTime<GEvent extends MidiEvent = MidiEvent> = GEvent & WithAbsoluteTime;
/**
 * MIDI Event Derivation
 */
export type TTrackEvents<GEvent extends MidiEvent = MidiEvent> = Array<MidiEventWithAbsTime<GEvent>>;
export interface MidiData {
  header: MidiHeader;
  tracks: MidiEvent[][];
}
export interface MidiWriteOption {
  /**
   * reuse previous eventTypeByte when possible, to compress file
   */
  running?: boolean;
  /**
   * use 0x09 for noteOff when velocity is zero
   */
  useByte9ForNoteOff?: boolean;
}
