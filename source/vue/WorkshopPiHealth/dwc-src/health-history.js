// health-history.js -- joins the history kept by the service (operation health.history) with the live samples this browser
// collects (tested in test/health-history.test.js). Server points are {t: epoch ms, y}; so are the live ones.
'use strict'

export const RANGES = ['1h', '6h', '24h', '7d']

// the arguments of health.history for a range of range-picker.js ({ from, to } in epoch seconds; the service keeps 7 days by default)
export function historyArgs(range, limit) {
	return { since: range.from, until: range.to, limit: limit || 300 }
}

// the live samples of this browser (the last hour, every 5 s) only belong to a stretch that ends now
export function endsNow(value) {
	return !!value && value.type === 'relative'
}

// server: array or undefined (averaged points, oldest first); live: array (every 5 s, up to 1 h); stepMs: width of a server bucket.
// The result is one array, oldest first, without two points closer than a bucket and without going back in time.
export function mergeSeries(server, live, stepMs) {
	const hist = Array.isArray(server) ? server : []
	const now = Array.isArray(live) ? live : []
	if (!hist.length) return now
	const out = []
	const end = hist[hist.length - 1].t
	// the live samples replace the tail of the server history when they overlap it
	const overlap = now.length > 0 && now[0].t <= end
	const cut = overlap ? now[0].t : end
	hist.forEach(p => { if (overlap ? p.t < cut : true) out.push(p) })
	let last = out.length ? out[out.length - 1].t : -Infinity
	const gap = Math.max(0, stepMs || 0)
	now.forEach(p => {
		if ((overlap ? p.t >= cut : p.t > cut) && p.t - last >= gap) {
			out.push(p)
			last = p.t
		}
	})
	return out
}

// {cpu: [...], ...} for every live series; server may be null (old service: only the live samples, as before)
export function mergeAll(server, live, stepMs) {
	const out = {}
	Object.keys(live).forEach(k => {
		out[k] = server ? mergeSeries(server[k], live[k], stepMs) : live[k]
	})
	return out
}
