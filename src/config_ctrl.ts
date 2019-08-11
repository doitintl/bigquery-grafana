import { IJwt } from "./types";
import {isCombinedModifierFlagSet} from "tslint";

export class BigQueryConfigCtrl {
  private static templateUrl = "partials/config.html";
  public authenticationTypes: any[];
  public inputDataValid: boolean;
  public jsonText: string;
  public validationErrors: string[] = [];
  private datasourceSrv: any;
  private current: any;
  private readonly defaultAuthenticationType: string;
  private readonly defaultSendUsageData: boolean;

  /** @ngInject */
  constructor(datasourceSrv) {
    this.defaultAuthenticationType = "jwt";
    this.defaultSendUsageData = true;
    this.datasourceSrv = datasourceSrv;
    this.current.jsonData = this.current.jsonData || {};
    this.current.jsonData.authenticationType = this.current.jsonData
      .authenticationType
      ? this.current.jsonData.authenticationType
      : this.defaultAuthenticationType;
    if (this.current.jsonData.sendUsageData === undefined) {
      this.current.jsonData.sendUsageData = this.defaultSendUsageData;
    }
    this.current.secureJsonData = this.current.secureJsonData || {};
    this.current.secureJsonFields = this.current.secureJsonFields || {};
    this.authenticationTypes = [
      { key: this.defaultAuthenticationType, value: "Google JWT File" },
      { key: "gce", value: "GCE Default Service Account" }
    ];
  }

  public onUpload(json) {
    this.jsonText = "";
    if (this.validateJwt(json)) {
      this.save(json);
    }
  }

  public onPasteJwt(e) {
    try {
      const json = JSON.parse(
        e.originalEvent.clipboardData.getData("text/plain") || this.jsonText
      );
      if (this.validateJwt(json)) {
        this.save(json);
      }
    } catch (error) {
      this.resetValidationMessages();
      this.validationErrors.push(`Invalid json: ${error.message}`);
    }
  }

  public resetValidationMessages() {
    this.validationErrors = [];
    this.inputDataValid = false;
    this.jsonText = "";

    this.current.jsonData = {
      authenticationType: this.current.jsonData.authenticationType
    };
    this.current.secureJsonData = {};
    this.current.secureJsonFields = {};
  }

  private save(jwt: IJwt) {
    this.current.secureJsonData.privateKey = jwt.private_key;
    this.current.jsonData.tokenUri = jwt.token_uri;
    this.current.jsonData.clientEmail = jwt.client_email;
    this.current.jsonData.defaultProject = jwt.project_id;
  }

  private validateJwt(jwt: IJwt) {
    this.resetValidationMessages();
    if (!jwt.private_key || jwt.private_key.length === 0) {
      this.validationErrors.push("Private key field missing in JWT file.");
    }

    if (!jwt.token_uri || jwt.token_uri.length === 0) {
      this.validationErrors.push("Token URI field missing in JWT file.");
    }

    if (!jwt.client_email || jwt.client_email.length === 0) {
      this.validationErrors.push("Client Email field missing in JWT file.");
    }

    if (!jwt.project_id || jwt.project_id.length === 0) {
      this.validationErrors.push("Project Id field missing in JWT file.");
    }

    if (this.validationErrors.length === 0) {
      this.inputDataValid = true;
      return true;
    }

    return false;
  }
}
