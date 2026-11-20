'use strict'

// The operations each group of sensitive buttons of the PiHealth page asks of the service (auth.can), so ONE sentence under the group says why it is
// locked (reason-mixin.js, access-reason.js). Pure: no imports. The names are the ones of dsf/permissions.json; a test compares both and the API contract.
//
//   ALERT_OPS    the switches of the health alerts of the phone
//   READ_OPS     the history of the charts: no group of buttons, asked once so the page opens with one call (its refusal keeps the sentence by cause)
//   SCREEN_OPS   everything the page asks when it opens, in one call
//
// The page never calls the process, service or database operations (those are the page of the service), so nothing else is asked.

export const ALERT_OPS = Object.freeze(['notifications.type'])
export const READ_OPS = Object.freeze(['health.history'])

// the groups that carry a sentence, by name: the structure test walks this list
export const GROUPS = Object.freeze({ alerts: ALERT_OPS })

export const SCREEN_OPS = Object.freeze([].concat(ALERT_OPS, READ_OPS))

// every operation of the group is allowed by `can` (a function op -> boolean)
export function groupAllowed(ops, can) {
	return ops.every(op => can(op))
}
