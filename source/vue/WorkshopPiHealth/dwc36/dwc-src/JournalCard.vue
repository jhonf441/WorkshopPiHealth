<template>
	<!-- System log (journal) of one unit: read-only, through the service (journal.read). Administrator only; the service decides, this card only
	     disables its controls and says why (lock-reason). -->
	<v-card outlined class="pa-3">
		<div class="d-flex align-center flex-wrap">
			<span class="text-h6 mr-2"><v-icon class="mr-1">mdi-text-box-search-outline</v-icon>{{ $t('plugins.WorkshopPiHealth.journal.title') }}<help-tip :title="ht('title')" :what="ht('what')" :why="ht('why')" :how="ht('how')" /></span>
			<v-spacer />
			<v-switch v-model="follow" hide-details class="mt-0 mr-3 journal-follow" :disabled="!allowed" :label="$t('plugins.WorkshopPiHealth.journal.follow')" />
			<v-btn outlined :loading="loading" :disabled="!allowed" class="journal-btn" @click="read"><v-icon left>mdi-refresh</v-icon>{{ $t('plugins.WorkshopPiHealth.journal.refresh') }}</v-btn>
		</div>

		<v-row dense class="mt-1">
			<v-col cols="12" sm="6" md="3"><v-select v-model="unit" :items="unitItems" :label="$t('plugins.WorkshopPiHealth.journal.unit')" outlined hide-details :disabled="!allowed" @change="read" /></v-col>
			<v-col cols="6" md="2"><v-select v-model="since" :items="sinceItems" :label="$t('plugins.WorkshopPiHealth.journal.since')" outlined hide-details :disabled="!allowed" @change="read" /></v-col>
			<v-col cols="6" md="2"><v-select v-model="level" :items="levelItems" :label="$t('plugins.WorkshopPiHealth.journal.level')" outlined hide-details :disabled="!allowed" @change="read" /></v-col>
			<v-col cols="12" md="5"><v-text-field v-model="search" :label="$t('plugins.WorkshopPiHealth.journal.search')" outlined hide-details clearable maxlength="80" prepend-inner-icon="mdi-magnify" :disabled="!allowed" @keyup.enter="read" @click:clear="onClear" /></v-col>
		</v-row>

		<lock-reason :ops="OPS" min="admin" :subject="$t('plugins.WorkshopPiHealth.journal.title')" class="mt-2" />
		<error-notice :error="error" class="mt-2" />

		<div v-if="unreadable" class="text-caption warning--text mt-2">
			<v-icon x-small color="warning">mdi-alert</v-icon> {{ $t('plugins.WorkshopPiHealth.journal.unreadable_' + unreadable) }}
			<code v-if="unreadable === 'no_permission'">sudo usermod -aG systemd-journal dsf</code>
		</div>
		<template v-else-if="result">
			<div class="text-caption grey--text mt-2">
				{{ $t('plugins.WorkshopPiHealth.journal.showing', { n: result.lines.length, unit: unitLabel(result.unit), at: readAt }) }}
				<span v-if="result.truncated"> {{ $t('plugins.WorkshopPiHealth.journal.truncated') }}</span>
			</div>
			<div v-if="!result.lines.length" class="text-body-2 grey--text mt-2">{{ $t('plugins.WorkshopPiHealth.journal.empty') }}</div>
			<div v-else ref="box" class="journal-lines mt-1">
				<div v-for="(l, i) in result.lines" :key="i" class="journal-line" :class="levelClass(l.p)">
					<span class="journal-time">{{ stamp(l.t) }}</span>
					<span v-if="l.who && (result.unit === 'kernel' || l.who !== result.unit)" class="journal-who">{{ l.who }}</span>
					<span class="journal-text">{{ l.text }}</span>
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
const UNITS = ['duetcontrolserver', 'duetwebserver', 'duetpluginservice', 'workshop-gcode-bridge', 'NetworkManager', 'ssh', 'kernel']
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
		return { OPS: JOURNAL_OPS, unit: 'duetcontrolserver', since: '1h', level: 'all', search: '', follow: false, loading: false, result: null, error: null, unreadable: '', timer: null }
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
			return u === 'kernel' ? this.$t('plugins.WorkshopPiHealth.journal.kernel') : u
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
				const r = await api('journal.read', { unit: this.unit, since: this.since, level: this.level, search: this.search || '', lines: LINES })
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
		levelClass(p) {
			return p <= 3 ? 'error--text' : (p === 4 ? 'warning--text' : (p >= 6 ? 'journal-quiet' : ''))
		},
		// the date only when the window is longer than a day
		stamp(t) {
			const d = new Date(t)
			return (this.since === '24h' || this.since === '7d') ? d.toLocaleString() : d.toLocaleTimeString()
		}
	}
}
</script>

<style scoped>
.journal-lines {
	max-height: 380px;
	overflow: auto;
	background: rgba(128, 128, 128, 0.08);
	border-radius: 4px;
	padding: 6px 8px;
	font-family: Consolas, 'Liberation Mono', monospace;
	font-size: 12px;
	line-height: 1.45;
}
/* what is touched is at least 44 px (decision of 2026-11-21: always, not only on touch screens) */
.journal-btn { min-height: 44px; }
.journal-follow { min-height: 44px; }
.journal-line { white-space: pre-wrap; word-break: break-word; }
.journal-time { opacity: 0.6; margin-right: 8px; white-space: nowrap; }
.journal-who { opacity: 0.8; margin-right: 8px; }
.journal-quiet .journal-text { opacity: 0.9; }
</style>
