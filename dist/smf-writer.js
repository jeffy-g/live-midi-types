/*!
 * Original Source: midi-file (https://github.com/carter-thaxton/midi-file/blob/master/lib/midi-writer.js)
 * Original License: MIT License
 *
 * This file is a reimplementation of the original midi-writer.js with performance optimizations.
 * The core logic is preserved, but the Writer class is replaced with a more efficient
 * implementation that pre-calculates the buffer size and writes directly to a Uint8Array.
 *
 * Copyright (c) 2025 jeffy-g
 * Released under the MIT license.
 */
/**
 * @file src/smf-writer.ts
 */
/**
 * @import {
 *   MidiData,
 *   MidiEvent,
 *   MidiHeader,
 *   MidiChannelEvent,
 *   MidiWriteOption,
 * } from "./midi10-smf-types.ts";
 */
/** cache object  */
const encoder = new TextEncoder();
/**
 * A highly efficient writer that pre-allocates a buffer and writes data directly
 * into it using offsets. This avoids the massive overhead of Array.push/concat.
 *
 * @see {@link https://sites.google.com/site/yyagisite/material/smfspec?authuser=0 SMF (Standard MIDI Files) の構造}
 */
class FastWriter {
  /**
   * @param {number} size
   */
  constructor(size) {
    this.writeInt8 = this.writeUInt8;
    this.buffer = new Uint8Array(size);
    this.view = new DataView(this.buffer.buffer);
    this.offset = 0;
  }
  /**
   * @param {number} value
   */
  writeUInt8(value) {
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }
  /**
   * @param {number} value
   */
  writeUInt16(value) {
    this.view.setUint16(this.offset, value, false);
    this.offset += 2;
  }
  /**
   * @param {number} value
   */
  writeUInt24(value) {
    const view = this.view,
      offset = this.offset;
    view.setUint8(offset, (value >> 16) & 0xff);
    view.setUint8(offset + 1, (value >> 8) & 0xff);
    view.setUint8(offset + 2, value & 0xff);
    this.offset += 3;
  }
  /**
   * @param {number} value
   */
  writeUInt32(value) {
    this.view.setUint32(this.offset, value, false);
    this.offset += 4;
  }
  /**
   * @param {ArrayLike<number>} data
   */
  writeBytes(data) {
    this.buffer.set(data, this.offset);
    this.offset += data.length;
  }
  /**
   * @param {string} str
   */
  writeString(str) {
    this.writeBytes(encoder.encode(str));
  }
  /**
   * @param {number} value
   */
  writeVarInt(value) {
    const buf = this.buffer;
    const offset = this.offset;
    if (value <= 0x7f) {
      buf[offset] = value;
      this.offset = offset + 1;
      return;
    }
    let v = value;
    const bytes = [];
    bytes.push(v & 0x7f);
    v >>>= 7;
    while (v) {
      bytes.push((v & 0x7f) | 0x80);
      v >>>= 7;
    }
    v = bytes.length;
    this.offset = offset + v;
    let i = 0;
    while (v--) {
      buf[offset + v] = bytes[i++];
    }
  }
  /**
   * @param {string} id
   * @param {Uint8Array} data
   */
  writeChunk(id, data) {
    this.writeString(id);
    this.writeUInt32(data.length);
    this.writeBytes(data);
  }
  /**
   * @param {number} msPerBeat microsecondsPerBeat
   */
  writeSetTempo(msPerBeat) {
    var view = this.view;
    var offset = this.offset;
    view.setUint8(offset, 0xff);
    view.setUint8(offset + 1, 0x51);
    view.setUint8(offset + 2, 3);
    view.setUint8(offset + 3, (msPerBeat >> 16) & 0xff);
    view.setUint8(offset + 4, (msPerBeat >> 8) & 0xff);
    view.setUint8(offset + 5, msPerBeat & 0xff);
    this.offset = offset + 6;
  }
}
/**
 * @param {number} type
 * @throws {Error} Unrecognized event type
 */
