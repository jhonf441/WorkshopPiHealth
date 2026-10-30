'use strict'

// WorkshopPiHealth -- "Pi health" page (2026-10-09). It only READS the object
// model that DSF already publishes (machine.model.sbc and machine.model.volumes): it does
// not need a backend nor make extra requests to the Pi.

import './i18n-register.js'
import { registerRoute } from 'DuetWebControl'
import { ensureMenuCategory, onPluginUnload, removePluginRoute } from './dwc-host.js'
import './language-reload.js' // the page loads again when the DWC language changes (vue/_shared)
import './safe-saving.js' // power cut: save with a backup and in one step (vue/_shared)
import { startSampling, stopSampling } from './health-samples.js'

import health from './Health.vue'
import './theme.css'

// The three monitoring pages (Activity, Power, Pi health) share one menu group, "Monitor" (F3-V, 2026-10-21). The first one that
// loads creates it, the others find it; the addresses of the pages did not change. The group name is a text of the shared catalog.
ensureMenuCategory('Monitor', 'mdi-monitor-dashboard', 'plugins.WorkshopPiHealth.shared.monitor_group')
registerRoute(health, {
	Monitor: {
		WorkshopPiHealth: {
			icon: 'mdi-heart-pulse',
			caption: 'plugins.WorkshopPiHealth.common.menu_caption',
			path: '/Plugins/PiHealth'
		}
	}
})

// the live samples are collected from now on, even while the page is closed
startSampling()

// DWC 3.7 does not undo anything when the plugin is stopped: take the page out and stop what runs by itself, so that a
// later start registers the new component and a single recorder (review #4)
onPluginUnload('WorkshopPiHealth', () => {
	removePluginRoute('/Plugins/PiHealth', 'Monitor')
	stopSampling()
})
