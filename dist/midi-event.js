/*!
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  Copyright (C) 2025 jeffy-g <hirotom1107@gmail.com>
//  Released under the MIT license
//  https://opensource.org/licenses/mit-license.php
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
/**
 * @file src/midi-event.ts
 * @summary Common MIDI event types for Ableton Live and related tools.
 */
/**
 * @import { TEventMap } from "./midi-event.d";
 */
/**
 * Type guard to check if a value is an object.
 * @param {unknown} value Value to check.
 * @returns {value is Record<string, unknown>} True if the value is an object.
 */
const isObject = (value) => typeof value === "object" && value !== null;
/**
 * Type guard to check if the events array contains a specific type of MIDI event.
 * @template {keyof TEventMap} K
 * @param {unknown[]} events Array of events to check.
 * @param {K} type Type of event to check against.
 * @returns {events is TEventMap[K]} True if the events match the specified type.
 */
export const eventsIs = (events, type) => {
  const e = events?.[0];
  if (!isObject(e)) return false;
  switch (type) {
    case "note":
      return typeof e.pitch === "number" && typeof e.velocity === "number";
    case "cc":
      return typeof e.controller === "number" && typeof e.value === "number";
    default:
      return typeof e.bpm === "number";
  }
};
