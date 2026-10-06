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
/**
 * @param {Record<string, ControlChangeEvent[]>} ccEventMap
 * @param {number[]} knownCCEvents
 */
const getFlattenSize = (ccEventMap, knownCCEvents) => {
  var total = 0;
  for (var idx in knownCCEvents) {
    total += ccEventMap[knownCCEvents[idx]].length;
  }
  return total;
};
/**
 * @param {Record<string, ControlChangeEvent[]>} ccEventMap
 * @param {number[]} knownCCEvents
 */
export const flattenCCEventMap = (ccEventMap, knownCCEvents) => {
  var afterFlattenSize = getFlattenSize(ccEventMap, knownCCEvents);
  /** @type {ControlChangeEvent[]} */
  var ccBuffer = Array(afterFlattenSize).fill(undefined);
  var bufferIndex = 0;
  for (let idx = 0, ccEventsLen = knownCCEvents.length; idx < ccEventsLen;) {
    let ccEvents = ccEventMap[knownCCEvents[idx++]];
    for (let eventIndex = 0, ccEventsLen = ccEvents.length; eventIndex < ccEventsLen;) {
      ccBuffer[bufferIndex++] = ccEvents[eventIndex++];
    }
  }
  if (bufferIndex !== afterFlattenSize) {
    ccBuffer.length = bufferIndex;
    console.warn(`⚠️  flattenCCEventMap: afterFlattenSize=${afterFlattenSize} lastSize=${bufferIndex}`);
  }
  return ccBuffer.sort((a, b) => a.time - b.time);
};
/**
 * @import { ControlChangeEvent } from "./midi-event.ts";
 */
