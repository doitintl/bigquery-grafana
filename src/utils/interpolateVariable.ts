import _ from 'lodash';
import { VariableModel } from '@grafana/data';
import { quoteLiteral } from '../utils';

export function interpolateVariable(value: any, variable: VariableModel) {
  if (typeof value === 'string') {
    // @ts-ignore
    if (variable.multi || variable.includeAll) {
      return quoteLiteral(value);
    } else {
      return value;
    }
  }

  if (typeof value === 'number') {
    return value;
  }

  const quotedValues = _.map(value, (v) => {
    return quoteLiteral(v);
  });

  return quotedValues.join(',');
}
