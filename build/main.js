"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_nextcloudApi = require("./lib/nextcloudApi");
var import_words = require("./lib/words");
class NextcloudMonitoring extends utils.Adapter {
  updateInterval;
  constructor(options = {}) {
    super({ ...options, name: "nextcloud-monitoring" });
    this.on("ready", this.onReady.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  /**
   * Initialisiert den Adapter und startet die Abfragen für alle konfigurierten Server.
   */
  async onReady() {
    const config = this.config;
    if (!config.servers || !Array.isArray(config.servers) || config.servers.length === 0) {
      this.log.error("Konfiguration unvollst\xE4ndig: Keine Server in der Tabelle gefunden!");
      return;
    }
    await this.updateAllServers();
    const minutes = config.interval || 10;
    const intervalMs = minutes * 60 * 1e3;
    this.updateInterval = this.setInterval(async () => {
      await this.updateAllServers();
    }, intervalMs);
  }
  /**
   * Iteriert über alle Server in der Liste und führt die API-Abfrage aus.
   */
  async updateAllServers() {
    const config = this.config;
    for (const server of config.servers) {
      if (!server.domain || !server.token) {
        this.log.warn(`Server "${server.name || "Unbekannt"}" \xFCbersprungen: Domain oder Token fehlt.`);
        continue;
      }
      const cleanId = (server.name || server.domain).replace(this.FORBIDDEN_CHARS, "_").replace(/\s|\./g, "_");
      this.log.info(`Abfrage l\xE4uft f\xFCr: ${server.name} (${server.domain})`);
      const apiClient = new import_nextcloudApi.NextcloudApiClient(
        server.domain,
        server.token.trim(),
        config.skipApps,
        config.skipUpdate
      );
      await this.updateNextcloudData(cleanId, apiClient);
    }
  }
  /**
   * Hauptfunktion zum Abrufen und Verarbeiten aller Datenpunkte eines spezifischen Servers.
   *
   * @param serverId serverId The unique ID of the server used as the root folder in the object tree.
   * @param apiClient apiClient The instance of the NextcloudApiClient used to communicate with this specific server.
   */
  async updateNextcloudData(serverId, apiClient) {
    var _a;
    try {
      const response = await apiClient.fetchData();
      if (!((_a = response == null ? void 0 : response.ocs) == null ? void 0 : _a.data)) {
        this.log.warn(`Unerwartete API-Antwort von Nextcloud (${serverId})`);
        return;
      }
      const data = response.ocs.data;
      const nc = data.nextcloud;
      if (nc == null ? void 0 : nc.system) {
        const sys = nc.system;
        await this.setAndCreateState(
          `${serverId}.system.current_version`,
          "Current Version",
          sys.version,
          "string"
        );
        await this.setAndCreateState(`${serverId}.system.cpuload_1`, "CPU Load 1min", sys.cpuload[0], "number");
        await this.setAndCreateState(`${serverId}.system.cpuload_5`, "CPU Load 5min", sys.cpuload[1], "number");
        await this.setAndCreateState(
          `${serverId}.system.cpuload_15`,
          "CPU Load 15min",
          sys.cpuload[2],
          "number"
        );
        await this.setAndCreateState(`${serverId}.system.cpunum`, "CPU Cores", sys.cpunum, "number");
        await this.setAndCreateState(
          `${serverId}.system.mem_total`,
          "RAM Total",
          apiClient.formatValue(sys.mem_total, true),
          "string"
        );
        await this.setAndCreateState(
          `${serverId}.system.mem_free`,
          "RAM Free",
          apiClient.formatValue(sys.mem_free, true),
          "string"
        );
        await this.setAndCreateState(
          `${serverId}.system.swap_total`,
          "Swap Total",
          apiClient.formatValue(sys.swap_total, true),
          "string"
        );
        await this.setAndCreateState(
          `${serverId}.system.freespace`,
          "Free Disk Space",
          apiClient.formatValue(sys.freespace),
          "string"
        );
        await this.setAndCreateState(
          `${serverId}.system.memcache_local`,
          "Memcache Local",
          sys["memcache.local"],
          "string"
        );
        await this.setAndCreateState(
          `${serverId}.system.memcache_locking`,
          "Memcache Locking",
          sys["memcache.locking"],
          "string"
        );
        if (sys.apps) {
          await this.setAndCreateState(
            `${serverId}.apps.num_installed`,
            "Installed Apps",
            sys.apps.num_installed,
            "number"
          );
          await this.setAndCreateState(
            `${serverId}.apps.updates_available`,
            "App Updates available",
            sys.apps.num_updates_available,
            "number"
          );
          if (sys.apps.app_updates && typeof sys.apps.app_updates === "object") {
            const updateList = Object.entries(sys.apps.app_updates).map(([appName, version]) => `${String(appName)} = "${String(version)}"`).join(" & ");
            await this.setAndCreateState(
              `${serverId}.apps.new_updates_for_apps`,
              "New Updates for apps",
              updateList || "none",
              "string"
            );
          }
        }
        if (sys.update) {
          await this.setAndCreateState(
            `${serverId}.apps.update_available`,
            "System Update available",
            sys.update.available,
            "boolean"
          );
          await this.setAndCreateState(
            `${serverId}.apps.last_update_check`,
            "Last Update Check",
            new Date(sys.update.lastupdatedat * 1e3).toLocaleString(),
            "string"
          );
          await this.setAndCreateState(
            `${serverId}.apps.available_new_version`,
            "Available New Version",
            sys.update.available_version,
            "string"
          );
        }
      }
      if (nc == null ? void 0 : nc.storage) {
        const st = nc.storage;
        await this.setAndCreateState(`${serverId}.storage.num_users`, "Total Users", st.num_users, "number");
        await this.setAndCreateState(`${serverId}.storage.num_files`, "Total Files", st.num_files, "number");
        await this.setAndCreateState(
          `${serverId}.storage.num_storages`,
          "Total Storages",
          st.num_storages,
          "number"
        );
        await this.setAndCreateState(
          `${serverId}.storage.num_files_appdata`,
          "Appdata Files",
          st.num_files_appdata,
          "number"
        );
        await this.setAndCreateState(
          `${serverId}.storage.num_disabled_users`,
          "Num Disabled Users",
          st.num_disabled_users,
          "number"
        );
      }
      if (nc == null ? void 0 : nc.shares) {
        const sh = nc.shares;
        await this.setAndCreateState(`${serverId}.shares.num_shares`, "Total Shares", sh.num_shares, "number");
        await this.setAndCreateState(
          `${serverId}.shares.num_shares_link`,
          "Link Shares",
          sh.num_shares_link,
          "number"
        );
        await this.setAndCreateState(
          `${serverId}.shares.num_shares_room`,
          "Talk Rooms",
          sh.num_shares_room,
          "number"
        );
        await this.setAndCreateState(
          `${serverId}.shares.num_fed_shares_sent`,
          "Federated Sent",
          sh.num_fed_shares_sent,
          "number"
        );
      }
      if (data.server) {
        const srv = data.server;
        await this.setAndCreateState(`${serverId}.server.webserver`, "Webserver Type", srv.webserver, "string");
        if (srv.php) {
          await this.setAndCreateState(
            `${serverId}.server.php.version`,
            "PHP Version",
            srv.php.version,
            "string"
          );
          await this.setAndCreateState(
            `${serverId}.server.php.memory_limit`,
            "PHP Memory Limit",
            apiClient.formatValue(srv.php.memory_limit),
            "string"
          );
          await this.setAndCreateState(
            `${serverId}.server.php.upload_max`,
            "Max Upload Size",
            apiClient.formatValue(srv.php.upload_max_filesize),
            "string"
          );
          const opcache = srv.php.opcache || srv.opcache;
          if (opcache) {
            const stats = opcache.opcache_statistics;
            const mem = opcache.memory_usage;
            if (stats) {
              const hitRate = stats.opcache_hit_rate ? `${parseFloat(stats.opcache_hit_rate).toFixed(2)}%` : "0%";
              await this.setAndCreateState(
                `${serverId}.server.php.opcache.hit_rate`,
                "Opcache Hit Rate",
                hitRate,
                "string"
              );
            }
            if (mem) {
              await this.setAndCreateState(
                `${serverId}.server.php.opcache.used_mem`,
                "Opcache RAM used",
                apiClient.formatValue(mem.used_memory || 0),
                "string"
              );
            }
          }
          const apcu = srv.php.apcu || srv.apcu;
          if (apcu == null ? void 0 : apcu.cache) {
            await this.setAndCreateState(
              `${serverId}.server.php.apcu.entries`,
              "APCu Entries",
              apcu.cache.num_entries,
              "number"
            );
            await this.setAndCreateState(
              `${serverId}.server.php.apcu.mem_size`,
              "APCu Cache Size",
              apiClient.formatValue(apcu.cache.mem_size),
              "string"
            );
            await this.setAndCreateState(
              `${serverId}.server.php.apcu.hits`,
              "APCu Hits",
              apcu.cache.num_hits,
              "number"
            );
          }
        }
        if (srv.fpm) {
          const fpm = srv.fpm;
          await this.setAndCreateState(
            `${serverId}.server.fpm.active_processes`,
            "FPM Active Processes",
            fpm["active-processes"],
            "number"
          );
          await this.setAndCreateState(
            `${serverId}.server.fpm.total_processes`,
            "FPM Total Processes",
            fpm["total-processes"],
            "number"
          );
          await this.setAndCreateState(
            `${serverId}.server.fpm.idle_processes`,
            "FPM Idle Processes",
            fpm["idle-processes"],
            "number"
          );
          await this.setAndCreateState(
            `${serverId}.server.fpm.accepted_conn`,
            "FPM Accepted Conn",
            fpm["accepted-conn"],
            "number"
          );
          await this.setAndCreateState(
            `${serverId}.server.fpm.max_active`,
            "FPM Max Active",
            fpm["max-active-processes"],
            "number"
          );
        }
        if (srv.database) {
          await this.setAndCreateState(
            `${serverId}.server.database.type`,
            "DB Type",
            srv.database.type,
            "string"
          );
          await this.setAndCreateState(
            `${serverId}.server.database.version`,
            "DB Version",
            srv.database.version,
            "string"
          );
          await this.setAndCreateState(
            `${serverId}.server.database.size`,
            "DB Size",
            apiClient.formatValue(srv.database.size),
            "string"
          );
        }
      }
      if (data.activeUsers) {
        const au = data.activeUsers;
        await this.setAndCreateState(
          `${serverId}.activeUsers.last5min`,
          "Active Users (5 min)",
          au.last5minutes,
          "number"
        );
        await this.setAndCreateState(
          `${serverId}.activeUsers.last1h`,
          "Active Users (1 h)",
          au.last1hour,
          "number"
        );
        await this.setAndCreateState(
          `${serverId}.activeUsers.last24h`,
          "Active Users (24 h)",
          au.last24hours,
          "number"
        );
        await this.setAndCreateState(
          `${serverId}.activeUsers.last1month`,
          "Active Users (1 month)",
          au.last1month,
          "number"
        );
        await this.setAndCreateState(
          `${serverId}.activeUsers.last3month`,
          "Active Users (3 month)",
          au.last3months,
          "number"
        );
        await this.setAndCreateState(
          `${serverId}.activeUsers.last6month`,
          "Active Users (6 month)",
          au.last6months,
          "number"
        );
        await this.setAndCreateState(
          `${serverId}.activeUsers.lastyear`,
          "Active Users (Last Year)",
          au.lastyear,
          "number"
        );
      }
      this.log.debug(`Monitoring (${serverId}): Alle Daten erfolgreich aktualisiert.`);
    } catch (error) {
      if (error.response && error.response.status === 503) {
        this.log.info(`Nextcloud (${serverId}) befindet sich im Wartungsmodus (Maintenance).`);
      } else {
        this.log.error(`Fehler bei Server "${serverId}": ${error.message}`);
      }
    }
  }
  /**
   * Erstellt ein Objekt, falls es nicht existiert, und setzt den Wert.
   * Nutzt die Übersetzungstabelle für die Namen.
   *
   * @param id The ID of the state to be created (e.g., 'system.version').
   * @param nameKey The key for the translation in words.ts or the display name.
   * @param value The value to be stored (can be string, number, boolean, etc.).
   * @param type The ioBroker data type (e.g., 'string', 'number', 'boolean', 'array', 'object', 'mixed').
   */
  async setAndCreateState(id, nameKey, value, type) {
    const translatedName = import_words.words[nameKey] || nameKey;
    await this.setObjectNotExistsAsync(id, {
      type: "state",
      common: {
        name: translatedName,
        type,
        role: "value",
        read: true,
        write: false
      },
      native: {}
    });
    await this.setState(id, { val: value, ack: true });
  }
  /**
   * Wird beim Stoppen des Adapters aufgerufen.
   *
   * @param callback A function that must be called once the unloading process is finished.
   */
  onUnload(callback) {
    try {
      if (this.updateInterval) {
        this.clearInterval(this.updateInterval);
      }
      callback();
    } catch {
      callback();
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new NextcloudMonitoring(options);
} else {
  (() => new NextcloudMonitoring())();
}
//# sourceMappingURL=main.js.map
