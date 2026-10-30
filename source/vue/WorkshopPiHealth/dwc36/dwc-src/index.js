'use strict'

// WorkshopPiHealth -- "Pi health" page (2026-10-09). It only READS the object
// model that DSF already publishes (machine.model.sbc and machine.model.volumes): it does
// not need a backend nor make extra requests to the Pi.

import './i18n-register.js'
import { registerCategory, registerRoute } from '../../routes'
import './safe-saving.js' // power cut: save with a backup and in one step (vue/_shared)

import health from './Health.vue'
import './theme.css'

// The three monitoring pages (Activity, Power, Pi health) share one menu group, "Monitor" (F3-V, 2026-10-21). The first one that
// loads creates it, the others find it; the addresses of the pages did not change. The group name is a text of the shared catalog.
registerCategory('Monitor', 'mdi-monitor-dashboard', 'plugins.WorkshopPiHealth.shared.monitor_group').then(() => registerRoute(health, {
	Monitor: {
		WorkshopPiHealth: {
			icon: 'mdi-heart-pulse',
			caption: 'plugins.WorkshopPiHealth.common.menu_caption',
			path: '/Plugins/PiHealth'
		}
	}
}));

// a bookmark or a link to the old Spanish address keeps working
