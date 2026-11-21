<template>
	<!-- System log (journal) of one unit: read-only, through the service (journal.read). Administrator only; the service decides, this card only
	     disables its controls and says why (lock-reason). Built to fit a 390 px screen: everything wraps, nothing has a minimum width. -->
	<v-card outlined class="pa-3 phj-card">
		<div class="phj-head">
			<span class="text-h6"><v-icon class="mr-1">mdi-text-box-search-outline</v-icon>{{ $t('plugins.WorkshopPiHealth.journal.title') }}<help-tip :title="ht('title')" :what="ht('what')" :why="ht('why')" :how="ht('how')" /></span>
			<div class="phj-actions">
				<v-switch v-model="follow" hide-details class="mt-0 pt-0 phj-switch" :disabled="!allowed" :label="$t('plugins.WorkshopPiHealth.journal.follow')" />
				<v-switch v-model="showNoise" hide-details class="mt-0 pt-0 phj-switch" :disabled="!allowed" :label="$t('plugins.WorkshopPiHealth.journal.noise')" @change="read" />
				<v-btn outlined :loading="loading" :disabled="!allowed" class="phj-btn" @click="read"><v-icon left>mdi-refresh</v-icon>{{ $t('plugins.WorkshopPiHealth.journal.refresh') }}</v-btn>
			</div>
		</div>

		<v-row dense class="mt-1">
			<v-col cols="12" sm="6" md="3"><v-select v-model="unit" :items="unitItems" :label="$t('plugins.WorkshopPiHealth.journal.unit')" outlined hide-details :disabled="!allowed" @change="read" /></v-col>
			<v-col cols="12" sm="6" md="2"><v-select v-model="since" :items="sinceItems" :label="$t('plugins.WorkshopPiHealth.journal.since')" outlined hide-details :disabled="!allowed" @change="read" /></v-col>
			<v-col cols="12" sm="6" md="2"><v-select v-model="level" :items="levelItems" :label="$t('plugins.WorkshopPiHealth.journal.level')" outlined hide-details :disabled="!allowed" @change="read" /></v-col>
			<v-col cols="12" sm="6" md="5"><v-text-field v-model="search" :label="$t('plugins.WorkshopPiHealth.journal.search')" outlined hide-details clearable maxlength="80" prepend-inner-icon="mdi-magnify" :disabled="!allowed" @keyup.enter="read" @click:clear="onClear" /></v-col>
		</v-row>

		<lock-reason :ops="OPS" min="admin" :subject="$t('plugins.WorkshopPiHealth.journal.title')" class="mt-2" />
		<error-notice :error="error" class="mt-2" />

		<div v-if="unreadable" class="text-caption warning--text mt-2 phj-wrap">
			<v-icon x-small color="warning">mdi-alert</v-icon> {{ $t('plugins.WorkshopPiHealth.journal.unreadable_' + unreadable) }}
			<code v-if="unreadable === 'no_permission'" class="phj-code">sudo usermod -aG systemd-journal dsf</code>
		</div>
		<template v-else-if="result">
			<div class="text-caption grey--text mt-2 phj-wrap">
				{{ $t('plugins.WorkshopPiHealth.journal.showing', { n: result.lines.length, unit: unitLabel(result.unit), at: readAt }) }}
				<span v-if="result.truncated"> {{ $t('plugins.WorkshopPiHealth.journal.truncated') }}</span>
				<span v-if="result.noise_hidden"> {{ $t('plugins.WorkshopPiHealth.journal.noise_hidden', { n: result.noise_hidden }) }}</span>
			</div>
			<div v-if="!result.lines.length" class="text-body-2 grey--text mt-2">{{ $t('plugins.WorkshopPiHealth.journal.empty') }}</div>
			<div v-else ref="box" class="phj-lines mt-1">
				<div v-for="(l, i) in result.lines" :key="i" class="phj-line" :class="levelClass(l)">
					<span class="phj-time">{{ stamp(l.t) }}</span>
					<span v-if="l.who && (result.unit === 'kernel' || l.who !== result.unit)" class="phj-who">{{ l.who }}</span>
					<span v-if="l.noise" class="phj-tag">{{ $t('plugins.WorkshopPiHealth.journal.noise_tag') }}</span>
					<span class="phj-text">{{ l.text }}</span>
				</div>
			</div>
		</template>
		<div v-else-if="allowed && !loading" class="text-body-2 grey--text mt-2">{{ $t('plugins.WorkshopPiHealth.journal.press_refresh') }}</div>
	</v-card>
</template>

<script>
'use strict'

import { api } from './workshop-api.js'
import { accessCanMixin } from './reason-mixin.js' // the answers of the service, by operation (vue/_shared36)
import { JOURNAL_OPS, groupAllowed } from './access-groups.js'
import HelpTip from './HelpTip.vue' // vue/_shared36
import LockReason from './LockReason.vue' // vue/_shared36
import ErrorNotice from './ErrorNotice.vue' // vue/_shared36

