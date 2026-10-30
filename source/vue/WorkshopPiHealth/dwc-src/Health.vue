<template>
	<v-container fluid class="pa-0 workshop-theme">
		<service-notice />
		<page-header :lead="$t('plugins.WorkshopPiHealth.common.lead')" icon="mdi-heart-pulse" :title="$t('plugins.WorkshopPiHealth.common.system_health')" :reasons="headerReasons" :loading="!sbc">
			<v-chip v-if="sbc" size="small" variant="outlined">{{ sbc.model || 'SBC' }}</v-chip>
			<template #startup><startup-panel plugin="WorkshopPiHealth" :defs="rowsStartup" /></template>
		</page-header>
		<v-card class="mb-3">
			<v-card-text v-if="!sbc" class="text-medium-emphasis">
				{{ $t('plugins.WorkshopPiHealth.health.waiting_for_dsf_data_machine_model') }}
			</v-card-text>
			<v-card-text v-else class="pb-2">
				<span class="mr-4">{{ $t('plugins.WorkshopPiHealth.health.on_for') }} <b>{{ fmtUptime(sbc.uptime) }}</b></span>
				<span class="mr-4 text-medium-emphasis">{{ sbc.distribution }}</span>
				<span class="text-medium-emphasis">DSF {{ sbc.dsf && sbc.dsf.version }}</span>
				<div class="text-body-small text-medium-emphasis mt-1">
					{{ $t('plugins.WorkshopPiHealth.health.data_dsf_already_publishes_adds_no') }}
				</div>
				<div v-if="!serverHist" class="text-body-small text-medium-emphasis">
					{{ $t('plugins.WorkshopPiHealth.health.history_this_browser') }}
				</div>
				<div v-else class="d-flex align-center flex-wrap mt-2" style="gap:8px">
					<span class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.history_range') }}</span>
					<v-btn-toggle v-model="range" mandatory density="compact">
						<v-btn v-for="r in RANGES" :key="r" size="small" :value="r">{{ r }}</v-btn>
					</v-btn-toggle>
					<span class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.history_kept_by_service', { days: serverHist.retention_days }) }}</span>
				</div>
			</v-card-text>
		</v-card>

		<v-row v-if="sbc" density="compact">
			<!-- CPU -->
			<v-col cols="12" md="6">
				<v-card variant="outlined" class="pa-3" :style="edge(levelCpu)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-title-large"><v-icon class="mr-1">mdi-cpu-64-bit</v-icon>CPU</span>
						<v-chip size="small" :color="color(levelCpu)" variant="flat">{{ label(levelCpu) }}</v-chip>
					</div>
					<div class="text-headline-medium my-1">{{ fmt1(cpuPct) }} %</div>
					<v-progress-linear :model-value="cpuPct" :color="color(levelCpu)" height="8" rounded class="mb-1" />
					<div class="text-body-small text-medium-emphasis mb-2">
						{{ $t('plugins.WorkshopPiHealth.health.cpu_hint', { cores: sbc.cpu && sbc.cpu.numCores, alert: THRESHOLD.cpu[0], limit: THRESHOLD.cpu[1] }) }}
					</div>
					<detail-chart :history="S.cpu" color="#42A5F5" unit="%" label="CPU" :limit="THRESHOLD.cpu[1]" :limit-label="$t('plugins.WorkshopPiHealth.health.limit_lower')" :height="150" />
				</v-card>
			</v-col>

			<!-- Temperatura -->
			<v-col cols="12" md="6">
				<v-card variant="outlined" class="pa-3" :style="edge(levelTemp)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-title-large"><v-icon class="mr-1">mdi-thermometer</v-icon>{{ $t('plugins.WorkshopPiHealth.health.temperature') }}</span>
						<v-chip size="small" :color="color(levelTemp)" variant="flat">{{ label(levelTemp) }}</v-chip>
					</div>
					<div class="text-headline-medium my-1">{{ fmt1(temp) }} &deg;C</div>
					<v-progress-linear :model-value="temp != null ? temp / 90 * 100 : 0" :color="color(levelTemp)" height="8" rounded class="mb-1" />
					<div class="text-body-small text-medium-emphasis mb-2">
						{{ $t('plugins.WorkshopPiHealth.health.temp_hint', { alert: THRESHOLD.temp[0], limit: THRESHOLD.temp[1] }) }}
					</div>
					<detail-chart :history="S.temp" color="#FF7043" unit="°C" :label="$t('plugins.WorkshopPiHealth.health.temperature')" :limit="THRESHOLD.temp[1]" :limit-label="$t('plugins.WorkshopPiHealth.health.slows_down')" :height="150" />
				</v-card>
			</v-col>

			<!-- RAM -->
			<v-col cols="12" md="6">
				<v-card variant="outlined" class="pa-3" :style="edge(levelRam)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-title-large"><v-icon class="mr-1">mdi-memory</v-icon>{{ $t('plugins.WorkshopPiHealth.health.ram_memory') }}</span>
						<v-chip size="small" :color="color(levelRam)" variant="flat">{{ label(levelRam) }}</v-chip>
					</div>
					<div class="text-headline-medium my-1">{{ fmt1(ramPct) }} %</div>
					<v-progress-linear :model-value="ramPct" :color="color(levelRam)" height="8" rounded class="mb-1" />
					<div class="text-body-small text-medium-emphasis mb-2">
						{{ $t('plugins.WorkshopPiHealth.health.ram_hint', { used: fmtBytes(ramUsed), total: fmtBytes(sbc.memory && sbc.memory.total), free: fmtBytes(sbc.memory && sbc.memory.available), alert: THRESHOLD.ram[0], limit: THRESHOLD.ram[1] }) }}
					</div>
					<detail-chart :history="S.ram" color="#AB47BC" unit="%" :label="$t('plugins.WorkshopPiHealth.health.ram_in_use')" :limit="THRESHOLD.ram[1]" :limit-label="$t('plugins.WorkshopPiHealth.health.limit_lower')" :height="150" />
				</v-card>
			</v-col>

			<!-- Almacenamiento -->
			<v-col cols="12" md="6">
				<v-card variant="outlined" class="pa-3" :style="edge(levelDisk)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-title-large"><v-icon class="mr-1">mdi-micro-sd</v-icon>{{ $t('plugins.WorkshopPiHealth.health.storage') }}</span>
						<v-chip size="small" :color="color(levelDisk)" variant="flat">{{ label(levelDisk) }}</v-chip>
					</div>
					<div v-for="v in disks" :key="v.path" class="mt-2">
						<div class="d-flex justify-space-between">
							<span>{{ v.path === '/' ? $t('plugins.WorkshopPiHealth.health.sd_card_system_and_files') : v.path }}</span>
							<span><b>{{ fmt1(v.pct) }} %</b> &middot; {{ $t('plugins.WorkshopPiHealth.health.free_of_total', { free: fmtBytes(v.free), total: fmtBytes(v.total) }) }}</span>
						</div>
						<v-progress-linear :model-value="v.pct" :color="color(levelOf(v.pct, THRESHOLD.disk))" height="8" rounded />
					</div>
					<div class="text-body-small text-medium-emphasis mt-2 mb-2">{{ $t('plugins.WorkshopPiHealth.health.disk_hint', { alert: THRESHOLD.disk[0], limit: THRESHOLD.disk[1] }) }}</div>
					<detail-chart :history="S.disk" color="#26A69A" unit="%" :label="$t('plugins.WorkshopPiHealth.health.sd_in_use')" :limit="THRESHOLD.disk[1]" :limit-label="$t('plugins.WorkshopPiHealth.health.limit_lower')" :height="150" />
				</v-card>
			</v-col>
		</v-row>

		<!-- ===== Lo que mide WorkshopService (health_poller.py) ===== -->
		<div v-if="sbc && !sp" class="text-body-small text-medium-emphasis mt-2">
			{{ $t('plugins.WorkshopPiHealth.health.waiting_for_the_workshopservice_health') }}
		</div>
		<!-- service stopped (2026-10-10): healthPi stays with the last thing it
			     published; it is shown off and announced, not as if it were up to date -->
		<div v-if="sp && !pccRuns" class="text-body-small text-warning mt-2">
			{{ $t('plugins.WorkshopPiHealth.health.data_from_the_last_time_the') }}
		</div>
		<v-row v-if="sp" density="compact" class="mt-1" :style="pccRuns ? null : 'opacity: 0.45'">
			<!-- Alimentacion y rendimiento -->
			<v-col cols="12" md="6">
				<v-card variant="outlined" class="pa-3" :style="edge(levelVolt)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-title-large"><v-icon class="mr-1">mdi-flash</v-icon>{{ $t('plugins.WorkshopPiHealth.health.power_and_performance') }}</span>
						<v-chip size="small" :color="color(levelVolt)" variant="flat">{{ label(levelVolt) }}</v-chip>
					</div>
					<v-table density="compact" class="mt-2">
						<tbody>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.undervoltage') }}</td><td>
								<v-chip size="x-small" :color="thr.low_voltage_now ? 'error' : 'success'" variant="flat">{{ thr.low_voltage_now ? $t('plugins.WorkshopPiHealth.health.now_upper') : $t('plugins.WorkshopPiHealth.health.no') }}</v-chip>
								<span class="text-medium-emphasis ml-2">{{ $t('plugins.WorkshopPiHealth.health.since_boot') }} {{ thr.low_voltage_since_startup ? $t('plugins.WorkshopPiHealth.health.yes_there_was') : $t('plugins.WorkshopPiHealth.health.no') }}</span>
							</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.throttled_by_heat') }}</td><td>
								<v-chip size="x-small" :color="thr.limited_now || thr.limit_temp_now ? 'warning' : 'success'" variant="flat">{{ thr.limited_now || thr.limit_temp_now ? $t('plugins.WorkshopPiHealth.health.now_upper') : $t('plugins.WorkshopPiHealth.health.no') }}</v-chip>
								<span class="text-medium-emphasis ml-2">{{ $t('plugins.WorkshopPiHealth.health.since_boot') }} {{ thr.limited_since_startup || thr.limit_temp_since_startup ? $t('plugins.WorkshopPiHealth.health.yes_there_was') : $t('plugins.WorkshopPiHealth.health.no') }}</span>
							</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.cpu_speed') }}</td><td>{{ sp.cpu && sp.cpu.freq_mhz }} MHz</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.load_1_5_15_min') }}</td><td>{{ sp.cpu && sp.cpu.load ? sp.cpu.load.join(' / ') : '--' }} <span class="text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.4_cores_4_all_busy') }}</span></td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.clock') }}</td><td>{{ sp.clock_synchronized ? $t('plugins.WorkshopPiHealth.health.synchronized_internet_time') : $t('plugins.WorkshopPiHealth.health.not_synchronized') }}</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.last_restart') }}</td><td>
								{{ $t('plugins.WorkshopPiHealth.health.ago', { time: fmtUptime(sp.uptime_s) }) }}
								<span v-if="sp.restart" :class="sp.restart.ordenado ? 'text-medium-emphasis' : 'text-error'">
									&middot; {{ sp.restart.ordenado ? $t('plugins.WorkshopPiHealth.health.clean_shutdown') : $t('plugins.WorkshopPiHealth.health.no_clean_shutdown_last_data_at', { time: sp.restart.last_datum }) }}
								</span>
							</td></tr>
						</tbody>
					</v-table>
					<div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.undervoltage_the_system_s_power_supply') }}</div>
				</v-card>
			</v-col>

			<!-- Red / WiFi -->
			<v-col cols="12" md="6">
				<v-card variant="outlined" class="pa-3" :style="edge(levelWifi)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-title-large"><v-icon class="mr-1">mdi-wifi</v-icon>{{ $t('plugins.WorkshopPiHealth.health.network_wifi') }}</span>
						<v-chip size="small" :color="color(levelWifi)" variant="flat">{{ label(levelWifi) }}</v-chip>
					</div>
					<div class="my-1">
						<span class="text-headline-small">{{ wifi.connected ? (wifi.signal_pct + ' %') : $t('plugins.WorkshopPiHealth.health.disconnected') }}</span>
						<span v-if="wifi.dbm != null" class="text-medium-emphasis ml-2">{{ wifi.dbm }} dBm</span>
						<span class="ml-3">{{ wifi.ssid }}</span>
					</div>
					<div class="text-body-small text-medium-emphasis">
						{{ wifi.speed }} &middot; {{ $t('plugins.WorkshopPiHealth.health.channel_n', { n: wifi.channel }) }} &middot; IP {{ wifi.ip }} &middot; router {{ wifi.router }}
					</div>
					<div class="mt-2">
						<v-chip v-for="p in pings" :key="p.k" size="x-small" class="mr-1 mb-1" :color="p.ms == null ? 'error' : (p.ms > p.slow ? 'warning' : 'success')" variant="flat">
							{{ p.label }}: {{ p.ms == null ? $t('plugins.WorkshopPiHealth.health.not_responding') : p.ms + ' ms' }}
						</v-chip>
					</div>
					<detail-chart :history="S.wifi" color="#29B6F6" unit="%" :label="$t('plugins.WorkshopPiHealth.health.wifi_signal')" :height="130" class="mt-1" />
				</v-card>
			</v-col>

			<!-- Servicios -->
			<v-col cols="12" md="6">
				<v-card variant="outlined" class="pa-3" :style="edge(levelServ)">
					<div class="d-flex align-center justify-space-between">
						<span class="text-title-large"><v-icon class="mr-1">mdi-cogs</v-icon>{{ $t('plugins.WorkshopPiHealth.health.services') }}</span>
						<v-chip size="small" :color="color(levelServ)" variant="flat">{{ label(levelServ) }}</v-chip>
					</div>
					<v-table density="compact" class="mt-2">
						<tbody>
							<tr v-for="s in (sp.services || [])" :key="s.unit">
								<td>{{ s.name }}</td>
								<td><v-chip size="x-small" :color="s.active ? 'success' : 'error'" variant="flat">{{ s.active ? $t('plugins.WorkshopPiHealth.health.running') : s.state }}</v-chip></td>
								<td class="text-medium-emphasis text-body-small">{{ s.since ? $t('plugins.WorkshopPiHealth.health.since_time', { time: s.since.replace(/^\w+ /, '').replace(/ -\d+$/, '') }) : '' }}</td>
							</tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.kiosk_screen') }}</td><td><v-chip size="x-small" :color="sp.kiosk ? 'success' : 'warning'" variant="flat">{{ sp.kiosk ? $t('plugins.WorkshopPiHealth.health.open_f') : $t('plugins.WorkshopPiHealth.health.closed_f') }}</v-chip></td><td></td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.camera_port_8090') }}</td><td><v-chip size="x-small" :color="sp.red && sp.red.camera ? 'success' : 'warning'" variant="flat">{{ sp.red && sp.red.camera ? $t('plugins.WorkshopPiHealth.health.answers') : $t('plugins.WorkshopPiHealth.health.not_responding') }}</v-chip></td><td></td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.gcode_bridge_telnet') }}</td><td>{{ sp.bridge_clients == null ? '--' : (sp.bridge_clients ? $t('plugins.WorkshopPiHealth.health.n_programs_connected', { n: sp.bridge_clients }) : $t('plugins.WorkshopPiHealth.health.nobody_connected')) }}<div v-if="sp.bridge_programs && sp.bridge_programs.length" class="text-body-small text-medium-emphasis">{{ sp.bridge_programs.join(', ') }}</div></td><td class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.bridge_name_hint') }}</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.motor_data') }}</td><td>{{ sp.data && sp.data.motors_s != null ? $t('plugins.WorkshopPiHealth.health.s_ago', { n: sp.data.motors_s }) : '--' }}</td><td></td></tr>
						</tbody>
					</v-table>
				</v-card>
			</v-col>

			<!-- Duet + pantallas -->
			<v-col cols="12" md="6">
				<v-card variant="outlined" class="pa-3">
					<span class="text-title-large"><v-icon class="mr-1">mdi-chip</v-icon>{{ $t('plugins.WorkshopPiHealth.health.duet_and_screens') }}</span>
					<v-table density="compact" class="mt-2">
						<tbody>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.status') }}</td><td>{{ duet.state }} &middot; firmware {{ duet.firmware }}</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.main_board') }}</td><td>{{ fmt1(duet.mcu_temp_c) }} &deg;C &middot; {{ fmt1(duet.vin_v) }} V</td></tr>
							<tr v-for="p in (duet.boards || [])" :key="'p' + p.can"><td>{{ p.name }} <span class="text-medium-emphasis">(CAN {{ p.can }})</span></td><td>{{ p.state === 'unknown' && p.can === 0 ? $t('plugins.WorkshopPiHealth.health.main') : p.state }}</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.system_duet_retries_1_h') }}</td><td>{{ sp.reenvios_1h == null ? $t('plugins.WorkshopPiHealth.health.no_permission_to_read_the_log') : sp.reenvios_1h }}</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.devices_with_dwc_open') }}</td><td>
								{{ (screen.devices || []).length }}:
								<span v-for="(e, i) in (screen.devices || [])" :key="e.origin">{{ i ? ', ' : '' }}{{ e.origin }}<span v-if="e.sessions > 1" class="text-medium-emphasis"> {{ $t('plugins.WorkshopPiHealth.health.n_sessions_paren', { n: e.sessions }) }}</span></span>
								<div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.each_dwc_load_or_reload_opens') }}</div>
							</td></tr>
							<tr><td>{{ $t('plugins.WorkshopPiHealth.health.status_requests_per_minute') }}</td><td>{{ screen.status_per_min == null ? $t('plugins.WorkshopPiHealth.health.no_permission_to_read_the_log') : screen.status_per_min }}</td></tr>
						</tbody>
					</v-table>
					<div class="text-body-small text-medium-emphasis">
						{{ $t('plugins.WorkshopPiHealth.health.retries_and_requests_per_minute_come') }}<code>sudo usermod -aG systemd-journal dsf</code> {{ $t('plugins.WorkshopPiHealth.health.and_restart_the_system') }}
					</div>
				</v-card>
			</v-col>

			<!-- Service database (2026-10-10: "a state of the database that
				     is created; only shown if the database was created") -->
			<v-col v-if="base" cols="12" md="6">
				<v-card variant="outlined" class="pa-3" :style="edge(base.check === 'ok' ? 0 : 2)">
					<div class="d-flex align-center flex-wrap">
						<span class="text-title-large mr-2"><v-icon class="mr-1">mdi-database</v-icon>{{ $t('plugins.WorkshopPiHealth.health.database') }}</span>
						<v-chip size="x-small" variant="flat" :color="base.error ? 'grey' : (base.check === 'ok' ? 'success' : 'warning')">
							{{ base.error ? $t('plugins.WorkshopPiHealth.health.no_data') : (base.check === 'ok' ? $t('plugins.WorkshopPiHealth.health.healthy') : $t('plugins.WorkshopPiHealth.health.check')) }}
						</v-chip>
						<v-chip v-if="base.backup" size="x-small" variant="flat" class="ml-1" :color="respState.color">{{ respState.text }}</v-chip>
						<v-spacer />
						<v-btn v-if="hasService" size="x-small" variant="outlined" @click="configureBase"><v-icon size="x-small" start>mdi-cog-outline</v-icon>{{ $t('plugins.WorkshopPiHealth.health.configure_in_services') }}</v-btn>
					</div>
					<div v-if="base.error" class="text-body-small text-warning mt-1">{{ $t('plugins.WorkshopPiHealth.health.could_not_read', { error: base.error }) }}</div>
					<template v-else>
						<div class="text-body-small text-medium-emphasis">
							{{ $t('plugins.WorkshopPiHealth.health.database_hint') }}
						</div>
						<div class="d-flex flex-wrap mt-2" style="gap:6px 18px">
							<div><div class="text-title-large">{{ base.mb }} MB</div><div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.size') }}<template v-if="base.wal_mb"> {{ $t('plugins.WorkshopPiHealth.health.wal_mb_in_progress', { mb: base.wal_mb }) }}</template></div></div>
							<div><div class="text-title-large">{{ rowsTotal }}</div><div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.rows_stored') }}</div></div>
							<div><div class="text-title-large">{{ base.free_mb }} MB</div><div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.unused_space_inside') }}</div></div>
							<div><div class="text-title-large text-no-wrap">{{ hour(base.modified) }}</div><div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.last_write') }}</div></div>
							<div v-if="disk"><div class="text-title-large" :class="disk.free_gb < 2 ? 'text-warning' : ''">{{ disk.free_gb }} GB</div><div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.free_on_system_card', { pct: disk.free_pct }) }}</div></div>
						</div>
						<v-table density="compact" class="mt-2">
							<thead><tr><th>{{ $t('plugins.WorkshopPiHealth.health.what_it_stores') }}</th><th class="text-right">{{ $t('plugins.WorkshopPiHealth.health.rows') }}</th><th>{{ $t('plugins.WorkshopPiHealth.health.from') }}</th><th>{{ $t('plugins.WorkshopPiHealth.health.to') }}</th></tr></thead>
							<tbody>
								<tr v-for="tb in tablesVisible" :key="tb.name">
									<td>{{ nameTable(tb.name) }} <span class="text-medium-emphasis text-body-small">({{ tb.name }})</span></td>
									<td class="text-right">{{ tb.rows }}</td>
									<td class="text-no-wrap">{{ date(tb.since) }}</td>
									<td class="text-no-wrap">{{ date(tb.until) }}</td>
								</tr>
							</tbody>
						</v-table>
						<div class="text-body-small mt-2">
							<v-icon size="x-small">mdi-file-outline</v-icon> <code>{{ base.file }}</code>
						</div>
						<!-- backups (2026-10-11, request: "improve the database information in Health") -->
						<div v-if="resp && !resp.error" class="d-flex flex-wrap mt-2" style="gap:6px 18px">
							<div><div class="text-title-large text-no-wrap">{{ resp.last ? date(resp.last.date) : '--' }}</div><div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.last_backup') }}<template v-if="resp.last"> ({{ resp.last.mb }} MB)</template></div></div>
							<div><div class="text-title-large text-no-wrap">{{ !resp.active ? $t('plugins.WorkshopPiHealth.health.off') : (resp.next ? dateTs(resp.next) : $t('plugins.WorkshopPiHealth.health.soon')) }}</div><div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.next_backup') }}</div></div>
							<div><div class="text-title-large">{{ resp.amount || 0 }}</div><div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.backups_stored_mb', { mb: resp.mb_total || 0 }) }}</div></div>
							<div><div class="text-title-large">{{ resp.daily }} + {{ resp.weekly }}</div><div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.kept_daily_weekly') }}</div></div>
							<div v-if="resp.free_gb != null"><div class="text-title-large" :class="resp.free_gb < 1 ? 'text-warning' : ''">{{ resp.free_gb }} GB</div><div class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopPiHealth.health.free_where_they_re_stored') }}</div></div>
						</div>
						<div v-if="resp && resp.folder" class="text-body-small mt-1"><v-icon size="x-small">mdi-folder-outline</v-icon> {{ $t('plugins.WorkshopPiHealth.health.backups_in') }} <code>{{ resp.folder }}</code></div>
						<div v-if="resp && resp.failures && resp.failures.length" class="text-body-small text-error mt-1"><v-icon size="x-small" color="error">mdi-alert-circle</v-icon> {{ resp.failures[0].text || resp.failures[0] }}</div>
						<div v-if="resp && resp.mirror" class="text-body-small mt-1"><v-icon size="x-small">mdi-usb-flash-drive</v-icon> {{ $t('plugins.WorkshopPiHealth.health.copy_in') }} <code>{{ resp.mirror }}</code> ({{ resp.mirror_amount }})</div>
						<div v-else-if="resp && resp.same_card && resp.active" class="text-body-small text-warning mt-1"><v-icon size="x-small" color="warning">mdi-sd</v-icon> {{ $t('plugins.WorkshopPiHealth.health.the_database_and_its_backups_are') }}</div>
						<div v-if="resp && resp.per_delete && resp.per_delete.length" class="text-body-small text-warning mt-1">{{ $t('plugins.WorkshopPiHealth.health.n_backups_to_be_deleted', { n: resp.per_delete.length }) }}</div>
						<div v-if="base.backups && base.backups.length" class="text-body-small text-medium-emphasis mt-1">
							{{ $t('plugins.WorkshopPiHealth.health.copies_from_before_migrating') }} <span v-for="(r, i) in base.backups" :key="r.file">{{ i ? ', ' : '' }}{{ r.file }} ({{ r.mb }} MB, {{ date(r.date) }})</span>
						</div>
						<div v-if="rowsRare" class="text-body-small text-warning mt-1">
							<v-icon size="x-small" color="warning">mdi-alert</v-icon> {{ $t('plugins.WorkshopPiHealth.health.n_rows_bad_date', { n: rowsRare }) }}
						</div>
						<div v-if="base.dates_repaired" class="text-body-small text-medium-emphasis mt-1">{{ $t('plugins.WorkshopPiHealth.health.n_rows_date_repaired', { n: base.dates_repaired }) }}</div>
						<div v-if="base.check !== 'ok'" class="text-body-small text-warning mt-1">{{ $t('plugins.WorkshopPiHealth.health.sqlite_quick_check_gave', { result: base.check }) }}</div>
					</template>
				</v-card>
			</v-col>

			<!-- Alertas -->
			<v-col cols="12">
				<v-card variant="outlined" class="pa-3">
					<div class="d-flex align-center flex-wrap">
						<span class="text-title-large mr-3"><v-icon class="mr-1">mdi-bell-ring</v-icon>{{ $t('plugins.WorkshopPiHealth.health.phone_alerts') }}</span>
						<v-chip size="x-small" :color="notice.active ? 'success' : 'grey'" variant="flat" class="mr-1">{{ notice.active ? $t('plugins.WorkshopPiHealth.health.notifications_on') : $t('plugins.WorkshopPiHealth.health.notifications_off') }}</v-chip>
						<v-chip v-if="noticeMuted" size="x-small" color="warning" variant="flat">{{ $t('plugins.WorkshopPiHealth.health.muted_for_a_while') }}</v-chip>
					</div>
					<div class="text-body-small text-medium-emphasis mb-1">
						{{ $t(hasActivity ? 'plugins.WorkshopPiHealth.health.every_alert_is_also_logged_in' : 'plugins.WorkshopPiHealth.health.every_alert_is_also_logged_in_no_activity') }}
					</div>
					<v-row density="compact">
						<v-col v-for="a in ALERTS" :key="a.kind" cols="12" sm="6" md="4">
							<v-switch density="compact" color="primary" hide-details class="mt-1" :model-value="!!noticeKinds[a.kind]" :loading="changing === a.kind" :disabled="!atLeast('technician')" :label="a.label" @update:model-value="v => changeAlert(a.kind, v)" />
							<div class="text-body-small text-medium-emphasis ml-12">{{ a.detail(threshold) }}</div>
						</v-col>
					</v-row>
					<div v-if="!atLeast('technician')" class="text-body-small text-medium-emphasis mt-1">{{ $t('plugins.WorkshopPiHealth.health.alerts_read_only') }}</div>
					<error-notice :error="errorAlert" class="mt-1" />
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { i18n, modelPlugins, machineModel, pathExists } from './dwc-host.js'
import ServiceNotice from './ServiceNotice.vue'
import StartupPanel from './StartupPanel.vue' // start-up card (vue/_shared)
import PageHeader from './PageHeader.vue' // header of every page (vue/_shared)
import DetailChart from './DetailChart.vue' // vue/_shared
import ErrorNotice from './ErrorNotice.vue' // vue/_shared
import { rowsHealth } from './startup-rows.js'
import { api } from './workshop-api.js'
import { pluginOf, dataOf } from './workshop-ids.js' // Id nuevo o viejo del plugin
import { serviceTexts } from './service-text.js'
import { useRole } from './use-role.js' // what the role may do (vue/_shared)
import { RANGES, mergeAll } from './health-history.js' // history kept by the service + live samples
import { H, THRESHOLD } from './health-samples.js' // live samples, collected since the plugin loaded

const router = useRouter()
const { atLeast } = useRole()

// Alerts (health_poller.py in WorkshopService); they are turned on/off with the
// notifier's per-type switch (the same one as the Activity page).
const ALERTS = [
	{ kind: 'health_temp', label: i18n.t('plugins.WorkshopPiHealth.health.high_temperature'), detail: u => i18n.t('plugins.WorkshopPiHealth.health.alert_temp_detail', { c: u.temp_alert_c || 75, s: u.temp_sustained_s || 60 }) },
	{ kind: 'health_voltage', label: i18n.t('plugins.WorkshopPiHealth.health.undervoltage'), detail: () => i18n.t('plugins.WorkshopPiHealth.health.the_system_s_power_supply_doesn') },
	{ kind: 'health_wifi', label: i18n.t('plugins.WorkshopPiHealth.health.wifi_down'), detail: u => i18n.t('plugins.WorkshopPiHealth.health.alert_wifi_detail', { s: u.wifi_sustained_s || 60 }) },
	{ kind: 'health_service', label: i18n.t('plugins.WorkshopPiHealth.health.service_stopped'), detail: u => i18n.t('plugins.WorkshopPiHealth.health.alert_service_detail', { s: u.service_sustained_s || 30 }) },
	{ kind: 'health_restart', label: i18n.t('plugins.WorkshopPiHealth.health.unexpected_restart'), detail: () => i18n.t('plugins.WorkshopPiHealth.health.the_system_booted_without_a_clean') },
	{ kind: 'health_disk', label: i18n.t('plugins.WorkshopPiHealth.health.low_space_or_large_database'), detail: u => i18n.t('plugins.WorkshopPiHealth.health.alert_disk_detail', { gb: u.disk_alert_gb || 2, pct: u.disk_alert_pct || 10, mb: u.base_alert_mb || 200 }) }
]

const range = ref('1h')
const serverHist = ref(null)
const changing = ref(null)
const errorAlert = ref(null)
const startupWait = ref(false)

// what the charts draw: the history of the service (health.history) joined with this browser's live samples; with an old service
// (no health.history) only the live samples, as before
const S = computed(() => {
	const sh = serverHist.value
	return mergeAll(sh ? sh.series : null, H, sh ? sh.step_s * 1000 : 0)
})

const sbc = computed(() => machineModel().sbc || null)
const servicePlugin = computed(() => pluginOf(modelPlugins(), 'service'))
// the texts of the service (service names, screens) come as {key, params}: shown in the language of this DWC
const sp = computed(() => serviceTexts(dataOf(servicePlugin.value, 'healthPi') || null))
const pccRuns = computed(() => !!(servicePlugin.value && servicePlugin.value.pid > 0))
const noticeState = computed(() => serviceTexts(dataOf(servicePlugin.value, 'notifications') || null))

// start-up card: what this board lets the page read (a Duet alone, a Pi without WiFi or another SBC are grey)
const rowsStartup = computed(() => {
	const d = sp.value
	return rowsHealth({
		sbc: !!sbc.value,
		data: !!d,
		waitExpired: startupWait.value,
		vcgencmd: !!(d && d.throttled),
		wifi: !!(d && d.wifi && d.wifi.connected),
		routerMs: d && d.red ? d.red.router_ms : undefined,
		services: d && Array.isArray(d.services) ? d.services : null
	})
})
// other plugins' pages: what points to them shows only when they are there
const hasActivity = computed(() => pathExists(router, '/Plugins/Activity'))
const hasService = computed(() => pathExists(router, '/Plugins/WorkshopService'))

const thr = computed(() => (sp.value && sp.value.throttled) || {})
const wifi = computed(() => (sp.value && sp.value.wifi) || {})
const duet = computed(() => (sp.value && sp.value.duet) || {})
const screen = computed(() => (sp.value && sp.value.screens) || {})
// only if the database exists (the reader sends null if it has not been created yet)
const base = computed(() => (sp.value && sp.value.base) || null)
const resp = computed(() => (base.value && base.value.backup) || null)
const disk = computed(() => (sp.value && sp.value.disk) || null)
const respState = computed(() => {
	const r = base.value && base.value.backup
	if (!r) return { text: '', color: 'grey' }
	if (!r.active) return { text: i18n.t('plugins.WorkshopPiHealth.health.backups_off'), color: 'grey' }
	if (r.failures && r.failures.length) return { text: i18n.t('plugins.WorkshopPiHealth.health.backups_failing'), color: 'error' }
	if (r.late) return { text: i18n.t('plugins.WorkshopPiHealth.health.backup_overdue'), color: 'orange-darken-2' }
	if (!r.last) return { text: i18n.t('plugins.WorkshopPiHealth.health.first_backup_pending'), color: 'blue' }
	return { text: i18n.t('plugins.WorkshopPiHealth.health.backups_on'), color: 'success' }
})
// the presets table is no longer used: it stays in the database but is not shown
const tablesVisible = computed(() => ((base.value && base.value.tables) || []).filter(x => x.name !== 'presets'))
const rowsRare = computed(() => ((base.value && base.value.tables) || []).reduce((s, x) => s + (x.date_odd || 0), 0))
const rowsTotal = computed(() => ((base.value && base.value.tables) || []).reduce((s, x) => s + (x.rows || 0), 0))
const threshold = computed(() => (sp.value && sp.value.thresholds) || {})
const notice = computed(() => (noticeState.value && noticeState.value.config) || {})
const noticeKinds = computed(() => notice.value.kinds || {})
const noticeMuted = computed(() => !!(noticeState.value && noticeState.value.muted))
const pings = computed(() => {
	const r = (sp.value && sp.value.red) || {}
	return [
		{ k: 'r', label: 'router', ms: r.router_ms, slow: 50 },
		{ k: 'i', label: 'internet', ms: r.internet_ms, slow: 200 },
		{ k: 'm', label: i18n.t('plugins.WorkshopPiHealth.health.tuya_meter'), ms: r.meter_ms, slow: 300 },
		{ k: 'a', label: i18n.t('plugins.WorkshopPiHealth.health.alerts_ntfy'), ms: r.notices_ms, slow: 1500 }
	].filter(p => p.ms !== undefined)
})
const levelVolt = computed(() => {
	if (!sp.value || !sp.value.throttled) { return 'sin' }
	if (thr.value.low_voltage_now) { return 'limit' }
	if (thr.value.limited_now || thr.value.limit_temp_now || thr.value.low_voltage_since_startup || thr.value.limited_since_startup) { return 'alert' }
	return 'ok'
})
const levelWifi = computed(() => {
	if (!sp.value) { return 'sin' }
	if (!wifi.value.connected || (sp.value.red && sp.value.red.router_ms === null)) { return 'limit' }
	return wifi.value.signal_pct != null && wifi.value.signal_pct < 40 ? 'alert' : 'ok'
})
const levelServ = computed(() => {
	if (!sp.value || !sp.value.services) { return 'sin' }
	if (sp.value.services.some(s => !s.active)) { return 'limit' }
	return sp.value.kiosk === false || (sp.value.red && sp.value.red.camera === false) ? 'alert' : 'ok'
})
const cpuPct = computed(() => (sbc.value && sbc.value.cpu ? sbc.value.cpu.avgLoad : null))
const temp = computed(() => (sbc.value && sbc.value.cpu ? sbc.value.cpu.temperature : null))
const ramUsed = computed(() => {
	const mem = sbc.value && sbc.value.memory
	return mem && mem.total ? mem.total - mem.available : null
})
const ramPct = computed(() => {
	const mem = sbc.value && sbc.value.memory
	return mem && mem.total ? ramUsed.value / mem.total * 100 : null
})
const disks = computed(() => (machineModel().volumes || [])
	.filter(v => v && v.mounted && v.capacity)
	.map(v => ({ path: v.path, total: v.capacity, free: v.freeSpace, pct: (v.capacity - v.freeSpace) / v.capacity * 100 })))
const levelCpu = computed(() => levelOf(cpuPct.value, THRESHOLD.cpu))
const levelTemp = computed(() => levelOf(temp.value, THRESHOLD.temp))
const levelRam = computed(() => levelOf(ramPct.value, THRESHOLD.ram))
const levelDisk = computed(() => {
	const root = disks.value.find(v => v.path === '/')
	return levelOf(root ? root.pct : null, THRESHOLD.disk)
})
// what the page header counts: each reading the page grades ('limit' = fault, 'alert' = attention)
const headerReasons = computed(() => [['volt', levelVolt.value], ['wifi', levelWifi.value], ['serv', levelServ.value], ['cpu', levelCpu.value], ['temp', levelTemp.value], ['ram', levelRam.value], ['disk', levelDisk.value]]
	.filter(x => x[1] === 'limit' || x[1] === 'alert')
	.map(x => ({ level: x[1] === 'limit' ? 'error' : 'warn', text: i18n.t('plugins.WorkshopPiHealth.health.reason_' + x[0]) })))

let alive = true
let heartbeatTimer = null
let startupTimer = null
onMounted(() => {
	// Heartbeat (DCS load, 2026-10-12): WorkshopService reads the health and services data at full speed only while this page is
	// visible; without a heartbeat for 30 s it slows down (dsf/viewers.py). Same pattern as the
	// trace view (src/_zones/47-job.js): every 10 s, only if the tab and the page are visible.
	heartbeatTimer = setInterval(heartbeat, 10000)
	heartbeat()
	loadHistory()
	startupTimer = setTimeout(() => { startupWait.value = true }, 20000) // start-up card: data should be here by now
})
onBeforeUnmount(() => {
	alive = false
	clearInterval(heartbeatTimer)
	clearTimeout(startupTimer)
})
watch(range, () => loadHistory())

// health.history: an old service answers unknown_op (or refuses the call): then nothing changes, the charts are the live ones
async function loadHistory() {
	try {
		const r = await api('health.history', { range: range.value, limit: 300 })
		serverHist.value = r && r.series ? r : null
	} catch (e) {
		if (!serverHist.value || (e && e.code === 'unknown_op')) serverHist.value = null
	}
}
function heartbeat() {
	if (document.hidden || !alive) return
	api('view.heartbeat', { topic: 'health' }).catch(() => {})
}
function nameTable(n) {
	return ({ activity: i18n.t('plugins.WorkshopPiHealth.health.activity_jobs_modes_alerts'), consumption: i18n.t('plugins.WorkshopPiHealth.health.energy_meter_readings'), commands: i18n.t('plugins.WorkshopPiHealth.health.received_commands') })[n] || n
}
// "2026-10-10T22:51:03" -> "10/10 22:51"
function date(ts) {
	const s = String(ts || '')
	return s.length >= 16 ? s.slice(8, 10) + '/' + s.slice(5, 7) + ' ' + s.slice(11, 16) : '-'
}
// seconds since 1970 (like the backups' "next") -> dd/mm hh:mm
function dateTs(ts) {
	const d = new Date(Number(ts) * 1000)
	if (isNaN(d)) return '-'
	const p = n => String(n).padStart(2, '0')
	return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function hour(ts) {
	const s = String(ts || '')
	const today = new Date()
	const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
	return s.slice(0, 10) === d ? s.slice(11, 16) : date(s)
}
async function changeAlert(kind, v) {
	changing.value = kind
	errorAlert.value = null
	try {
		await api('notifications.type', { type: kind, on: !!v })
	} catch (e) {
		errorAlert.value = e
	}
	changing.value = null
}
// Configuration lives only in the Services page (card svc-base)
function configureBase() {
	router.push({ path: '/Plugins/WorkshopService', query: { anchor: 'svc-base' } }).catch(() => {})
}
function levelOf(v, u) {
	if (v == null || !isFinite(v)) {
		return 'sin'
	}
	return v >= u[1] ? 'limit' : v >= u[0] ? 'alert' : 'ok'
}
function color(n) {
	return { ok: 'success', alert: 'warning', limit: 'error', sin: 'grey' }[n]
}
function label(n) {
	return { ok: 'OK', alert: i18n.t('plugins.WorkshopPiHealth.health.alert'), limit: i18n.t('plugins.WorkshopPiHealth.health.limit'), sin: i18n.t('plugins.WorkshopPiHealth.health.no_data') }[n]
}
// the state of a block is the dot and the word of its chip, not a colored edge of the card (family.css)
function edge() {
	return ''
}
function fmt1(v) {
	return v == null || !isFinite(v) ? '--' : (Math.round(v * 10) / 10).toString()
}
function fmtBytes(b) {
	if (b == null || !isFinite(b)) {
		return '--'
	}
	const gb = b / 1073741824
	return gb >= 1 ? gb.toFixed(1) + ' GB' : (b / 1048576).toFixed(0) + ' MB'
}
function fmtUptime(s) {
	if (s == null) {
		return '--'
	}
	s = Math.floor(s)
	const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
	return (d ? d + ' d ' : '') + (d || h ? h + ' h ' : '') + m + ' min'
}
</script>
