
![Logo](admin/nextcloud_monitoring.png)
# ioBroker.nextcloud_monitoring

[![NPM version](https://img.shields.io/npm/v/iobroker.nextcloud_monitoring.svg)](https://www.npmjs.com/package/iobroker.nextcloud_monitoring)
[![Downloads](https://img.shields.io/npm/dm/iobroker.nextcloud_monitoring.svg)](https://www.npmjs.com/package/iobroker.nextcloud_monitoring)
![Number of Installations](https://iobroker.live/badges/nextcloud_monitoring-installed.svg)

[![NPM](https://nodei.co/npm/iobroker.nextcloud_monitoring.png?downloads=true)](https://nodei.co/npm/iobroker.nextcloud_monitoring/)

**Tests:**  ![Test and Release](https://github.com/H5N1v2/iobroker.nextcloud_monitoring/workflows/Test%20and%20Release/badge.svg)

# nextcloud_monitoring adapter for ioBroker

## Description
This adapter allows for detailed monitoring of your Nextcloud instance via the official OCS API (`serverinfo`). It provides numerous system data, user statistics, shares, as well as performance values from PHP (OPcache/FPM) and the database directly in ioBroker.

## Features
* **System Status:** CPU load, RAM usage, free disk space, and Nextcloud version.
* **User Statistics:** Number of active users (5 min, 1 hr, 24 hr), total number of files, and storage usage.
* **Shares:** Monitoring of link shares, Talk rooms, and federated shares.
* **Server Health:** PHP version, memory limit, OPcache hit rate, and detailed FPM process statistics.

---

## Installation & Configuration

### 1. Connection Settings
* **Domain:** Enter your Nextcloud domain without `https://` (e.g., `cloud.yourdomain.com`).
* **Token:** The OCS API token of your Nextcloud (see section "How-To: Token").
* **Update Interval:** Time in minutes between API requests (Default: 10 min, Minimum: 5 min).

### 2. Data Options
* **Skip Apps:** Disables the detailed list of installed apps to reduce API load.
* **Skip Update Check:** Disables checking for new Nextcloud versions.

---

# How-To: Create & Set Token

Accessing the `serverinfo` API requires a valid API token. This token must be stored directly in the Nextcloud configuration.

### Generate the Token (Linux / Windows)
To enable access, you must generate a token (a random string) and register it in your Nextcloud instance using the `occ` tool.

**Command to generate the token:**
* **Linux (Terminal):** 

`openssl rand -hex 32`
* **Windows (PowerShell):** 

`$bytes = New-Object Byte[] 32; (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [System.BitConverter]::ToString($bytes).Replace("-", "").ToLower()`

* Alternatively, you can use online tools such as 

[it-tools.tech/token-generator](https://it-tools.tech/token-generator).*

# Set Token in Nextcloud
**Example for Linux (Standard path) in Terminal:**
```bash
sudo -u www-data php /var/www/nextcloud/occ config:app:set serverinfo token --value YOUR_GENERATED_TOKEN
```
Command for Windows (PowerShell/CMD): Navigate to your Nextcloud directory and execute:

`php occ config:app:set serverinfo token --value YOUR_GENERATED_TOKEN`

Monitored Data Points (Excerpt)

| Path | Description | Data Type |
| :--- | :--- | :--- |
| `system.version` | Installed Nextcloud version | string |
| `system.cpuload_1` | CPU load of the last minute | number |
| `system.freespace` | Free disk space | string |
| `storage.num_users` | Total number of users | number |
| `server.php.opcache_hit_rate` | Efficiency of the PHP cache | string |
| `fpm.active_processes` | Active PHP-FPM processes | number |
| `activeUsers.last5min` | Users active in the last 5 minutes | number |

# Troubleshooting (FAQ)

### Invalid Domain: Enter the domain without a protocol.

    Correct: mycloud.com or mycloud.com/folder

    Incorrect: https://mycloud.com or http://mycloud.com/folder

### API delivers no data:

Ensure that the "Server Info" app (standard app) is enabled in your Nextcloud under "Apps". Without this app, the adapter cannot retrieve any data.

### Token Error:

Verify if the token was correctly saved in Nextcloud using:

`occ cofig:app:get serverinfo token`

### Maintenance Mode:

If your Nextcloud is in maintenance mode, the adapter will not be able to fetch data and will log an error. This is normal behavior as the API is disabled during maintenance.


Changelog
1.0.0

* Initial release.
* Multi-language support for object names (DE/EN/IT/ES/RU etc.).
* Support for OCS API Token.
* Integrated dynamic update interval.

### **WORK IN PROGRESS**
* (H5N1v2) initial release

---

## Support & Feedback

If you encounter any **bugs**, have **feature requests**, or want to suggest **improvements**, please feel free to open an **Issue** on GitHub. This helps to track the progress and helps other users with similar problems.

[👉 Open a new Issue here](https://github.com/H5N1v2/iobroker.nextcloud_monitoring/issues)

---

## License
MIT License

Copyright (c) 2026 H5N1v2 <h5n1@iknox.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.