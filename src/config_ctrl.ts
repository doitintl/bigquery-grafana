// @ts-nocheck
import { IJwt } from './types';
// import { isCombinedModifierFlagSet } from 'tslint';

export class BigQueryConfigCtrl {
  private static templateUrl = 'partials/config.html';
  public authenticationTypes: any[];
  public locations: any[];
  public inputDataValid: boolean;
  public jsonText: string;
  public validationErrors: string[] = [];
  private datasourceSrv: any;
  private current: any;
  private readonly defaultAuthenticationType: string;
  private readonly defaultFlatRateProject: string;
  private readonly defaultProcessingLocation: string;
  private queryPriority: { text: string; value: string }[];

  /** @ngInject */
  constructor(datasourceSrv) {
    this.defaultAuthenticationType = 'jwt';
    this.defaultFlatRateProject = undefined;
    this.defaultProcessingLocation = undefined;
    this.datasourceSrv = datasourceSrv;
    this.current.jsonData = this.current.jsonData || {};
    this.current.jsonData.authenticationType = this.current.jsonData.authenticationType
      ? this.current.jsonData.authenticationType
      : this.defaultAuthenticationType;
    if (this.current.jsonData.flatRateProject === undefined) {
      this.current.jsonData.flatRateProject = this.defaultFlatRateProject;
    }
    if (this.current.jsonData.processingLocations === undefined) {
      this.current.jsonData.processingLocations = this.defaultProcessingLocation;
    }
    if (
      !(
        this.current.jsonData.queryPriority &&
        this.current.jsonData.queryPriority.match(/\b^INTERACTIVE$\b|\b^BATCH$\b/i)
      )
    ) {
      this.current.jsonData.queryPriority = 'INTERACTIVE';
    }

    this.current.secureJsonData = this.current.secureJsonData || {};
    this.current.secureJsonFields = this.current.secureJsonFields || {};
    this.authenticationTypes = [
      { key: this.defaultAuthenticationType, value: 'Google JWT File' },
      { key: 'gce', value: 'GCE Default Service Account' },
    ];
    this.locations = [
      // Multi-regional locations
      { text: 'United States (US)', value: 'US' },
      { text: 'European Union (EU)', value: 'EU' },
      { text: 'Oregon (us-west1)', value: 'us-west1' },
      { text: 'Los Angeles (us-west2)', value: 'us-west2' },
      { text: 'Salt Lake City (us-west3)', value: 'us-west3' },
      { text: 'Las Vegas (us-west4)', value: 'us-west4' },
      { text: 'Iowa (us-central1)', value: 'us-central1' },
      { text: 'South Carolina (us-east1)', value: 'us-east1' },
      { text: 'Northern Virginia (us-east4)', value: 'us-east4' },
      {
        text: 'Montréal (northamerica-northeast1)',
        value: 'northamerica-northeast1',
      },
      { text: 'São Paulo (southamerica-east1)', value: 'southamerica-east1' },
      // Europe
      { text: 'Belgium (europe-west1)', value: 'europe-west1' },
      { text: 'Finland (europe-north1)', value: 'europe-north1' },
      { text: 'Frankfurt (europe-west3)', value: 'europe-west3' },
      { text: 'London (europe-west2)', value: 'europe-west2' },
      { text: 'Netherlands (europe-west4)', value: 'europe-west4' },
      { text: 'Zürich (europe-west6)', value: 'europe-west6' },
      // Asia Pacific
      { text: 'Hong Kong (asia-east2)', value: 'asia-east2' },
      { text: 'Jakarta (asia-southeast2)', value: 'asia-southeast2' },
      { text: 'Mumbai (asia-south1)', value: 'asia-south1' },
      { text: 'Osaka (asia-northeast2)', value: 'asia-northeast2' },
      { text: 'Seoul (asia-northeast3)', value: 'asia-northeast3' },
      { text: 'Singapore (asia-southeast1)', value: 'asia-southeast1' },
      { text: 'Sydney (australia-southeast1)', value: 'australia-southeast1' },
      { text: 'Taiwan (asia-east1)', value: 'asia-east1' },
      { text: 'Tokyo (asia-northeast1)', value: 'asia-northeast1' },
    ];
    this.queryPriority = [
      { text: 'INTERACTIVE', value: 'INTERACTIVE' },
      { text: 'BATCH', value: 'BATCH' },
    ];
  }

  public onUpload(json) {
    this.jsonText = '';
    if (this.validateJwt(json)) {
      this.save(json);
    }
  }

  public onPasteJwt(e) {
    try {
      const json = JSON.parse(e.originalEvent.clipboardData.getData('text/plain') || this.jsonText);
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
    this.jsonText = '';

    this.current.jsonData = {
      authenticationType: this.current.jsonData.authenticationType,
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
      this.validationErrors.push('Private key field missing in JWT file.');
    }

    if (!jwt.token_uri || jwt.token_uri.length === 0) {
      this.validationErrors.push('Token URI field missing in JWT file.');
    }

    if (!jwt.client_email || jwt.client_email.length === 0) {
      this.validationErrors.push('Client Email field missing in JWT file.');
    }

    if (!jwt.project_id || jwt.project_id.length === 0) {
      this.validationErrors.push('Project Id field missing in JWT file.');
    }

    if (this.validationErrors.length === 0) {
      this.inputDataValid = true;
      return true;
    }

    return false;
  }
}
