import * as utils from '@iobroker/adapter-core';
import { NextcloudApiClient } from './lib/nextcloudApi';
import { words } from './lib/words';

interface AdapterConfig extends ioBroker.AdapterConfig {
	domain: string;
	token: string;
	skipApps: boolean;
	skipUpdate: boolean;
	interval: number;
}

class NextcloudMonitoring extends utils.Adapter {
	private apiClient: NextcloudApiClient | undefined;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({ ...options, name: 'nextcloud-monitoring' });
		this.on('ready', this.onReady.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Initialisiert den Adapter und erstellt den API-Client.
	 */
	private async onReady(): Promise<void> {
		const config = this.config as AdapterConfig;

		if (!config.domain || !config.token) {
			this.log.error('Konfiguration unvollständig: Domain oder Token fehlt!');
			return;
		}

		const activeToken = config.token.trim();
		this.log.info(`Debug: Token-Länge ist ${activeToken.length} Zeichen.`);

		this.apiClient = new NextcloudApiClient(config.domain, activeToken, config.skipApps, config.skipUpdate);

		await this.updateNextcloudData();
		const interval = (config.interval || 10) * 60 * 1000;
		this.setInterval(() => this.updateNextcloudData(), interval);
	}

	/**
	 * Hauptfunktion zum Abrufen und Verarbeiten aller Datenpunkte aus der API.
	 */
	private async updateNextcloudData(): Promise<void> {
		try {
			if (!this.apiClient) {
				return;
			}
			const response = await this.apiClient.fetchData();

			if (!response?.ocs?.data) {
				this.log.warn('Unerwartete API-Antwort von Nextcloud');
				return;
			}

			const data = response.ocs.data;
			const nc = data.nextcloud;

			// --- 1. SYSTEM & HARDWARE ---
			if (nc?.system) {
				const sys = nc.system;
				await this.setAndCreateState('system.version', 'Version', sys.version, 'string');
				await this.setAndCreateState('system.cpuload_1', 'CPU Load 1min', sys.cpuload[0], 'number');
				await this.setAndCreateState('system.cpuload_5', 'CPU Load 5min', sys.cpuload[1], 'number');
				await this.setAndCreateState('system.cpuload_15', 'CPU Load 15min', sys.cpuload[2], 'number');
				await this.setAndCreateState('system.cpunum', 'CPU Cores', sys.cpunum, 'number');
				await this.setAndCreateState(
					'system.mem_total',
					'RAM Total',
					this.apiClient.formatValue(sys.mem_total, true),
					'string',
				);
				await this.setAndCreateState(
					'system.mem_free',
					'RAM Free',
					this.apiClient.formatValue(sys.mem_free, true),
					'string',
				);
				await this.setAndCreateState(
					'system.swap_total',
					'Swap Total',
					this.apiClient.formatValue(sys.swap_total, true),
					'string',
				);
				await this.setAndCreateState(
					'system.freespace',
					'Free Disk Space',
					this.apiClient.formatValue(sys.freespace),
					'string',
				);
				await this.setAndCreateState(
					'system.memcache_local',
					'Memcache Local',
					sys['memcache.local'],
					'string',
				);
				await this.setAndCreateState(
					'system.memcache_locking',
					'Memcache Locking',
					sys['memcache.locking'],
					'string',
				);

				if (sys.apps) {
					await this.setAndCreateState(
						'apps.num_installed',
						'Installed Apps',
						sys.apps.num_installed,
						'number',
					);
					await this.setAndCreateState(
						'apps.updates_available',
						'Updates available',
						sys.apps.num_updates_available,
						'number',
					);
				}
				if (sys.update) {
					await this.setAndCreateState(
						'apps.update_available',
						'System Update available',
						sys.update.available,
						'boolean',
					);
					await this.setAndCreateState(
						'apps.last_update_check',
						'Last Update Check',
						new Date(sys.update.lastupdatedat * 1000).toLocaleString(),
						'string',
					);
				}
			}

			// --- 2. STORAGE & USERS ---
			if (nc?.storage) {
				const st = nc.storage;
				await this.setAndCreateState('storage.num_users', 'Total Users', st.num_users, 'number');
				await this.setAndCreateState('storage.num_files', 'Total Files', st.num_files, 'number');
				await this.setAndCreateState('storage.num_storages', 'Total Storages', st.num_storages, 'number');
				await this.setAndCreateState(
					'storage.num_files_appdata',
					'Appdata Files',
					st.num_files_appdata,
					'number',
				);
			}

			// --- 3. SHARES (FREIGABEN) ---
			if (nc?.shares) {
				const sh = nc.shares;
				await this.setAndCreateState('shares.num_shares', 'Total Shares', sh.num_shares, 'number');
				await this.setAndCreateState('shares.num_shares_link', 'Link Shares', sh.num_shares_link, 'number');
				await this.setAndCreateState('shares.num_shares_room', 'Talk Rooms', sh.num_shares_room, 'number');
				await this.setAndCreateState(
					'shares.num_fed_shares_sent',
					'Federated Sent',
					sh.num_fed_shares_sent,
					'number',
				);
			}

			// --- 4. SERVER, PHP & DATABASE ---
			if (data.server) {
				const srv = data.server;
				await this.setAndCreateState('server.webserver', 'Webserver Type', srv.webserver, 'string');

				if (srv.php) {
					await this.setAndCreateState('server.php.version', 'PHP Version', srv.php.version, 'string');
					await this.setAndCreateState(
						'server.php.memory_limit',
						'PHP Memory Limit',
						this.apiClient.formatValue(srv.php.memory_limit),
						'string',
					);
					await this.setAndCreateState(
						'server.php.upload_max',
						'Max Upload Size',
						this.apiClient.formatValue(srv.php.upload_max_filesize),
						'string',
					);

					if (srv.php.opcache) {
						await this.setAndCreateState(
							'server.php.opcache_hit_rate',
							'Opcache Hit Rate',
							`${srv.php.opcache.opcache_statistics.opcache_hit_rate.toFixed(2)}%`,
							'string',
						);
						await this.setAndCreateState(
							'server.php.opcache_used_mem',
							'Opcache RAM used',
							this.apiClient.formatValue(srv.php.opcache.memory_usage.used_memory),
							'string',
						);
					}
					if (srv.php.fpm) {
						const fpm = srv.php.fpm;
						await this.setAndCreateState(
							'fpm.active_processes',
							'FPM Active Processes',
							fpm['active-processes'],
							'number',
						);
						await this.setAndCreateState(
							'fpm.total_processes',
							'FPM Total Processes',
							fpm['total-processes'],
							'number',
						);
						await this.setAndCreateState(
							'fpm.idle_processes',
							'FPM Idle Processes',
							fpm['idle-processes'],
							'number',
						);
						await this.setAndCreateState(
							'fpm.accepted_conn',
							'FPM Accepted Conn',
							fpm['accepted-conn'],
							'number',
						);
						await this.setAndCreateState(
							'fpm.max_active',
							'FPM Max Active',
							fpm['max-active-processes'],
							'number',
						);
					}
					if (srv.php.apcu) {
						const apcu = srv.php.apcu.cache;
						await this.setAndCreateState('cache.apcu_entries', 'APCu Entries', apcu.num_entries, 'number');
						await this.setAndCreateState(
							'cache.apcu_mem_size',
							'APCu Cache Size',
							this.apiClient.formatValue(apcu.mem_size),
							'string',
						);
						await this.setAndCreateState('cache.apcu_hits', 'APCu Hits', apcu.num_hits, 'number');
					}
				}

				if (srv.database) {
					await this.setAndCreateState('server.database.type', 'DB Type', srv.database.type, 'string');
					await this.setAndCreateState(
						'server.database.version',
						'DB Version',
						srv.database.version,
						'string',
					);
					await this.setAndCreateState(
						'server.database.size',
						'DB Size',
						this.apiClient.formatValue(srv.database.size),
						'string',
					);
				}
			}

			// --- 5. AKTIVE NUTZER ---
			if (nc?.activeUsers) {
				const au = nc.activeUsers;
				await this.setAndCreateState('activeUsers.last5min', 'Active Users (5 min)', au.last5minutes, 'number');
				await this.setAndCreateState('activeUsers.last1h', 'Active Users (1 h)', au.last1hour, 'number');
				await this.setAndCreateState('activeUsers.last24h', 'Active Users (24 h)', au.last24hours, 'number');
				await this.setAndCreateState(
					'activeUsers.last1month',
					'Active Users (1 month)',
					au.last1month,
					'number',
				);
			}

			this.log.info('Monitoring: Alle verfügbaren API-Daten wurden eingelesen.');
		} catch (error: any) {
			// PRÜFUNG AUF WARTUNGSMODUS (Status 503)
			if (error.response && error.response.status === 503) {
				this.log.info('Nextcloud befindet sich im Wartungsmodus (Maintenance). Abfrage übersprungen.');
			} else {
				this.log.error(`Fehler beim Einlesen der API-Daten: ${error.message}`);
			}
		}
	}

	/**
	 * Erstellt ein Objekt, falls es nicht existiert, und setzt den Wert.
	 *
	 * @param id Die ID des zu erstellenden Datenpunktes.
	 * @param nameKey Der Key für die Übersetzung in der words.ts.
	 * @param value Der Wert, der gespeichert werden soll.
	 * @param type Der Datentyp des Wertes.
	 */
	private async setAndCreateState(id: string, nameKey: string, value: any, type: ioBroker.CommonType): Promise<void> {
		const translatedName = words[nameKey] || nameKey;

		await this.setObjectNotExistsAsync(id, {
			type: 'state',
			common: { name: translatedName, type, role: 'value', read: true, write: false },
			native: {},
		});
		await this.setState(id, { val: value, ack: true });
	}

	/**
	 * Wird beim Stoppen des Adapters aufgerufen.
	 *
	 * @param callback Funktion, die nach dem Entladen aufgerufen werden muss.
	 */
	private onUnload(callback: () => void): void {
		callback();
	}
}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new NextcloudMonitoring(options);
} else {
	(() => new NextcloudMonitoring())();
}
