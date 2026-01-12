import axios from 'axios';

/**
 * Client für die Nextcloud OCS API Kommunikation.
 */
export class NextcloudApiClient {
	/**
	 * @param domain Die URL der Nextcloud Instanz.
	 * @param token Das App-Passwort (NC-Token).
	 * @param skipApps Ob Apps übersprungen werden sollen.
	 * @param skipUpdate Ob Updates übersprungen werden sollen.
	 */
	constructor(
		private domain: string,
		private token: string,
		private skipApps: boolean,
		private skipUpdate: boolean,
	) {}

	/**
	 * Formatiert Rohwerte in MB oder GB.
	 *
	 * @param value Der Wert, der gespeichert werden soll
	 * @param isKilobytes ob es Kilobytes sind
	 */
	public formatValue(value: any, isKilobytes = false): string {
		const numericValue = typeof value === 'string' ? parseFloat(value) : value;
		if (isNaN(numericValue) || numericValue <= 0) {
			return '0 MB';
		}
		const bytes = isKilobytes ? numericValue * 1024 : numericValue;
		const mb = bytes / (1024 * 1024);
		return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
	}

	/**
	 * Holt die Monitoring-Daten von der API.
	 */
	public async fetchData(): Promise<any> {
		const cleanDomain = this.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
		const url = `https://${cleanDomain}/ocs/v2.php/apps/serverinfo/api/v1/info?format=json&skipApps=${this.skipApps}&skipUpdate=${this.skipUpdate}`;

		const response = await axios.get(url, {
			headers: {
				'OCS-APIRequest': 'true',
				'NC-Token': this.token,
				Accept: 'application/json',
			},
			timeout: 10000,
		});

		return response.data;
	}
}
