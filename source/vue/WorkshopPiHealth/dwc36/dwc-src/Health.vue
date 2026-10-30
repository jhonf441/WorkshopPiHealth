<template>
	<v-container fluid class="pa-0 workshop-theme">
		<service-notice />
		<page-header :lead="$t('plugins.WorkshopPiHealth.common.lead')" icon="mdi-heart-pulse" :title="$t('plugins.WorkshopPiHealth.common.system_health')" :reasons="headerReasons" :loading="!sbc">
			<v-chip v-if="sbc" small outlined>{{ sbc.model || 'SBC' }}</v-chip>
			<template v-slot:startup><startup-panel plugin="WorkshopPiHealth" :defs="rowsStartup" /></template>
		</page-header>
		<v-card class="mb-3">
			<v-card-text v-if="!sbc" class="grey--text">
				{{ $t('plugins.WorkshopPiHealth.health.waiting_for_dsf_data_machine_model') }}
			</v-card-text>
			<v-card-text v-else class="pb-2">
				<span class="mr-4">{{ $t('plugins.WorkshopPiHealth.health.on_for') }} <b>{{ fmtUptime(sbc.uptime) }}</b></span>
				<span class="mr-4 grey--text">{{ sbc.distribution }}</span>
				<span class="grey--text">DSF {{ sbc.dsf && sbc.dsf.version }}</span>
				<div class="text-caption grey--text mt-1">
					{{ $t('plugins.WorkshopPiHealth.health.data_dsf_already_publishes_adds_no') }}
				</div>
				<div v-if="!serverHist" class="text-caption grey--text">
					{{ $t('plugins.WorkshopPiHealth.health.history_this_browser') }}
				</div>
				<div v-else class="d-flex align-center flex-wrap mt-2" style="gap:8px">
					<span class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.history_range') }}</span>
					<v-btn-toggle v-model="range" mandatory dense>
						<v-btn v-for="r in RANGES" :key="r" small :value="r">{{ r }}</v-btn>
					</v-btn-toggle>
					<span class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.history_kept_by_service', { days: serverHist.retention_days }) }}</span>
				</div>
			</v-card-text>
		</v-card>

		<v-row v-if="sbc" dense>
			<!-- CPU -->
			<v-col cols="12" md="6">
				<v-card outlined class="pa-3" :style="edge(levelCpu)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-h6"><v-icon class="mr-1">mdi-cpu-64-bit</v-icon>CPU</span>
						<v-chip small :color="color(levelCpu)" dark>{{ label(levelCpu) }}</v-chip>
					</div>
					<div class="text-h4 my-1">{{ fmt1(cpuPct) }} %</div>
					<v-progress-linear :value="cpuPct" :color="color(levelCpu)" height="8" rounded class="mb-1" />
					<div class="text-caption grey--text mb-2">
						{{ $t('plugins.WorkshopPiHealth.health.cpu_hint', { cores: sbc.cpu && sbc.cpu.numCores, alert: THRESHOLD.cpu[0], limit: THRESHOLD.cpu[1] }) }}
					</div>
					<detail-chart :history="S.cpu" color="#42A5F5" unit="%" label="CPU" :limit="THRESHOLD.cpu[1]" :limit-label="$t('plugins.WorkshopPiHealth.health.limit_lower')" :height="150" />
				</v-card>
			</v-col>

			<!-- Temperatura -->
			<v-col cols="12" md="6">
				<v-card outlined class="pa-3" :style="edge(levelTemp)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-h6"><v-icon class="mr-1">mdi-thermometer</v-icon>{{ $t('plugins.WorkshopPiHealth.health.temperature') }}</span>
						<v-chip small :color="color(levelTemp)" dark>{{ label(levelTemp) }}</v-chip>
					</div>
					<div class="text-h4 my-1">{{ fmt1(temp) }} &deg;C</div>
					<v-progress-linear :value="temp != null ? temp / 90 * 100 : 0" :color="color(levelTemp)" height="8" rounded class="mb-1" />
					<div class="text-caption grey--text mb-2">
						{{ $t('plugins.WorkshopPiHealth.health.temp_hint', { alert: THRESHOLD.temp[0], limit: THRESHOLD.temp[1] }) }}
					</div>
					<detail-chart :history="S.temp" color="#FF7043" unit="°C" :label="$t('plugins.WorkshopPiHealth.health.temperature')" :limit="THRESHOLD.temp[1]" :limit-label="$t('plugins.WorkshopPiHealth.health.slows_down')" :height="150" />
				</v-card>
			</v-col>

			<!-- RAM -->
			<v-col cols="12" md="6">
				<v-card outlined class="pa-3" :style="edge(levelRam)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-h6"><v-icon class="mr-1">mdi-memory</v-icon>{{ $t('plugins.WorkshopPiHealth.health.ram_memory') }}</span>
						<v-chip small :color="color(levelRam)" dark>{{ label(levelRam) }}</v-chip>
					</div>
					<div class="text-h4 my-1">{{ fmt1(ramPct) }} %</div>
					<v-progress-linear :value="ramPct" :color="color(levelRam)" height="8" rounded class="mb-1" />
					<div class="text-caption grey--text mb-2">
						{{ $t('plugins.WorkshopPiHealth.health.ram_hint', { used: fmtBytes(ramUsed), total: fmtBytes(sbc.memory && sbc.memory.total), free: fmtBytes(sbc.memory && sbc.memory.available), alert: THRESHOLD.ram[0], limit: THRESHOLD.ram[1] }) }}
					</div>
					<detail-chart :history="S.ram" color="#AB47BC" unit="%" :label="$t('plugins.WorkshopPiHealth.health.ram_in_use')" :limit="THRESHOLD.ram[1]" :limit-label="$t('plugins.WorkshopPiHealth.health.limit_lower')" :height="150" />
				</v-card>
			</v-col>

			<!-- Almacenamiento -->
			<v-col cols="12" md="6">
				<v-card outlined class="pa-3" :style="edge(levelDisk)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-h6"><v-icon class="mr-1">mdi-micro-sd</v-icon>{{ $t('plugins.WorkshopPiHealth.health.storage') }}</span>
						<v-chip small :color="color(levelDisk)" dark>{{ label(levelDisk) }}</v-chip>
					</div>
					<div v-for="v in disks" :key="v.path" class="mt-2">
						<div class="d-flex justify-space-between">
							<span>{{ v.path === '/' ? $t('plugins.WorkshopPiHealth.health.sd_card_system_and_files') : v.path }}</span>
							<span><b>{{ fmt1(v.pct) }} %</b> &middot; {{ $t('plugins.WorkshopPiHealth.health.free_of_total', { free: fmtBytes(v.free), total: fmtBytes(v.total) }) }}</span>
						</div>
						<v-progress-linear :value="v.pct" :color="color(levelOf(v.pct, THRESHOLD.disk))" height="8" rounded />
					</div>
					<div class="text-caption grey--text mt-2 mb-2">{{ $t('plugins.WorkshopPiHealth.health.disk_hint', { alert: THRESHOLD.disk[0], limit: THRESHOLD.disk[1] }) }}</div>
					<detail-chart :history="S.disk" color="#26A69A" unit="%" :label="$t('plugins.WorkshopPiHealth.health.sd_in_use')" :limit="THRESHOLD.disk[1]" :limit-label="$t('plugins.WorkshopPiHealth.health.limit_lower')" :height="150" />
				</v-card>
			</v-col>
		</v-row>

		<!-- ===== Lo que mide WorkshopService (health_poller.py) ===== -->
		<div v-if="sbc && !sp" class="text-caption grey--text mt-2">
			{{ $t('plugins.WorkshopPiHealth.health.waiting_for_the_workshopservice_health') }}
		</div>
		<!-- service stopped (2026-10-10): healthPi stays with the last thing it
			     published; it is shown off and announced, not as if it were up to date -->
		<div v-if="sp && !pccRuns" class="text-caption warning--text mt-2">
			{{ $t('plugins.WorkshopPiHealth.health.data_from_the_last_time_the') }}
		</div>
		<v-row v-if="sp" dense class="mt-1" :style="pccRuns ? null : 'opacity: 0.45'">
			<!-- Alimentacion y rendimiento -->
			<v-col cols="12" md="6">
				<v-card outlined class="pa-3" :style="edge(levelVolt)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-h6"><v-icon class="mr-1">mdi-flash</v-icon>{{ $t('plugins.WorkshopPiHealth.health.power_and_performance') }}</span>
						<v-chip small :color="color(levelVolt)" dark>{{ label(levelVolt) }}</v-chip>
					</div>
					<v-simple-table dense class="mt-2">
						<tbody>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.undervoltage') }}</td><td>
								<v-chip x-small :color="thr.low_voltage_now ? 'error' : 'success'" dark>{{ thr.low_voltage_now ? $t('plugins.WorkshopPiHealth.health.now_upper') : $t('plugins.WorkshopPiHealth.health.no') }}</v-chip>
								<span class="grey--text ml-2">{{ $t('plugins.WorkshopPiHealth.health.since_boot') }} {{ thr.low_voltage_since_startup ? $t('plugins.WorkshopPiHealth.health.yes_there_was') : $t('plugins.WorkshopPiHealth.health.no') }}</span>
							</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.throttled_by_heat') }}</td><td>
								<v-chip x-small :color="thr.limited_now || thr.limit_temp_now ? 'warning' : 'success'" dark>{{ thr.limited_now || thr.limit_temp_now ? $t('plugins.WorkshopPiHealth.health.now_upper') : $t('plugins.WorkshopPiHealth.health.no') }}</v-chip>
								<span class="grey--text ml-2">{{ $t('plugins.WorkshopPiHealth.health.since_boot') }} {{ thr.limited_since_startup || thr.limit_temp_since_startup ? $t('plugins.WorkshopPiHealth.health.yes_there_was') : $t('plugins.WorkshopPiHealth.health.no') }}</span>
							</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.cpu_speed') }}</td><td>{{ sp.cpu && sp.cpu.freq_mhz }} MHz</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.load_1_5_15_min') }}</td><td>{{ sp.cpu && sp.cpu.load ? sp.cpu.load.join(' / ') : '--' }} <span class="grey--text">{{ $t('plugins.WorkshopPiHealth.health.4_cores_4_all_busy') }}</span></td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.clock') }}</td><td>{{ sp.clock_synchronized ? $t('plugins.WorkshopPiHealth.health.synchronized_internet_time') : $t('plugins.WorkshopPiHealth.health.not_synchronized') }}</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.last_restart') }}</td><td>
								{{ $t('plugins.WorkshopPiHealth.health.ago', { time: fmtUptime(sp.uptime_s) }) }}
								<span v-if="sp.restart" :class="sp.restart.ordenado ? 'grey--text' : 'error--text'">
									&middot; {{ sp.restart.ordenado ? $t('plugins.WorkshopPiHealth.health.clean_shutdown') : $t('plugins.WorkshopPiHealth.health.no_clean_shutdown_last_data_at', { time: sp.restart.last_datum }) }}
								</span>
							</td></tr>
						</tbody>
					</v-simple-table>
					<div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.undervoltage_the_system_s_power_supply') }}</div>
				</v-card>
			</v-col>

			<!-- Red / WiFi -->
			<v-col cols="12" md="6">
				<v-card outlined class="pa-3" :style="edge(levelWifi)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-h6"><v-icon class="mr-1">mdi-wifi</v-icon>{{ $t('plugins.WorkshopPiHealth.health.network_wifi') }}</span>
						<v-chip small :color="color(levelWifi)" dark>{{ label(levelWifi) }}</v-chip>
					</div>
					<div class="my-1">
						<span class="text-h5">{{ wifi.connected ? (wifi.signal_pct + ' %') : $t('plugins.WorkshopPiHealth.health.disconnected') }}</span>
						<span v-if="wifi.dbm != null" class="grey--text ml-2">{{ wifi.dbm }} dBm</span>
						<span class="ml-3">{{ wifi.ssid }}</span>
					</div>
					<div class="text-caption grey--text">
						{{ wifi.speed }} &middot; {{ $t('plugins.WorkshopPiHealth.health.channel_n', { n: wifi.channel }) }} &middot; IP {{ wifi.ip }} &middot; router {{ wifi.router }}
					</div>
					<div class="mt-2">
						<v-chip v-for="p in pings" :key="p.k" x-small class="mr-1 mb-1" :color="p.ms == null ? 'error' : (p.ms > p.slow ? 'warning' : 'success')" dark>
							{{ p.label }}: {{ p.ms == null ? $t('plugins.WorkshopPiHealth.health.not_responding') : p.ms + ' ms' }}
						</v-chip>
					</div>
					<detail-chart :history="S.wifi" color="#29B6F6" unit="%" :label="$t('plugins.WorkshopPiHealth.health.wifi_signal')" :height="130" class="mt-1" />
				</v-card>
			</v-col>

			<!-- Servicios -->
			<v-col cols="12" md="6">
				<v-card outlined class="pa-3" :style="edge(levelServ)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-h6"><v-icon class="mr-1">mdi-cogs</v-icon>{{ $t('plugins.WorkshopPiHealth.health.services') }}</span>
						<v-chip small :color="color(levelServ)" dark>{{ label(levelServ) }}</v-chip>
					</div>
					<v-simple-table dense class="mt-2">
						<tbody>
							<tr v-for="s in (sp.services || [])" :key="s.unit">
								<td>{{ s.name }}</td>
								<td><v-chip x-small :color="s.active ? 'success' : 'error'" dark>{{ s.active ? $t('plugins.WorkshopPiHealth.health.running') : s.state }}</v-chip></td>
								<td class="grey--text text-caption">{{ s.since ? $t('plugins.WorkshopPiHealth.health.since_time', { time: s.since.replace(/^\w+ /, '').replace(/ -\d+$/, '') }) : '' }}</td>
							</tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.kiosk_screen') }}</td><td><v-chip x-small :color="sp.kiosk ? 'success' : 'warning'" dark>{{ sp.kiosk ? $t('plugins.WorkshopPiHealth.health.open_f') : $t('plugins.WorkshopPiHealth.health.closed_f') }}</v-chip></td><td></td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.camera_port_8090') }}</td><td><v-chip x-small :color="sp.red && sp.red.camera ? 'success' : 'warning'" dark>{{ sp.red && sp.red.camera ? $t('plugins.WorkshopPiHealth.health.answers') : $t('plugins.WorkshopPiHealth.health.not_responding') }}</v-chip></td><td></td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.gcode_bridge_telnet') }}</td><td>{{ sp.bridge_clients == null ? '--' : (sp.bridge_clients ? $t('plugins.WorkshopPiHealth.health.n_programs_connected', { n: sp.bridge_clients }) : $t('plugins.WorkshopPiHealth.health.nobody_connected')) }}<div v-if="sp.bridge_programs && sp.bridge_programs.length" class="text-caption grey--text">{{ sp.bridge_programs.join(', ') }}</div></td><td class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.bridge_name_hint') }}</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.motor_data') }}</td><td>{{ sp.data && sp.data.motors_s != null ? $t('plugins.WorkshopPiHealth.health.s_ago', { n: sp.data.motors_s }) : '--' }}</td><td></td></tr>
						</tbody>
					</v-simple-table>
				</v-card>
			</v-col>

			<!-- Duet + pantallas -->
			<v-col cols="12" md="6">
				<v-card outlined class="pa-3">
					<span class="text-h6"><v-icon class="mr-1">mdi-chip</v-icon>{{ $t('plugins.WorkshopPiHealth.health.duet_and_screens') }}</span>
					<v-simple-table dense class="mt-2">
						<tbody>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.status') }}</td><td>{{ duet.state }} &middot; firmware {{ duet.firmware }}</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.main_board') }}</td><td>{{ fmt1(duet.mcu_temp_c) }} &deg;C &middot; {{ fmt1(duet.vin_v) }} V</td></tr>
							<tr v-for="p in (duet.boards || [])" :key="'p' + p.can"><td>{{ p.name }} <span class="grey--text">(CAN {{ p.can }})</span></td><td>{{ p.state === 'unknown' && p.can === 0 ? $t('plugins.WorkshopPiHealth.health.main') : p.state }}</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.system_duet_retries_1_h') }}</td><td>{{ sp.reenvios_1h == null ? $t('plugins.WorkshopPiHealth.health.no_permission_to_read_the_log') : sp.reenvios_1h }}</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.devices_with_dwc_open') }}</td><td>
								{{ (screen.devices || []).length }}:
								<span v-for="(e, i) in (screen.devices || [])" :key="e.origin">{{ i ? ', ' : '' }}{{ e.origin }}<span v-if="e.sessions > 1" class="grey--text"> {{ $t('plugins.WorkshopPiHealth.health.n_sessions_paren', { n: e.sessions }) }}</span></span>
								<div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.each_dwc_load_or_reload_opens') }}</div>
							</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.status_requests_per_minute') }}</td><td>{{ screen.status_per_min == null ? $t('plugins.WorkshopPiHealth.health.no_permission_to_read_the_log') : screen.status_per_min }}</td></tr>
						</tbody>
					</v-simple-table>
					<div class="text-caption grey--text">
						{{ $t('plugins.WorkshopPiHealth.health.retries_and_requests_per_minute_come') }}<code>sudo usermod -aG systemd-journal dsf</code> {{ $t('plugins.WorkshopPiHealth.health.and_restart_the_system') }}
					</div>
				</v-card>
			</v-col>

			<!-- Service database (2026-10-10: "a state of the database that
				     is created; only shown if the database was created") -->
			<v-col v-if="base" cols="12" md="6">
				<v-card outlined class="pa-3" :style="edge(base.check === 'ok' ? 0 : 2)">
					<div class="d-flex align-center flex-wrap">
						<span class="text-h6 mr-2"><v-icon class="mr-1">mdi-database</v-icon>{{ $t('plugins.WorkshopPiHealth.health.database') }}</span>
						<v-chip x-small dark :color="base.error ? 'grey' : (base.check === 'ok' ? 'success' : 'warning')">
							{{ base.error ? $t('plugins.WorkshopPiHealth.health.no_data') : (base.check === 'ok' ? $t('plugins.WorkshopPiHealth.health.healthy') : $t('plugins.WorkshopPiHealth.health.check')) }}
						</v-chip>
						<v-chip v-if="base.backup" x-small dark class="ml-1" :color="respState.color">{{ respState.text }}</v-chip>
						<v-spacer />
						<v-btn v-if="hasService" x-small outlined @click="configureBase"><v-icon x-small left>mdi-cog-outline</v-icon>{{ $t('plugins.WorkshopPiHealth.health.configure_in_services') }}</v-btn>
					</div>
					<div v-if="base.error" class="text-caption warning--text mt-1">{{ $t('plugins.WorkshopPiHealth.health.could_not_read', { error: base.error }) }}</div>
					<template v-else>
						<div class="text-caption grey--text">
							{{ $t('plugins.WorkshopPiHealth.health.database_hint') }}
						</div>
						<div class="d-flex flex-wrap mt-2" style="gap:6px 18px">
							<div><div class="text-h6">{{ base.mb }} MB</div><div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.size') }}<template v-if="base.wal_mb"> {{ $t('plugins.WorkshopPiHealth.health.wal_mb_in_progress', { mb: base.wal_mb }) }}</template></div></div>
							<div><div class="text-h6">{{ rowsTotal }}</div><div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.rows_stored') }}</div></div>
							<div><div class="text-h6">{{ base.free_mb }} MB</div><div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.unused_space_inside') }}</div></div>
							<div><div class="text-h6 text-no-wrap">{{ hour(base.modified) }}</div><div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.last_write') }}</div></div>
							<div v-if="disk"><div class="text-h6" :class="disk.free_gb < 2 ? 'warning--text' : ''">{{ disk.free_gb }} GB</div><div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.free_on_system_card', { pct: disk.free_pct }) }}</div></div>
						</div>
						<v-simple-table dense class="mt-2">
							<thead><tr><th>{{ $t('plugins.WorkshopPiHealth.health.what_it_stores') }}</th><th class="text-right">{{ $t('plugins.WorkshopPiHealth.health.rows') }}</th><th>{{ $t('plugins.WorkshopPiHealth.health.from') }}</th><th>{{ $t('plugins.WorkshopPiHealth.health.to') }}</th></tr></thead>
							<tbody>
								<tr v-for="tb in tablesVisible" :key="tb.name">
									<td>{{ nameTable(tb.name) }} <span class="grey--text text-caption">({{ tb.name }})</span></td>
									<td class="text-right">{{ tb.rows }}</td>
									<td class="text-no-wrap">{{ date(tb.since) }}</td>
									<td class="text-no-wrap">{{ date(tb.until) }}</td>
								</tr>
							</tbody>
						</v-simple-table>
						<div class="text-caption mt-2">
							<v-icon x-small>mdi-file-outline</v-icon> <code>{{ base.file }}</code>
						</div>
						<!-- backups (2026-10-11, request: "improve the database information in Health") -->
						<div v-if="resp && !resp.error" class="d-flex flex-wrap mt-2" style="gap:6px 18px">
							<div><div class="text-h6 text-no-wrap">{{ resp.last ? date(resp.last.date) : '--' }}</div><div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.last_backup') }}<template v-if="resp.last"> ({{ resp.last.mb }} MB)</template></div></div>
							<div><div class="text-h6 text-no-wrap">{{ !resp.active ? $t('plugins.WorkshopPiHealth.health.off') : (resp.next ? dateTs(resp.next) : $t('plugins.WorkshopPiHealth.health.soon')) }}</div><div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.next_backup') }}</div></div>
							<div><div class="text-h6">{{ resp.amount || 0 }}</div><div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.backups_stored_mb', { mb: resp.mb_total || 0 }) }}</div></div>
							<div><div class="text-h6">{{ resp.daily }} + {{ resp.weekly }}</div><div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.kept_daily_weekly') }}</div></div>
							<div v-if="resp.free_gb != null"><div class="text-h6" :class="resp.free_gb < 1 ? 'warning--text' : ''">{{ resp.free_gb }} GB</div><div class="text-caption grey--text">{{ $t('plugins.WorkshopPiHealth.health.free_where_they_re_stored') }}</div></div>
						</div>
						<div v-if="resp && resp.folder" class="text-caption mt-1"><v-icon x-small>mdi-folder-outline</v-icon> {{ $t('plugins.WorkshopPiHealth.health.backups_in') }} <code>{{ resp.folder }}</code></div>
						<div v-if="resp && resp.failures && resp.failures.length" class="text-caption error--text mt-1"><v-icon x-small color="error">mdi-alert-circle</v-icon> {{ resp.failures[0].text || resp.failures[0] }}</div>
						<div v-if="resp && resp.mirror" class="text-caption mt-1"><v-icon x-small>mdi-usb-flash-drive</v-icon> {{ $t('plugins.WorkshopPiHealth.health.copy_in') }} <code>{{ resp.mirror }}</code> ({{ resp.mirror_amount }})</div>
						<div v-else-if="resp && resp.same_card && resp.active" class="text-caption warning--text mt-1"><v-icon x-small color="warning">mdi-sd</v-icon> {{ $t('plugins.WorkshopPiHealth.health.the_database_and_its_backups_are') }}</div>
						<div v-if="resp && resp.per_delete && resp.per_delete.length" class="text-caption warning--text mt-1">{{ $t('plugins.WorkshopPiHealth.health.n_backups_to_be_deleted', { n: resp.per_delete.length }) }}</div>
						<div v-if="base.backups && base.backups.length" class="text-caption grey--text mt-1">
							{{ $t('plugins.WorkshopPiHealth.health.copies_from_before_migrating') }} <span v-for="(r, i) in base.backups" :key="r.file">{{ i ? ', ' : '' }}{{ r.file }} ({{ r.mb }} MB, {{ date(r.date) }})</span>
						</div>
						<div v-if="rowsRare" class="text-caption warning--text mt-1">
							<v-icon x-small color="warning">mdi-alert</v-icon> {{ $t('plugins.WorkshopPiHealth.health.n_rows_bad_date', { n: rowsRare }) }}
						</div>
						<div v-if="base.dates_repaired" class="text-caption grey--text mt-1">{{ $t('plugins.WorkshopPiHealth.health.n_rows_date_repaired', { n: base.dates_repaired }) }}</div>
						<div v-if="base.check !== 'ok'" class="text-caption warning--text mt-1">{{ $t('plugins.WorkshopPiHealth.health.sqlite_quick_check_gave', { result: base.check }) }}</div>
					</template>
				</v-card>
			</v-col>

			<!-- Alertas -->
			<v-col cols="12">
				<v-card outlined class="pa-3">
					<div class="d-flex align-center flex-wrap">
						<span class="text-h6 mr-3"><v-icon class="mr-1">mdi-bell-ring</v-icon>{{ $t('plugins.WorkshopPiHealth.health.phone_alerts') }}</span>
						<v-chip x-small :color="notice.active ? 'success' : 'grey'" dark class="mr-1">{{ notice.active ? $t('plugins.WorkshopPiHealth.health.notifications_on') : $t('plugins.WorkshopPiHealth.health.notifications_off') }}</v-chip>
						<v-chip v-if="noticeMuted" x-small color="warning" dark>{{ $t('plugins.WorkshopPiHealth.health.muted_for_a_while') }}</v-chip>
					</div>
					<div class="text-caption grey--text mb-1">
						{{ $t(hasActivity ? 'plugins.WorkshopPiHealth.health.every_alert_is_also_logged_in' : 'plugins.WorkshopPiHealth.health.every_alert_is_also_logged_in_no_activity') }}
					</div>
					<v-row dense>
						<v-col v-for="a in ALERTS" :key="a.kind" cols="12" sm="6" md="4">
							<v-switch dense hide-details class="mt-1" :input-value="!!noticeKinds[a.kind]" :loading="changing === a.kind" :disabled="!atLeast('technician')" :label="a.label" @change="v => changeAlert(a.kind, v)" />
							<div class="text-caption grey--text ml-12">{{ a.detail(threshold) }}</div>
						</v-col>
					</v-row>
					<div v-if="!atLeast('technician')" class="text-caption grey--text mt-1">{{ $t('plugins.WorkshopPiHealth.health.alerts_read_only') }}</div>
					<error-notice :error="errorAlert" class="mt-1" />
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script>
import i18n from '../../i18n'

'use strict'

import ServiceNotice from './ServiceNotice.vue'
import StartupPanel from './StartupPanel.vue' // start-up card (vue/_shared)
import PageHeader from './PageHeader.vue' // header of every page (vue/_shared)
import { rowsHealth } from './startup-rows.js'
import Vue from 'vue'
import store from '@/store'
import { mapActions } from 'vuex'
import { api } from './workshop-api.js'
import DetailChart from './DetailChart.vue'
import { pluginOf, pathExists } from './workshop-ids.js' // Id nuevo o viejo del plugin
import { serviceTexts } from './service-text.js'
import ErrorNotice from './ErrorNotice.vue' // vue/_shared
import { roleMixin } from './role-mixin.js' // what the role may do (vue/_shared)
import { RANGES, mergeAll } from './health-history.js' // history kept by the service + live samples

// Thresholds [alert, limit]. Temperature: the Pi 4 lowers the CPU
// speed (throttling) from ~80 C; 70 C is already a reason to look at the ventilation.
const threshold = { cpu: [80, 95], temp: [70, 80], ram: [80, 90], disk: [80, 90] };

const SAMPLE_MS = 5000;
const HISTORY_LEN = 720; // 1 h at one sample every 5 s
const H_KEY = 'workshopHealthHist';

// MODULE-level history (the same pattern as Motors): it starts when DWC
// loads the plugin, collects samples even if the page is closed and is saved
// in sessionStorage, so it is not erased on changing page nor on reloading.
const H = Vue.observable({ cpu: [], temp: [], ram: [], disk: [], wifi: [] });

// Alerts (health_poller.py in WorkshopService); they are turned on/off with the
// notifier's per-type switch (the same one as the Activity page).
const alerts = [
	{ kind: 'health_temp', label: i18n.t('plugins.WorkshopPiHealth.health.high_temperature'), detail: u => i18n.t('plugins.WorkshopPiHealth.health.alert_temp_detail', { c: u.temp_alert_c || 75, s: u.temp_sustained_s || 60 }) },
	{ kind: 'health_voltage', label: i18n.t('plugins.WorkshopPiHealth.health.undervoltage'), detail: () => i18n.t('plugins.WorkshopPiHealth.health.the_system_s_power_supply_doesn') },
	{ kind: 'health_wifi', label: i18n.t('plugins.WorkshopPiHealth.health.wifi_down'), detail: u => i18n.t('plugins.WorkshopPiHealth.health.alert_wifi_detail', { s: u.wifi_sustained_s || 60 }) },
	{ kind: 'health_service', label: i18n.t('plugins.WorkshopPiHealth.health.service_stopped'), detail: u => i18n.t('plugins.WorkshopPiHealth.health.alert_service_detail', { s: u.service_sustained_s || 30 }) },
	{ kind: 'health_restart', label: i18n.t('plugins.WorkshopPiHealth.health.unexpected_restart'), detail: () => i18n.t('plugins.WorkshopPiHealth.health.the_system_booted_without_a_clean') },
	{ kind: 'health_disk', label: i18n.t('plugins.WorkshopPiHealth.health.low_space_or_large_database'), detail: u => i18n.t('plugins.WorkshopPiHealth.health.alert_disk_detail', { gb: u.disk_alert_gb || 2, pct: u.disk_alert_pct || 10, mb: u.base_alert_mb || 200 }) }
];

function healthPi() {
	const plugins = store.state.machine.model.plugins;
	const pm = pluginOf(plugins, 'service');
	if (!pm || !pm.data) {
		return null;
	}
	return (typeof pm.data.get === 'function') ? pm.data.get('healthPi') : pm.data.healthPi;
}

function modelo() {
	return store.state.machine.model;
}
function useDisk(m) {
	const v = (m.volumes || []).find(x => x && x.path === '/');
	if (!v || !v.capacity) {
		return null;
	}
	return (v.capacity - v.freeSpace) / v.capacity * 100;
}
function pushH(arr, y, t) {
	if (y == null || !isFinite(y)) {
		return;
	}
	arr.push({ t: t, y: Math.round(y * 10) / 10 });
	if (arr.length > HISTORY_LEN) {
		arr.splice(0, arr.length - HISTORY_LEN);
	}
}
function sample() {
	const m = modelo();
	const sbc = m && m.sbc;
	if (!sbc) {
		return;
	}
	const t = Date.now();
	pushH(H.cpu, sbc.cpu && sbc.cpu.avgLoad, t);
	pushH(H.temp, sbc.cpu && sbc.cpu.temperature, t);
	if (sbc.memory && sbc.memory.total) {
		pushH(H.ram, (sbc.memory.total - sbc.memory.available) / sbc.memory.total * 100, t);
	}
	pushH(H.disk, useDisk(m), t);
	const sp = healthPi();
	if (sp && sp.wifi) {
		pushH(H.wifi, sp.wifi.connected ? sp.wifi.signal_pct : 0, t);
	}
}
function restore() {
	try {
		const s = JSON.parse(sessionStorage.getItem(H_KEY) || 'null');
		if (!s) {
			return;
		}
		const min = Date.now() - HISTORY_LEN * SAMPLE_MS;
		['cpu', 'temp', 'ram', 'disk', 'wifi'].forEach(k => {
			(Array.isArray(s[k]) ? s[k] : []).forEach(p => {
				if (p && p.t >= min) {
					H[k].push(p);
				}
			});
		});
	} catch (e) {
		// without sessionStorage / corrupt data: it starts empty
	}
}
function save() {
	try {
		sessionStorage.setItem(H_KEY, JSON.stringify(H));
	} catch (e) {
		// no critico
	}
}
let started = false;
function start() {
	if (started) {
		return;
	}
	started = true;
	restore();
	setInterval(sample, SAMPLE_MS);
	setInterval(save, 30000);
	window.addEventListener('beforeunload', save);
}
start();

export default {
	mixins: [roleMixin],
	components: { PageHeader, ServiceNotice: ServiceNotice, StartupPanel: StartupPanel, DetailChart, ErrorNotice },
	data() {
		return { H: H, RANGES: RANGES, range: '1h', serverHist: null, THRESHOLD: threshold, ALERTS: alerts, changing: null, errorAlert: null, startupWait: false };
	},
	computed: {
		// what the charts draw: the history of the service (health.history) joined with this browser's live samples; with an old service
		// (no health.history) only the live samples, as before
		S() {
			const sh = this.serverHist;
			return mergeAll(sh ? sh.series : null, H, sh ? sh.step_s * 1000 : 0);
		},
		// start-up card: what this board lets the page read (a Duet alone, a Pi without WiFi or another SBC are grey)
		rowsStartup() {
			const sp = this.sp;
			return rowsHealth({
				sbc: !!this.sbc,
				data: !!sp,
				waitExpired: this.startupWait,
				vcgencmd: !!(sp && sp.throttled),
				wifi: !!(sp && sp.wifi && sp.wifi.connected),
				routerMs: sp && sp.red ? sp.red.router_ms : undefined,
				services: sp && Array.isArray(sp.services) ? sp.services : null
			});
		},
		// other plugins' pages: what points to them shows only when they are there
		hasActivity() {
			return pathExists(this.$router, '/Plugins/Activity');
		},
		hasService() {
			return pathExists(this.$router, '/Plugins/WorkshopService');
		},
		pluginData() {
			const plugins = this.$store.state.machine.model.plugins;
			const pm = pluginOf(plugins, 'service');
			return pm && pm.data ? pm.data : null;
		},
		pccRuns() {
			const plugins = this.$store.state.machine.model.plugins;
			const pm = pluginOf(plugins, 'service');
			return !!(pm && pm.pid > 0);
		},
		sp() {
			// the texts of the service (service names, screens) come as {key, params}: shown in the language of this DWC
			const d = this.pluginData;
			return d ? serviceTexts(((typeof d.get === 'function') ? d.get('healthPi') : d.healthPi) || null) : null;
		},
		thr() { return (this.sp && this.sp.throttled) || {}; },
		wifi() { return (this.sp && this.sp.wifi) || {}; },
		duet() { return (this.sp && this.sp.duet) || {}; },
		screen() { return (this.sp && this.sp.screens) || {}; },
		// only if the database exists (the reader sends null if it has not been created yet)
		base() { return (this.sp && this.sp.base) || null; },
		resp() { return (this.base && this.base.backup) || null; },
		disk() { return (this.sp && this.sp.disk) || null; },
		respState() {
			const r = this.base && this.base.backup;
			if (!r) return { text: '', color: 'grey' };
			if (!r.active) return { text: i18n.t('plugins.WorkshopPiHealth.health.backups_off'), color: 'grey' };
			if (r.failures && r.failures.length) return { text: i18n.t('plugins.WorkshopPiHealth.health.backups_failing'), color: 'error' };
			if (r.late) return { text: i18n.t('plugins.WorkshopPiHealth.health.backup_overdue'), color: 'orange darken-2' };
			if (!r.last) return { text: i18n.t('plugins.WorkshopPiHealth.health.first_backup_pending'), color: 'blue' };
			return { text: i18n.t('plugins.WorkshopPiHealth.health.backups_on'), color: 'success' };
		},
		// the presets table is no longer used: it stays in the database but is not shown
		tablesVisible() { return ((this.base && this.base.tables) || []).filter(x => x.name !== 'presets'); },
		rowsRare() { return ((this.base && this.base.tables) || []).reduce((s, x) => s + (x.date_odd || 0), 0); },
		rowsTotal() { return ((this.base && this.base.tables) || []).reduce((s, x) => s + (x.rows || 0), 0); },
		threshold() { return (this.sp && this.sp.thresholds) || {}; },
		noticeState() {
			const d = this.pluginData;
			return d ? serviceTexts(((typeof d.get === 'function') ? d.get('notifications') : d.notifications) || null) : null;
		},
		notice() { return (this.noticeState && this.noticeState.config) || {}; },
		noticeKinds() { return this.notice.kinds || {}; },
		noticeMuted() { return !!(this.noticeState && this.noticeState.muted); },
		pings() {
			const r = (this.sp && this.sp.red) || {};
			return [
				{ k: 'r', label: 'router', ms: r.router_ms, slow: 50 },
				{ k: 'i', label: 'internet', ms: r.internet_ms, slow: 200 },
				{ k: 'm', label: i18n.t('plugins.WorkshopPiHealth.health.tuya_meter'), ms: r.meter_ms, slow: 300 },
				{ k: 'a', label: i18n.t('plugins.WorkshopPiHealth.health.alerts_ntfy'), ms: r.notices_ms, slow: 1500 }
			].filter(p => p.ms !== undefined);
		},
		levelVolt() {
			if (!this.sp || !this.sp.throttled) { return 'sin'; }
			if (this.thr.low_voltage_now) { return 'limit'; }
			if (this.thr.limited_now || this.thr.limit_temp_now || this.thr.low_voltage_since_startup || this.thr.limited_since_startup) { return 'alert'; }
			return 'ok';
		},
		levelWifi() {
			if (!this.sp) { return 'sin'; }
			if (!this.wifi.connected || (this.sp.red && this.sp.red.router_ms === null)) { return 'limit'; }
			return this.wifi.signal_pct != null && this.wifi.signal_pct < 40 ? 'alert' : 'ok';
		},
		levelServ() {
			if (!this.sp || !this.sp.services) { return 'sin'; }
			if (this.sp.services.some(s => !s.active)) { return 'limit'; }
			return this.sp.kiosk === false || (this.sp.red && this.sp.red.camera === false) ? 'alert' : 'ok';
		},
		sbc() {
			return this.$store.state.machine.model.sbc || null;
		},
		cpuPct() {
			return this.sbc && this.sbc.cpu ? this.sbc.cpu.avgLoad : null;
		},
		temp() {
			return this.sbc && this.sbc.cpu ? this.sbc.cpu.temperature : null;
		},
		ramUsed() {
			const mem = this.sbc && this.sbc.memory;
			return mem && mem.total ? mem.total - mem.available : null;
		},
		ramPct() {
			const mem = this.sbc && this.sbc.memory;
			return mem && mem.total ? this.ramUsed / mem.total * 100 : null;
		},
		disks() {
			return (this.$store.state.machine.model.volumes || [])
				.filter(v => v && v.mounted && v.capacity)
				.map(v => ({ path: v.path, total: v.capacity, free: v.freeSpace, pct: (v.capacity - v.freeSpace) / v.capacity * 100 }));
		},
		// what the page header counts: each reading the page grades ('limit' = fault, 'alert' = attention)
		headerReasons() {
			return [['volt', this.levelVolt], ['wifi', this.levelWifi], ['serv', this.levelServ], ['cpu', this.levelCpu], ['temp', this.levelTemp], ['ram', this.levelRam], ['disk', this.levelDisk]]
				.filter(x => x[1] === 'limit' || x[1] === 'alert')
				.map(x => ({ level: x[1] === 'limit' ? 'error' : 'warn', text: i18n.t('plugins.WorkshopPiHealth.health.reason_' + x[0]) }));
		},
		levelCpu() { return this.levelOf(this.cpuPct, threshold.cpu); },
		levelTemp() { return this.levelOf(this.temp, threshold.temp); },
		levelRam() { return this.levelOf(this.ramPct, threshold.ram); },
		levelDisk() {
			const root = this.disks.find(v => v.path === '/');
			return this.levelOf(root ? root.pct : null, threshold.disk);
		}
	},
	mounted() {
		// Heartbeat (DCS load, 2026-10-12): WorkshopService reads the health and services data at full speed only while this page is
		// visible; without a heartbeat for 30 s it slows down (dsf/viewers.py). Same pattern as the
		// trace view (src/_zones/47-job.js): every 10 s, only if the tab and the page are visible.
		this._heartbeat = setInterval(() => this.heartbeat(), 10000);
		this.heartbeat();
		this.loadHistory();
		this._startupWait = setTimeout(() => { this.startupWait = true; }, 20000); // start-up card: data should be here by now
	},
	beforeDestroy() {
		clearInterval(this._heartbeat);
		clearTimeout(this._startupWait);
	},
	watch: {
		range() {
			this.loadHistory();
		}
	},
	methods: {
		// health.history: an old service answers unknown_op (or refuses the call): then nothing changes, the charts are the live ones
		async loadHistory() {
			try {
				const r = await api('health.history', { range: this.range, limit: 300 });
				this.serverHist = r && r.series ? r : null;
			} catch (e) {
				if (!this.serverHist || (e && e.code === 'unknown_op')) this.serverHist = null;
			}
		},
		heartbeat() {
			if (document.hidden || !this.$el || this.$el.isConnected === false) return;
			api('view.heartbeat', { topic: 'health' }).catch(() => {});
		},
		nameTable(n) {
			return ({ activity: i18n.t('plugins.WorkshopPiHealth.health.activity_jobs_modes_alerts'), consumption: i18n.t('plugins.WorkshopPiHealth.health.energy_meter_readings'), commands: i18n.t('plugins.WorkshopPiHealth.health.received_commands') })[n] || n;
		},
		// "2026-10-10T22:51:03" -> "10/10 22:51"
		date(ts) {
			const s = String(ts || '');
			return s.length >= 16 ? s.slice(8, 10) + '/' + s.slice(5, 7) + ' ' + s.slice(11, 16) : '-';
		},
		// seconds since 1970 (like the backups' "next") -> dd/mm hh:mm
		dateTs(ts) {
			const d = new Date(Number(ts) * 1000);
			if (isNaN(d)) return '-';
			const p = n => String(n).padStart(2, '0');
			return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
		},
		hour(ts) {
			const s = String(ts || '');
			const today = new Date();
			const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
			return s.slice(0, 10) === d ? s.slice(11, 16) : this.date(s);
		},
		...mapActions('machine', ['sendCode']),
		async changeAlert(kind, v) {
			this.changing = kind;
			this.errorAlert = null;
			try {
				await api('notifications.type', { type: kind, on: !!v });
			} catch (e) {
				this.errorAlert = e;
			}
			this.changing = null;
		},
		// Configuration lives only in the Services page (card svc-base)
		configureBase() {
			this.$router.push({ path: '/Plugins/WorkshopService', query: { anchor: 'svc-base' } }).catch(() => {});
		},
		levelOf(v, u) {
			if (v == null || !isFinite(v)) {
				return 'sin';
			}
			return v >= u[1] ? 'limit' : v >= u[0] ? 'alert' : 'ok';
		},
		color(n) {
			return { ok: 'success', alert: 'warning', limit: 'error', sin: 'grey' }[n];
		},
		label(n) {
			return { ok: 'OK', alert: i18n.t('plugins.WorkshopPiHealth.health.alert'), limit: i18n.t('plugins.WorkshopPiHealth.health.limit'), sin: i18n.t('plugins.WorkshopPiHealth.health.no_data') }[n];
		},
		// the state of a block is the dot and the word of its chip, not a colored edge of the card (family.css)
		edge() {
			return '';
		},
		fmt1(v) {
			return v == null || !isFinite(v) ? '--' : (Math.round(v * 10) / 10).toString();
		},
		fmtBytes(b) {
			if (b == null || !isFinite(b)) {
				return '--';
			}
			const gb = b / 1073741824;
			return gb >= 1 ? gb.toFixed(1) + ' GB' : (b / 1048576).toFixed(0) + ' MB';
		},
		fmtUptime(s) {
			if (s == null) {
				return '--';
			}
			s = Math.floor(s);
			const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
			return (d ? d + ' d ' : '') + (d || h ? h + ' h ' : '') + m + ' min';
		}
	}
}
</script>
