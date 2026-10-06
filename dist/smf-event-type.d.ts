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
export declare const ESMFEventType: {
  /**
   * ```
   * 0x00
   * ```
   */
  readonly sequenceNumber: 0;
  readonly text: 1;
  readonly copyrightNotice: 2;
  readonly trackName: 3;
  readonly instrumentName: 4;
  readonly lyrics: 5;
  readonly marker: 6;
  readonly cuePoint: 7;
  readonly noteOff: 8;
  readonly noteOn: 9;
  readonly noteAftertouch: 10;
  /**
   * means control change event type.
   * ```
   * [0xb0 | event.channel][controllerType:0..127][value:0..127]
   * ```
   */
  readonly controller: 11;
  /**
   * ```
   * [0xc0 | event.channel][programNumber:0..127]
   * ```
   * @see {@linkcode https://midiprog.com/program-numbers/ Program Change Numbers}
   */
  readonly programChange: 12;
  /**
   * ```
   * [0xd0 | event.channel][0..127]
   * ```
   */
  readonly channelAftertouch: 13;
  /**
   * ```
   * [0xe0 | event.channel][LSB:0..127][MSB:0..127]
   * ```
   */
  readonly pitchBend: 14;
  /**
   * ```
   * 0x20
   * ```
   */
  readonly channelPrefix: 32;
  readonly portPrefix: 33;
  /**
   * ```
   * 0x2F
   * ```
   */
  readonly endOfTrack: 47;
  /**
   * ```
   * 0x51
   * ```
   */
  readonly setTempo: 81;
  /**
   * ```
   * 0x54
   * ```
   */
  readonly smpteOffset: 84;
  /**
   * ```
   * 0x58
   * ```
   */
  readonly timeSignature: 88;
  readonly keySignature: 89;
  /**
   * ```
   * 0x7F
   * ```
   */
  readonly sequencerSpecific: 127;
  /**
   * ```
   * 0xF0
   * ```
   */
  readonly sysEx: 240;
  /**
   * ```
   * 0xF7
   * ```
   */
  readonly endSysEx: 247;
  readonly unknownMeta: -1;
};
