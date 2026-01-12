"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var nextcloudApi_exports = {};
__export(nextcloudApi_exports, {
  NextcloudApiClient: () => NextcloudApiClient
});
module.exports = __toCommonJS(nextcloudApi_exports);
var import_axios = __toESM(require("axios"));
class NextcloudApiClient {
  /**
   * @param domain Die URL der Nextcloud Instanz.
   * @param token Das App-Passwort (NC-Token).
   * @param skipApps Ob Apps übersprungen werden sollen.
   * @param skipUpdate Ob Updates übersprungen werden sollen.
   */
  constructor(domain, token, skipApps, skipUpdate) {
    this.domain = domain;
    this.token = token;
    this.skipApps = skipApps;
    this.skipUpdate = skipUpdate;
  }
  /**
   * Formatiert Rohwerte in MB oder GB.
   *
   * @param value Der Wert, der gespeichert werden soll
   * @param isKilobytes ob es Kilobytes sind
   */
  formatValue(value, isKilobytes = false) {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numericValue) || numericValue <= 0) {
      return "0 MB";
    }
    const bytes = isKilobytes ? numericValue * 1024 : numericValue;
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
  }
  /**
   * Holt die Monitoring-Daten von der API.
   */
  async fetchData() {
    const cleanDomain = this.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const url = `https://${cleanDomain}/ocs/v2.php/apps/serverinfo/api/v1/info?format=json&skipApps=${this.skipApps}&skipUpdate=${this.skipUpdate}`;
    const response = await import_axios.default.get(url, {
      headers: {
        "OCS-APIRequest": "true",
        "NC-Token": this.token,
        Accept: "application/json"
      },
      timeout: 1e4
    });
    return response.data;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NextcloudApiClient
});
//# sourceMappingURL=nextcloudApi.js.map
