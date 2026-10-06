/*!
 * Original Source: midi-file (https://github.com/carter-thaxton/midi-file/blob/master/lib/midi-parser.js)
 * Original License: MIT License
 *
 * This file is a numeric-event reimplementation optimized for Uint8Array input.
 * Copyright (c) 2026 jeffy-g
 * Released under the MIT license.
 */
/**
 * @file src/smf-parser.ts
 */
/**
 * @import {
 *   FrameRate,
 *   MidiData,
 *   MidiEvent,
 *   MidiHeader,
 * } from "./midi10-smf-types";
 */
/**
 * ```
 * // "MThd"
 * String.fromCharCode(0x4d, 0x54, 0x68, 0x64) === "MThd"
 * ```
 */
const MTHD = 0x4d546864;
/**
 * ```
 * // "MTrk"
 * String.fromCharCode(0x4d, 0x54, 0x72, 0x6b) === "MTrk"
 * ```
 */
const MTRK = 0x4d54726b;
/** @type {FrameRate[]} */
const FRAME_RATES = [24, 25, 29.97, 30];
const decorder = new TextDecoder();
class SmfReader {
  /**
   * @param {Uint8Array} data
   */
  constructor(data) {
    this.pos = 0;
    this.data = data;
  }
  readUInt8() {
    return this.data[this.pos++];
  }
  readInt8() {
    const value = this.data[this.pos++];
    return value & 0x80 ? value - 0x100 : value;
  }
  readUInt16() {
    const data = this.data;
    const pos = this.pos;
    this.pos = pos + 2;
    return (data[pos] << 8) | data[pos + 1];
  }
  readUInt24() {
    const data = this.data;
    const pos = this.pos;
    this.pos = pos + 3;
    return (data[pos] << 16) | (data[pos + 1] << 8) | data[pos + 2];
  }
  readUInt32() {
    const data = this.data;
    const pos = this.pos;
    this.pos = pos + 4;
    return (data[pos] * 0x1000000 + (data[pos + 1] << 16) + (data[pos + 2] << 8) + data[pos + 3]) >>> 0;
  }
  readVarInt() {
    const data = this.data;
    let position = this.pos;
    let result = 0;
    for (let count = 0; count++ < 4;) {
      const byte = data[position++];
      result = (result << 7) | (byte & 0x7f);
      if ((byte & 0x80) === 0) {
        this.pos = position;
        return result;
      }
    }
    throw new Error("MIDI variable-length integer exceeds four bytes");
  }
  /**
   * @param {number} length
   */
  readBytes(length) {
    const start = this.pos;
    const end = start + length;
    this.pos = end;
    return this.data.slice(start, end);
  }
  /**
   * @param {number} length
   */
  readString(length) {
    const start = this.pos;
    const end = start + length;
    this.pos = end;
    return decorder.decode(this.data.slice(start, end));
  }
}
/** @type {(id: number) => string} */
const chunkIdToString = (id) => String.fromCharCode(id >>> 24, (id >>> 16) & 0xff, (id >>> 8) & 0xff, id & 0xff);
/** @type {(reader: SmfReader, magicNumber: number) => number} */
const readChunkEnd = (reader, magicNumber /* , expectedName: string */) => {
  const id = reader.readUInt32();
  const length = reader.readUInt32();
  if (id !== magicNumber) throw new Error(`Expected MIDI "${chunkIdToString(magicNumber)}" chunk, got "${chunkIdToString(id)}"`);
  const end = reader.pos + length;
  if (end > reader.data.length) throw new Error(`MIDI "${chunkIdToString(magicNumber)}" chunk exceeds the input length`);
  return end;
};
/** @type {(reader: SmfReader) => MidiHeader} */
const parseHeader = (reader /* , end: number */) => {
  const format = reader.readUInt16();
  if (format > 2) throw new Error(`Unsupported MIDI format: ${format}`);
  const numTracks = reader.readUInt16();
  const timeDivision = reader.readUInt16();
  const header = /** @type {MidiHeader} */ ({
    format: format,
    numTracks,
  });
  if (timeDivision & 0x8000) {
    header.framesPerSecond = 0x100 - (timeDivision >> 8);
    header.ticksPerFrame = timeDivision & 0xff;
  } else {
    header.ticksPerBeat = timeDivision;
  }
  return header;
};
/** @type {(reader: SmfReader, trackEnd: number, deltaTime: number, eventTypeByte: number) => MidiEvent} */
const readSystemEvent = (reader, trackEnd, deltaTime, eventTypeByte) => {
  if (eventTypeByte === 0xff) {
    /** read `ESMFEventType` */
    const type = reader.readUInt8();
    const length = reader.readVarInt();
    if (reader.pos + length > trackEnd) throw new Error("MIDI meta event exceeds its track chunk");
    switch (type) {
      case 0 /* ESMFEventType.sequenceNumber */:
        return { deltaTime, type, number: reader.readUInt16() };
      case 1 /* ESMFEventType.text */:
      case 2 /* ESMFEventType.copyrightNotice */:
      case 3 /* ESMFEventType.trackName */:
      case 4 /* ESMFEventType.instrumentName */:
      case 5 /* ESMFEventType.lyrics */:
      case 6 /* ESMFEventType.marker */:
      case 7 /* ESMFEventType.cuePoint */:
        return { deltaTime, type, text: reader.readString(length) };
      case 32 /* ESMFEventType.channelPrefix */:
        return { deltaTime, type, channel: reader.readUInt8() };
      case 33 /* ESMFEventType.portPrefix */:
        return { deltaTime, type, port: reader.readUInt8() };
      case 47 /* ESMFEventType.endOfTrack */:
        return { deltaTime, type };
      case 81 /* ESMFEventType.setTempo */:
        return { deltaTime, type, microsecondsPerBeat: reader.readUInt24() };
      case 84 /* ESMFEventType.smpteOffset */: {
        const hourByte = reader.readUInt8();
        return {
          deltaTime,
          type,
          frameRate: FRAME_RATES[(hourByte >> 5) & 0x03],
          hour: hourByte & 0x1f,
          min: reader.readUInt8(),
          sec: reader.readUInt8(),
          frame: reader.readUInt8(),
          subFrame: reader.readUInt8(),
        };
      }
      case 88 /* ESMFEventType.timeSignature */: {
        return {
          deltaTime,
          type,
          numerator: reader.readUInt8(),
          denominator: 1 << reader.readUInt8(),
          metronome: length === 4 ? reader.readUInt8() : 0x24,
          thirtyseconds: length === 4 ? reader.readUInt8() : 0x08,
        };
      }
      case 89 /* ESMFEventType.keySignature */:
        return { deltaTime, type, key: reader.readInt8(), scale: reader.readUInt8() };
      case 127 /* ESMFEventType.sequencerSpecific */:
        return { deltaTime, type, data: reader.readBytes(length) };
      default:
        return { deltaTime, type: -1 /* ESMFEventType.unknownMeta */, metatypeByte: type, data: reader.readBytes(length) };
    }
  }
  if (eventTypeByte === 240 /* ESMFEventType.sysEx */ || eventTypeByte === 247 /* ESMFEventType.endSysEx */) {
    const length = reader.readVarInt();
    return {
      deltaTime,
      type: eventTypeByte,
      data: reader.readBytes(length),
    };
  }
  throw new Error(`Unrecognized MIDI event type byte: ${eventTypeByte}`);
};
/** @type {(reader: SmfReader, trackEnd: number) => MidiEvent[]} */
const parseTrack = (reader, trackEnd) => {
  /** @type {MidiEvent[]} */
  const events = [];
  const data = reader.data;
  let lastEventTypeByte = null;
  while (reader.pos < trackEnd) {
    const deltaTime = reader.readVarInt();
    let eventTypeByte = data[reader.pos++];
    if ((eventTypeByte & 0xf0) === 0xf0) {
      events.push(readSystemEvent(reader, trackEnd, deltaTime, eventTypeByte));
      continue;
    }
    /** @type {number} */
    let eventValue;
    /** @type {number} */
    let running;
    if ((eventTypeByte & 0x80) === 0) {
      if (lastEventTypeByte === null) throw new Error("Running status encountered before a channel status byte");
      eventValue = eventTypeByte;
      eventTypeByte = lastEventTypeByte;
      running = 1;
    } else {
      eventValue = data[reader.pos++];
      lastEventTypeByte = eventTypeByte;
      running = 0;
    }
    const type = eventTypeByte >> 4;
    const channel = eventTypeByte & 0x0f;
    /** @type {MidiEvent} */
    let event;
    switch (type) {
      case 8 /* ESMFEventType.noteOff */:
        event = { deltaTime, type, channel, noteNumber: eventValue, velocity: data[reader.pos++] };
        break;
      case 9 /* ESMFEventType.noteOn */: {
        const velocity = data[reader.pos++];
        if (velocity === 0) event = { deltaTime, type: 8 /* ESMFEventType.noteOff */, channel, noteNumber: eventValue, velocity, byte9: true };
        else event = { deltaTime, type, channel, noteNumber: eventValue, velocity };
        break;
      }
      case 10 /* ESMFEventType.noteAftertouch */:
        event = { deltaTime, type, channel, noteNumber: eventValue, amount: data[reader.pos++] };
        break;
      case 11 /* ESMFEventType.controller */:
        event = { deltaTime, type, channel, controllerType: eventValue, value: data[reader.pos++] };
        break;
      case 12 /* ESMFEventType.programChange */:
        event = { deltaTime, type, channel, programNumber: eventValue };
        break;
      case 13 /* ESMFEventType.channelAftertouch */:
        event = { deltaTime, type, channel, amount: eventValue };
        break;
      case 14 /* ESMFEventType.pitchBend */:
        event = { deltaTime, type, channel, value: eventValue + (data[reader.pos++] << 7) - 0x2000 };
        break;
      default:
        throw new Error(`Unrecognized MIDI channel event type: ${type}`);
    }
    if (reader.pos > trackEnd) throw new Error("MIDI channel event exceeds its track chunk");
    if (running) event.running = true;
    events.push(event);
  }
  return events;
};
/**
 * Parse a Standard MIDI File into numeric {@link ESMFEventType} events.
 *
 * The Uint8Array fast path parses all chunks through a shared cursor and does
 * not copy complete track payloads. Other array-like inputs are normalized once.
 *
 * @param {ArrayLike<number> | ArrayBuffer} input
 * @returns {MidiData}
 */
export const parseMidi = (input) => {
  const data = input instanceof Uint8Array ? input : input instanceof ArrayBuffer ? new Uint8Array(input) : Uint8Array.from(input);
  const reader = new SmfReader(data);
  const headerEnd = readChunkEnd(reader, MTHD /* , "MThd" */);
  const header = parseHeader(reader /* , headerEnd */);
  reader.pos = headerEnd;
  /** @type {MidiEvent[][]} */
  const tracks = [];
  for (let i = 0, L = header.numTracks; i++ < L;) {
    const trackEnd = readChunkEnd(reader, MTRK /* , "MTrk" */);
    tracks.push(parseTrack(reader, trackEnd));
    reader.pos = trackEnd;
  }
  return { header, tracks };
};
