/*!
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  Copyright (C) 2026 jeffy-g <hirotom1107@gmail.com>
//  Released under the MIT license
//  https://opensource.org/licenses/mit-license.php
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file live-midi-types/src/ESMFEventType.ts
 */
export declare const enum ESMFEventType {
  /**
   * ```
   * 0x00
   * ```
   */
  sequenceNumber = 0,
  text = 1, // 1
  copyrightNotice = 2, // 2
  trackName = 3, // 3
  instrumentName = 4, // 4
  lyrics = 5, // 5
  marker = 6, // 6
  cuePoint = 7, // 7
  noteOff = 8, // 8
  noteOn = 9, // velocity === 0 ? 'noteOff' : 'noteOn'
  noteAftertouch = 10, // 10
  /**
   * means control change event type.
   * ```
   * [0xb0 | event.channel][controllerType:0..127][value:0..127]
   * ```
   */
  controller = 11, // 11
  /**
   * ```
   * [0xc0 | event.channel][programNumber:0..127]
   * ```
   * @see {@linkcode https://midiprog.com/program-numbers/ Program Change Numbers}
   */
  programChange = 12, // 12
  /**
   * ```
   * [0xd0 | event.channel][0..127]
   * ```
   */
  channelAftertouch = 13, // 13
  /**
   * ```
   * [0xe0 | event.channel][LSB:0..127][MSB:0..127]
   * ```
   */
  pitchBend = 14, // 14
  /**
   * ```
   * 0x20
   * ```
   */
  channelPrefix = 32, //
  portPrefix = 33, // 33
  /**
   * ```
   * 0x2F
   * ```
   */
  endOfTrack = 47, // 47
  /**
   * ```
   * 0x51
   * ```
   */
  setTempo = 81, // 81
  /**
   * ```
   * 0x54
   * ```
   */
  smpteOffset = 84, // 84
  /**
   * ```
   * 0x58
   * ```
   */
  timeSignature = 88, // 88
  keySignature = 89, //
  /**
   * ```
   * 0x7F
   * ```
   */
  sequencerSpecific = 127, //127
  /**
   * ```
   * 0xF0
   * ```
   */
  sysEx = 240, // 240 eventTypeByte
  /**
   * ```
   * 0xF7
   * ```
   */
  endSysEx = 247, // 247 eventTypeByte
  unknownMeta = -1,
}