const throwInvalidType = (type) => {
  throw new Error(`Unrecognized event type: ${type}`);
};
/**
 * Returns the number of bytes required to encode a non-negative integer
 * as a MIDI 1.0 Variable-Length Quantity (VLQ).
 *
 * VLQ encoding uses 7 bits of payload per byte; the MSB of each byte
 * is a continuation flag (1 = more bytes follow, 0 = final byte).
 * The MIDI 1.0 spec caps values at 4 bytes → max encodable value is
 * `0x0FFF_FFFF` (268,435,455 / 28 bits).
 *
 * ```
 * value range                 encoded bytes
 * ─────────────────────────── ─────────────
 * 0x0000_0000 – 0x0000_007F       1
 * 0x0000_0080 – 0x0000_3FFF       2
 * 0x0000_4000 – 0x001F_FFFF       3
 * 0x0020_0000 – 0x0FFF_FFFF       4
 * ```
 *
 * @see MIDI 1.0 Detailed Specification §2 — "Variable-Length Quantities"
 *
 * @param {number} value - A non-negative integer to encode as VLQ.
 * @returns Byte count needed to hold the VLQ-encoded value (1–4).
 * @throws {RangeError} If `value` is negative or exceeds `0x0FFF_FFFF`.
 *
 * @example
 * getVarIntSize(0x0000_0000);  // → 1  (MIDI delta-time of 0)
 * getVarIntSize(0x0000_007F);  // → 1
 * getVarIntSize(0x0000_0080);  // → 2
 * getVarIntSize(0x0FFF_FFFF);  // → 4  (spec maximum)
 */
export function getVarIntSize(value) {
  if (value < 0) throw new RangeError(`VLQ value must be ≥ 0 (got ${value})`);
  if (value <= 127) return 1;
  if (value <= 16383) return 2;
  if (value <= 2097151) return 3;
  if (value <= 268435455) return 4;
  throw new RangeError(`VLQ value 0x${value.toString(16)} exceeds MIDI 1.0 maximum (0x0FFF_FFFF)`);
}
/**
 * @template GType
 * @typedef {GType & { bytes: Uint8Array }} TInternalTextEvent
 */
/** @type {(event: MidiEvent) => number} */
// @ts-expect- error `useByte9ForNoteOff` is unused...
function calculateEventSize(event /* , useByte9ForNoteOff?: boolean */) {
  let size = getVarIntSize(event.deltaTime);
  /** @type {number} */
  let temp;
  switch (event.type) {
    case 0 /* ESMFEventType.sequenceNumber */:
      size += 5;
      break;
    case 1 /* ESMFEventType.text */:
    case 2 /* ESMFEventType.copyrightNotice */:
    case 3 /* ESMFEventType.trackName */:
    case 4 /* ESMFEventType.instrumentName */:
    case 5 /* ESMFEventType.lyrics */:
    case 6 /* ESMFEventType.marker */:
    case 7 /* ESMFEventType.cuePoint */: {
      const u8data = encoder.encode(event.text);
      const u8dataLen = u8data.length;
      size += 2 + getVarIntSize(u8dataLen) + u8dataLen;
      /** @type {TInternalTextEvent<typeof event>} */ (event).bytes = u8data;
      break;
    }
    case 8 /* ESMFEventType.noteOff */:
    case 9 /* ESMFEventType.noteOn */:
    case 10 /* ESMFEventType.noteAftertouch */:
    case 11 /* ESMFEventType.controller */:
    case 14 /* ESMFEventType.pitchBend */:
      size += 3 - +!!event.running;
      break;
    case 12 /* ESMFEventType.programChange */:
    case 13 /* ESMFEventType.channelAftertouch */:
      size += 2 - +!!event.running;
      break;
    case 32 /* ESMFEventType.channelPrefix */:
    case 33 /* ESMFEventType.portPrefix */:
      size += 4;
      break;
    case 47 /* ESMFEventType.endOfTrack */:
      size += 3;
      break;
    case 81 /* ESMFEventType.setTempo */:
      size += 6;
      break;
    case 84 /* ESMFEventType.smpteOffset */:
      size += 8;
      break;
    case 88 /* ESMFEventType.timeSignature */:
      size += 7;
      break;
    case 89 /* ESMFEventType.keySignature */:
      size += 5;
      break;
    case -1 /* ESMFEventType.unknownMeta */:
    case 127 /* ESMFEventType.sequencerSpecific */:
      size += 2 + getVarIntSize((temp = event.data.length)) + temp;
      break;
    case 240 /* ESMFEventType.sysEx */:
    case 247 /* ESMFEventType.endSysEx */:
      size += 1 + getVarIntSize((temp = event.data.length)) + temp;
      break;
    default:
      throwInvalidType(/** @type {MidiEvent} */ (event).type);
  }
  return size;
}
/**
 * @param {MidiEvent[]} track
 */
