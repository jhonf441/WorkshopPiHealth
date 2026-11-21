<template>
	<!-- CPU and memory of the Duet servers and of the workshop service, published by the service (healthPi.processes). Nothing to press: it is a reading. -->
	<v-card outlined class="pa-3">
		<div class="d-flex align-center flex-wrap">
			<span class="text-h6"><v-icon class="mr-1">mdi-chart-box-outline</v-icon>{{ $t('plugins.WorkshopPiHealth.processes.title') }}<help-tip :title="ht('title')" :what="ht('what')" :why="ht('why')" :how="ht('how')" /></span>
		</div>
		<v-simple-table class="mt-2">
			<thead>
				<tr>
					<th class="text-left">{{ $t('plugins.WorkshopPiHealth.processes.program') }}</th>
					<th class="text-right">{{ $t('plugins.WorkshopPiHealth.processes.cpu') }}</th>
					<th class="text-right">{{ $t('plugins.WorkshopPiHealth.processes.memory') }}</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="r in rows" :key="r.id">
					<td>{{ name(r.id) }}</td>
					<template v-if="r.error">
						<td colspan="2" class="text-right grey--text text-caption">{{ $t('plugins.WorkshopPiHealth.processes.error_' + r.error) }}</td>
					</template>
					<template v-else>
						<td class="text-right" :class="hot(r) ? 'warning--text' : ''">{{ r.cpu_pct == null ? '--' : r.cpu_pct + ' %' }}</td>
						<td class="text-right">{{ r.rss_mb == null ? '--' : r.rss_mb + ' MB' }}</td>
					</template>
				</tr>
			</tbody>
		</v-simple-table>
		<div class="text-caption grey--text mt-1">{{ $t('plugins.WorkshopPiHealth.processes.note') }}</div>
	</v-card>
</template>

<script>
'use strict'

import HelpTip from './HelpTip.vue' // vue/_shared36

// a program using more than one full core is worth a look: the Pi has four
const HOT_CPU_PCT = 100

export default {
	name: 'ProcessesCard',
	components: { HelpTip },
	props: { rows: { type: Array, default: () => [] } },
	methods: {
		ht(k) {
			return this.$t('plugins.WorkshopPiHealth.processes.help_' + k)
		},
		name(id) {
			const key = 'plugins.WorkshopPiHealth.processes.name_' + id
			return this.$te(key) ? this.$t(key) : id
		},
		hot(r) {
			return r.cpu_pct != null && r.cpu_pct >= HOT_CPU_PCT
		}
	}
}
</script>
