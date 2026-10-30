'use strict';

// Rows of the start-up card of Pi health (vue/_shared/StartupPanel.vue). Pure function (no imports): tests/startup-plugins.test.js
// loads it in node. The labels are keys of plugins.WorkshopPiHealth.startup.*.
//
// What the page can read depends on the board: a Duet alone (no SBC) has no Pi to watch; a single-board computer that
// is not a Raspberry Pi has no vcgencmd; a Pi on a cable has no WiFi. All of those are grey ("does not apply"), never red.
//
// c = { sbc: bool,                    machine.model.sbc exists (Duet in SBC mode)
//       datos: bool,                  the service published healthPi
//       esperaVencida: bool,          the page has been open long enough for healthPi to be there by now
//       vcgencmd: bool,               healthPi.throttled came (the Pi firmware tool answered)
//       wifi: bool, routerMs: number | null | undefined,   healthPi.wifi.connected and healthPi.red.router_ms
//       servicios: [{ activo }] | null }                    services the poller watches
export function rowsHealth(c) {
	const sbc = !!(c && c.sbc);
	const data = sbc && !!c.data;
	const out = [
		{ id: 'sbc', state: sbc ? 'configured' : 'na', label: 'row_sbc', what: 'row_sbc_what', why: 'row_sbc_for', ifMissing: 'row_sbc_missing', help: 'row_sbc_tip', texts: { configured: 'sbc_ok', na: 'sbc_none' } }
	];
	if (sbc && (data || c.waitExpired)) {
		out.push({ id: 'data', state: data ? 'configured' : 'missing', label: 'row_data', what: 'row_data_what', why: 'row_data_for', ifMissing: 'row_data_missing', help: 'row_data_tip', texts: { configured: 'data_ok', missing: 'data_none' } });
	}
	out.push(
		// vcgencmd: voltage and throttling of the Pi
		{ id: 'vcgencmd', applies: data, state: c && c.vcgencmd ? 'configured' : 'na', label: 'row_vcgencmd', what: 'row_vcgencmd_what', why: 'row_vcgencmd_for', ifMissing: 'row_vcgencmd_missing', help: 'row_vcgencmd_tip', texts: { configured: 'vcgencmd_ok', na: 'vcgencmd_none' } },
		// network: WiFi connected and the router answers; on a cable there is no WiFi to judge
		{
			id: 'network',
			applies: data,
			state: !(c && c.wifi) ? 'na' : c.routerMs === null ? 'example' : 'configured',
			label: 'row_network', what: 'row_network_what', why: 'row_network_for', ifMissing: 'row_network_missing',
			help: 'row_network_tip',
			texts: { configured: 'network_ok', example: 'network_router', na: 'network_none' }
		}
	);
	// Only the live-job bridge: Duet's own services (DCS, DWS, DPS) cannot be stopped from here and the page would not even open without
	// them, and the services table of this page already lists every one. The bridge is optional: absent (not installed) = does not apply.
	const serv = (c && c.services) || [];
	const bridge = serv.find(s => s && s.unit === 'workshop-gcode-bridge');
	out.push({
		id: 'services',
		applies: data && !!bridge,
		state: bridge && !bridge.active ? 'missing' : 'configured',
		label: 'row_services', what: 'row_services_what', why: 'row_services_for', ifMissing: 'row_services_missing',
		help: 'row_services_tip',
		texts: { configured: 'services_ok', missing: 'services_down', na: 'state_na' }
	});
	return out;
}
