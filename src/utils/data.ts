import { SelectableValue, toOption as toOptionFromData } from '@grafana/data';

const backWardToOption = (value: string) => ({ label: value, value } as SelectableValue<string>);

export const toOption = toOptionFromData ?? backWardToOption;
