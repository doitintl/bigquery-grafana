import { SelectableValue } from '@grafana/data';
import { GoogleAuthType, QueryFormat, QueryPriority } from './types';

export const GOOGLE_AUTH_TYPE_OPTIONS = [
  { label: 'Google JWT File', value: GoogleAuthType.JWT },
  { label: 'GCE Default Service Account', value: GoogleAuthType.GCE },
];

export const QUERY_FORMAT_OPTIONS = [
  { label: 'Time series', value: QueryFormat.Timeseries },
  { label: 'Table', value: QueryFormat.Table },
];

export const DEFAULT_REGION = 'US';

export const PROCESSING_LOCATIONS: Array<SelectableValue<string>> = [
  // Multi-regional locations
  { label: 'United States (US)', value: 'US' },
  { label: 'European Union (EU)', value: 'EU' },
  { label: 'Oregon (us-west1)', value: 'us-west1' },
  { label: 'Los Angeles (us-west2)', value: 'us-west2' },
  { label: 'Salt Lake City (us-west3)', value: 'us-west3' },
  { label: 'Las Vegas (us-west4)', value: 'us-west4' },
  { label: 'Iowa (us-central1)', value: 'us-central1' },
  { label: 'South Carolina (us-east1)', value: 'us-east1' },
  { label: 'Northern Virginia (us-east4)', value: 'us-east4' },
  {
    label: 'Montréal (northamerica-northeast1)',
    value: 'northamerica-northeast1',
  },
  { label: 'São Paulo (southamerica-east1)', value: 'southamerica-east1' },
  // Europe
  { label: 'Belgium (europe-west1)', value: 'europe-west1' },
  { label: 'Finland (europe-north1)', value: 'europe-north1' },
  { label: 'Frankfurt (europe-west3)', value: 'europe-west3' },
  { label: 'London (europe-west2)', value: 'europe-west2' },
  { label: 'Netherlands (europe-west4)', value: 'europe-west4' },
  { label: 'Zürich (europe-west6)', value: 'europe-west6' },
  // Asia Pacific
  { label: 'Hong Kong (asia-east2)', value: 'asia-east2' },
  { label: 'Jakarta (asia-southeast2)', value: 'asia-southeast2' },
  { label: 'Mumbai (asia-south1)', value: 'asia-south1' },
  { label: 'Osaka (asia-northeast2)', value: 'asia-northeast2' },
  { label: 'Seoul (asia-northeast3)', value: 'asia-northeast3' },
  { label: 'Singapore (asia-southeast1)', value: 'asia-southeast1' },
  { label: 'Sydney (australia-southeast1)', value: 'australia-southeast1' },
  { label: 'Taiwan (asia-east1)', value: 'asia-east1' },
  { label: 'Tokyo (asia-northeast1)', value: 'asia-northeast1' },
];

export const QUERY_PRIORITIES: Array<SelectableValue<QueryPriority>> = [
  { label: 'Interactive', value: QueryPriority.Interactive },
  { label: 'Batch', value: QueryPriority.Batch },
];
