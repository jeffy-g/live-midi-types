/*!
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  Copyright (C) 2025 jeffy-g <hirotom1107@gmail.com>
//  Released under the MIT license
//  https://opensource.org/licenses/mit-license.php
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file live-midi-types/src/smf-event-type.ts
 */
export const ESMFEventType = {
  /**
   * ```
   * 0x00
   * ```
   */
  sequenceNumber: 0,
  text: 1,
  copyrightNotice: 2,
  trackName: 3,
  instrumentName: 4,
  lyrics: 5,
  marker: 6,
  cuePoint: 7,
  noteOff: 8,
  noteOn: 9,
  noteAftertouch: 10,
  /**
   * means control change event type.
   * ```
   * [0xb0 | event.channel][controllerType:0..127][value:0..127]
   * ```
   */
  controller: 11,
  /**
   * ```
   * [0xc0 | event.channel][programNumber:0..127]
   * ```
   * @see {@linkcode https://midiprog.com/program-numbers/ Program Change Numbers}
   */
  programChange: 12,
  /**
   * ```
   * [0xd0 | event.channel][0..127]
   * ```
   */
  channelAftertouch: 13,
  /**
   * ```
   * [0xe0 | event.channel][LSB:0..127][MSB:0..127]
   * ```
   */
  pitchBend: 14,
  /**
   * ```
   * 0x20
   * ```
   */
  channelPrefix: 0x20,
  portPrefix: 0x21,
  /**
   * ```
   * 0x2F
   * ```
   */
  endOfTrack: 0x2f,
  /**
   * ```
   * 0x51
   * ```
   */
  setTempo: 0x51,
  /**
   * ```
   * 0x54
   * ```
   */
  smpteOffset: 0x54,
  /**
   * ```
   * 0x58
   * ```
   */
  timeSignature: 0x58,
  keySignature: 0x59,
  /**
   * ```
   * 0x7F
   * ```
   */
  sequencerSpecific: 0x7f,
  /**
   * ```
   * 0xF0
   * ```
   */
  sysEx: 0xf0,
  /**
   * ```
   * 0xF7
   * ```
   */
  endSysEx: 0xf7,
  unknownMeta: -1,
};
