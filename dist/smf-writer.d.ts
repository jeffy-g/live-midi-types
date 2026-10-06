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
import type { MidiData, MidiWriteOption } from "./midi10-smf-types.ts";
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
export declare function getVarIntSize(value: number): number;
/**
 * Writes MIDI data to a Uint8Array.
 * @param {MidiData} data The MIDI data to write.
 * @param {MidiWriteOption=} opts Options for writing the MIDI file.
 * @returns A Uint8Array containing the MIDI file data.
 */
export declare function writeMidi(data: MidiData, opts?: MidiWriteOption): Uint8Array;
