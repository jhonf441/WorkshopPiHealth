'use strict'

// Live samples of the Pi (CPU, temperature, RAM, SD, WiFi) kept OUTSIDE the page component: the history starts when index.js
// calls startSampling() (DWC loads the plugin), keeps collecting even if the page is closed and is saved in sessionStorage,
// so it is not erased on changing page nor on reloading. Same pattern as Motors.
// 3.7: module-level state is a reactive() object (3.6: Vue.observable) and the model comes from dwc-host.js.

import { reactive } from 'vue'
import { machineModel, modelPlugins } from './dwc-host.js'
import { pluginOf, dataOf } from './workshop-ids.js'

// Thresholds [alert, limit]. Temperature: the Pi 4 lowers the CPU
// speed (throttling) from ~80 C; 70 C is already a reason to look at the ventilation.
export const THRESHOLD = { cpu: [80, 95], temp: [70, 80], ram: [80, 90], disk: [80, 90] }

export const SAMPLE_MS = 5000
export const HISTORY_LEN = 720 // 1 h at one sample every 5 s
const H_KEY = 'workshopHealthHist'
const SERIES = ['cpu', 'temp', 'ram', 'disk', 'wifi']

export const H = reactive({ cpu: [], temp: [], ram: [], disk: [], wifi: [] })

function healthPi() {
	return dataOf(pluginOf(modelPlugins(), 'service'), 'healthPi') || null
}

// percentage of the root volume in use, or null
export function rootDiskPct(m) {
	const v = (m.volumes || []).find(x => x && x.path === '/')
	if (!v || !v.capacity) {
		return null
	}
	return (v.capacity - v.freeSpace) / v.capacity * 100
}

function pushH(arr, y, t) {
	if (y == null || !isFinite(y)) {
		return
	}
	arr.push({ t: t, y: Math.round(y * 10) / 10 })
	if (arr.length > HISTORY_LEN) {
		arr.splice(0, arr.length - HISTORY_LEN)
	}
}

export function sample() {
	const m = machineModel()
	const sbc = m && m.sbc
	if (!sbc) {
		return
	}
	const t = Date.now()
	pushH(H.cpu, sbc.cpu && sbc.cpu.avgLoad, t)
	pushH(H.temp, sbc.cpu && sbc.cpu.temperature, t)
	if (sbc.memory && sbc.memory.total) {
		pushH(H.ram, (sbc.memory.total - sbc.memory.available) / sbc.memory.total * 100, t)
	}
	pushH(H.disk, rootDiskPct(m), t)
	const sp = healthPi()
	if (sp && sp.wifi) {
		pushH(H.wifi, sp.wifi.connected ? sp.wifi.signal_pct : 0, t)
	}
}

function restore() {
	try {
		const s = JSON.parse(sessionStorage.getItem(H_KEY) || 'null')
		if (!s) {
			return
		}
		const min = Date.now() - HISTORY_LEN * SAMPLE_MS
		SERIES.forEach(k => {
			(Array.isArray(s[k]) ? s[k] : []).forEach(p => {
				if (p && p.t >= min) {
					H[k].push(p)
				}
			})
		})
	} catch (e) {
		// without sessionStorage / corrupt data: it starts empty
	}
}

function save() {
	try {
		sessionStorage.setItem(H_KEY, JSON.stringify(H))
	} catch (e) {
		// not critical
	}
}

let started = false
let timers = []
export function startSampling() {
	if (started) {
		return
	}
	started = true
	restore()
	timers = [setInterval(sample, SAMPLE_MS), setInterval(save, 30000)]
	window.addEventListener('beforeunload', save)
}

// the plugin was stopped (index.js, dwcPluginUnloaded): saves once and stops the sampler, so a later start has only one
export function stopSampling() {
	if (!started) {
		return
	}
	save()
	started = false
	timers.forEach(clearInterval)
	timers = []
	window.removeEventListener('beforeunload', save)
}