function calculateTrackSize(track) {
  let size = 8;
  const trackLen = track.length;
  for (let idx = 0; idx < trackLen;) {
    size += calculateEventSize(track[idx++]);
  }
  return size;
}
/**
 * @param {MidiData} data
 */
function calculateMidiSize(data) {
  let size = 14;
  const trackEvents = data.tracks;
  for (let idx = 0, trackEventsLen = trackEvents.length; idx < trackEventsLen;) {
    size += calculateTrackSize(trackEvents[idx++]);
  }
  return size;
}
/**
 * @param {FastWriter} w
 * @param {MidiHeader} header
 * @param {number} numTracks
 */
function writeHeader(w, header, numTracks) {
  const format = header.format ?? 1;
  let timeDivision = 128;
  if (header.timeDivision) {
    timeDivision = header.timeDivision;
  } else if (header.ticksPerFrame && header.framesPerSecond) {
    timeDivision = (-(header.framesPerSecond & 0xff) << 8) | (header.ticksPerFrame & 0xff);
  } else if (header.ticksPerBeat) {
    timeDivision = header.ticksPerBeat & 0x7fff;
  }
  const h = new FastWriter(6);
  h.writeUInt16(format);
  h.writeUInt16(numTracks);
  h.writeUInt16(timeDivision);
  w.writeChunk("MThd", h.buffer);
}
const FRAME_RATES = { 24: 0x00, 25: 0x20, 29.97: 0x40, 30: 0x60 };
/** @type {(w: FastWriter, event: MidiEvent, lastEventTypeByte: number | undefined, useByte9ForNoteOff?: boolean) => number | undefined} */
function writeEvent(w, event, lastEventTypeByte, useByte9ForNoteOff) {
  /** @type {number=} */
  let eventTypeByte;
  w.writeVarInt(event.deltaTime);
  switch (event.type) {
    case 0 /* ESMFEventType.sequenceNumber */:
      w.writeUInt8(0xff);
      w.writeUInt8(0x00);
      w.writeVarInt(2);
      w.writeUInt16(event.number);
      break;
    case 1 /* ESMFEventType.text */:
    case 2 /* ESMFEventType.copyrightNotice */:
    case 3 /* ESMFEventType.trackName */:
    case 4 /* ESMFEventType.instrumentName */:
    case 5 /* ESMFEventType.lyrics */:
    case 6 /* ESMFEventType.marker */:
    case 7 /* ESMFEventType.cuePoint */: {
      w.writeUInt8(0xff);
      w.writeUInt8(event.type);
      const textBytes = /** @type {TInternalTextEvent<typeof event>} */ (event).bytes;
      w.writeVarInt(textBytes.length);
      w.writeBytes(textBytes);
      break;
    }
    case 8 /* ESMFEventType.noteOff */:
      const noteMSB = (useByte9ForNoteOff !== false && event.byte9) || (useByte9ForNoteOff && event.velocity === 0) ? 0x90 : 0x80;
      eventTypeByte = noteMSB | event.channel;
      if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
      w.writeUInt8(event.noteNumber);
      w.writeUInt8(event.velocity);
      break;
    case 9 /* ESMFEventType.noteOn */:
      eventTypeByte = 0x90 | event.channel;
      if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
      w.writeUInt8(event.noteNumber);
      w.writeUInt8(event.velocity);
      break;
    case 10 /* ESMFEventType.noteAftertouch */:
      eventTypeByte = 0xa0 | event.channel;
      if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
      w.writeUInt8(event.noteNumber);
      w.writeUInt8(event.amount);
      break;
    case 11 /* ESMFEventType.controller */:
      eventTypeByte = 0xb0 | event.channel;
      if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
      w.writeUInt8(event.controllerType);
      w.writeUInt8(event.value);
      break;
    case 12 /* ESMFEventType.programChange */:
      eventTypeByte = 0xc0 | event.channel;
      if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
      w.writeUInt8(event.programNumber);
      break;
    case 13 /* ESMFEventType.channelAftertouch */:
      eventTypeByte = 0xd0 | event.channel;
      if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
      w.writeUInt8(event.amount);
      break;
    case 14 /* ESMFEventType.pitchBend */:
      eventTypeByte = 0xe0 | event.channel;
      if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
      const value14 = 0x2000 + event.value;
      w.writeUInt8(value14 & 0x7f);
      w.writeUInt8((value14 >> 7) & 0x7f);
      break;
    case 32 /* ESMFEventType.channelPrefix */:
      w.writeUInt8(0xff);
      w.writeUInt8(0x20);
      w.writeVarInt(1);
      w.writeUInt8(event.channel);
      break;
    case 33 /* ESMFEventType.portPrefix */:
      w.writeUInt8(0xff);
      w.writeUInt8(0x21);
      w.writeVarInt(1);
      w.writeUInt8(event.port);
      break;
    case 47 /* ESMFEventType.endOfTrack */:
      w.writeUInt8(0xff);
      w.writeUInt8(0x2f);
      w.writeVarInt(0);
      break;
    case 81 /* ESMFEventType.setTempo */:
      w.writeSetTempo(event.microsecondsPerBeat);
      break;
    case 84 /* ESMFEventType.smpteOffset */:
      w.writeUInt8(0xff);
      w.writeUInt8(0x54);
      w.writeVarInt(5);
      const hourByte = (event.hour & 0x1f) | FRAME_RATES[event.frameRate];
      w.writeUInt8(hourByte);
      w.writeUInt8(event.min);
      w.writeUInt8(event.sec);
      w.writeUInt8(event.frame);
      w.writeUInt8(event.subFrame);
      break;
    case 88 /* ESMFEventType.timeSignature */:
      w.writeUInt8(0xff);
      w.writeUInt8(0x58);
      w.writeVarInt(4);
      w.writeUInt8(event.numerator);
      const denominator = Math.floor(Math.log(event.denominator) / Math.LN2) & 0xff;
      w.writeUInt8(denominator);
      w.writeUInt8(event.metronome);
      w.writeUInt8(event.thirtyseconds || 8);
      break;
    case 89 /* ESMFEventType.keySignature */:
      w.writeUInt8(0xff);
      w.writeUInt8(0x59);
      w.writeVarInt(2);
      w.writeInt8(event.key);
      w.writeUInt8(event.scale);
      break;
    case 127 /* ESMFEventType.sequencerSpecific */:
      w.writeUInt8(0xff);
      w.writeUInt8(0x7f);
      w.writeVarInt(event.data.length);
      w.writeBytes(event.data);
      break;
    case -1 /* ESMFEventType.unknownMeta */:
      if (event.metatypeByte != null) {
        w.writeUInt8(0xff);
        w.writeUInt8(event.metatypeByte);
        w.writeVarInt(event.data.length);
        w.writeBytes(event.data);
      }
      break;
    case 240 /* ESMFEventType.sysEx */:
      w.writeUInt8(0xf0);
      w.writeVarInt(event.data.length);
      w.writeBytes(event.data);
      break;
    case 247 /* ESMFEventType.endSysEx */:
      w.writeUInt8(0xf7);
      w.writeVarInt(event.data.length);
      w.writeBytes(event.data);
      break;
    default:
      throwInvalidType(/** @type {MidiEvent} */ (event).type);
  }
  return eventTypeByte;
}
/** @type {(writer: FastWriter, track: MidiEvent[], opts: MidiWriteOption) => void} */
function writeTrack(writer, track, opts) {
  writer.writeString("MTrk");
  writer.writeUInt32(calculateTrackSize(track) - 8);
  let eventTypeByte;
  for (let idx = 0, L = track.length; idx < L;) {
    const midiEvent = track[idx++];
    if (opts.running === false || (!opts.running && !(/** @type {MidiChannelEvent<unknown>} */ (midiEvent).running))) {
      eventTypeByte = undefined;
    }
    eventTypeByte = writeEvent(writer, midiEvent, eventTypeByte, opts.useByte9ForNoteOff);
  }
}
/**
 * Writes MIDI data to a Uint8Array.
 * @param {MidiData} data The MIDI data to write.
 * @param {MidiWriteOption=} opts Options for writing the MIDI file.
 * @returns A Uint8Array containing the MIDI file data.
 */
export function writeMidi(data, opts = {}) {
  if (typeof data !== "object") {
    throw new Error("Invalid MIDI data");
  }
  const header = data.header || {};
  const tracks = data.tracks || [];
  const totalSize = calculateMidiSize(data);
  const w = new FastWriter(totalSize);
  writeHeader(w, header, tracks.length);
  for (const track of tracks) {
    writeTrack(w, track, opts);
  }
  return w.buffer;
}