// the units and choices the service accepts (dsf/journal_view.py); the service refuses anything else
// the system journal units, then the workshop's own logs (the service log and the start-up runs): the service decides what is valid
const UNITS = ['duetcontrolserver', 'duetwebserver', 'duetpluginservice', 'workshop-gcode-bridge', 'NetworkManager', 'ssh', 'kernel', 'workshop-service', 'install']
const SINCE = ['15min', '1h', '6h', '24h', '7d']
const LEVELS = ['all', 'notice', 'warning', 'error']
const FOLLOW_MS = 10000
const LINES = 300

export default {
	name: 'JournalCard',
	mixins: [accessCanMixin],
	// what the previous person read stays in no data of the page: it is cleared when the session changes (role-mixin.js)
	sessionData: ['result', 'error', 'unreadable'],
	sessionErrors: ['error'],
	components: { HelpTip, LockReason, ErrorNotice },
	data() {
		return { OPS: JOURNAL_OPS, unit: 'duetcontrolserver', since: '1h', level: 'all', search: '', follow: false, showNoise: false, loading: false, result: null, error: null, unreadable: '', timer: null }
	},
	computed: {
		allowed() {
			return groupAllowed(JOURNAL_OPS, op => this.canDo(op))
		},
		unitItems() {
			return UNITS.map(u => ({ text: this.unitLabel(u), value: u }))
		},
		sinceItems() {
			return SINCE.map(s => ({ text: this.$t('plugins.WorkshopPiHealth.journal.since_' + s), value: s }))
		},
		levelItems() {
			return LEVELS.map(l => ({ text: this.$t('plugins.WorkshopPiHealth.journal.level_' + l), value: l }))
		},
		readAt() {
			return this.result && this.result.read_at ? new Date(this.result.read_at).toLocaleTimeString() : ''
		}
	},
	watch: {
		follow(on) {
			this.stopTimer()
			if (on) {
				this.read()
				this.timer = setInterval(() => { if (!document.hidden) this.read() }, FOLLOW_MS)
			}
		}
	},
	created() {
		this.wantCan(JOURNAL_OPS)
	},
	beforeDestroy() {
		this.stopTimer()
	},
	methods: {
		ht(k) {
			return this.$t('plugins.WorkshopPiHealth.journal.help_' + k)
		},
		unitLabel(u) {
			const key = 'plugins.WorkshopPiHealth.journal.source_' + u.replace(/-/g, '_')
			return this.$te(key) ? this.$t(key) : u
		},
		stopTimer() {
			if (this.timer) clearInterval(this.timer)
			this.timer = null
		},
		onClear() {
			this.search = ''
			this.read()
		},
		// a new session (signed in, out, other role): what was shown is gone and following stops
		onSessionChange() {
			this.follow = false
			this.result = null
		},
		async read() {
			if (!this.allowed || this.loading) return
			this.loading = true
			try {
				const r = await api('journal.read', { unit: this.unit, since: this.since, level: this.level, search: this.search || '', lines: LINES, noise: this.showNoise ? 'show' : 'hide' })
				this.error = null
				if (r && r.readable) {
					this.unreadable = ''
					this.result = r
					this.$nextTick(() => { const b = this.$refs.box; if (b) b.scrollTop = b.scrollHeight })
				} else {
					this.result = null
					this.unreadable = (r && r.reason) || 'failed'
				}
			} catch (e) {
				this.unreadable = ''
				this.error = e
				this.follow = false
			} finally {
				this.loading = false
			}
		},
		// a known harmless line is dimmed, never red; the rest by its priority (3 and worse red, 4 orange)
		levelClass(l) {
			if (l.noise) return 'phj-noise'
			return l.p <= 3 ? 'error--text' : (l.p === 4 ? 'warning--text' : '')
		},
		// the date only when the window is longer than a day
		stamp(t) {
			const d = new Date(t)
			return (this.since === '24h' || this.since === '7d') ? d.toLocaleString() : d.toLocaleTimeString()
		}
	}
}
</script>

<style>
/* phj-* are this card's own classes (the wf-* names belong to the family). The card never pushes the page wider (390 px): everything shrinks or wraps. Colors are the family's tokens; nothing is smaller than 12 px. */
.phj-card { min-width: 0; max-width: 100%; overflow: hidden; }
.phj-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; min-width: 0; }
.phj-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; min-width: 0; margin-left: auto; }
.phj-card .v-input, .phj-card .v-select__selections { min-width: 0; max-width: 100%; }
.phj-switch { min-height: 44px; flex: 0 1 auto; }
.phj-btn { min-height: 44px; max-width: 100%; }
.phj-wrap { overflow-wrap: anywhere; }
.phj-code { white-space: normal; overflow-wrap: anywhere; }
.phj-lines {
	max-height: 380px;
	max-width: 100%;
	overflow: auto;
	border: 1px solid var(--wf-line);
	border-radius: 4px;
	padding: 6px 8px;
	font-family: Consolas, 'Liberation Mono', monospace;
	font-size: 12px;
	line-height: 1.45;
}
.phj-line { white-space: pre-wrap; overflow-wrap: anywhere; }
.phj-time { opacity: 0.6; margin-right: 8px; white-space: nowrap; }
.phj-who { opacity: 0.8; margin-right: 8px; }
.phj-noise { opacity: 0.55; }
.phj-tag { border: 1px solid var(--wf-line); border-radius: 4px; padding: 0 4px; margin-right: 8px; font-size: 12px; white-space: nowrap; }
</style>
