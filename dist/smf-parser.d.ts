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
import type { MidiData } from "./midi10-smf-types.ts";
/**
 * Parse a Standard MIDI File into numeric {@link ESMFEventType} events.
 *
 * The Uint8Array fast path parses all chunks through a shared cursor and does
 * not copy complete track payloads. Other array-like inputs are normalized once.
 *
 * @param {ArrayLike<number> | ArrayBuffer} input
 * @returns {MidiData}
 */
export declare const parseMidi: (input: ArrayLike<number> | ArrayBuffer) => MidiData;
