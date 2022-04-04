import { VariableModel } from '@grafana/data';
import { interpolateVariable } from './interpolateVariable';

describe('Interpolating variables', () => {
  describe('and value is a string', () => {
    it('should return an unquoted value', () => {
      expect(interpolateVariable('abc', ({} as unknown) as VariableModel)).toEqual('abc');
    });
  });
  describe('and value is a number', () => {
    it('should return an unquoted value', () => {
      expect(interpolateVariable(1000, ({} as unknown) as VariableModel)).toEqual(1000);
    });
  });
  describe('and value is an array of strings', () => {
    it('should return comma separated quoted values', () => {
      expect(interpolateVariable(['a', 'b', 'c'], ({} as unknown) as VariableModel)).toEqual("'a','b','c'");
    });
  });

  describe('and variable allows multi-value and is a string', () => {
    it('should return a quoted value', () => {
      expect(interpolateVariable('abc', ({ multi: true } as unknown) as VariableModel)).toEqual("'abc'");
    });
  });

  describe('and variable contains single quote', () => {
    it('should return a quoted value', () => {
      expect(interpolateVariable("a'bc", ({ multi: true } as unknown) as VariableModel)).toEqual("'a''bc'");
      expect(interpolateVariable("a'b'c", ({ multi: true } as unknown) as VariableModel)).toEqual("'a''b''c'");
    });
  });

  describe('and variable allows all and is a string', () => {
    it('should return a quoted value', () => {
      expect(interpolateVariable('abc', ({ includeAll: true } as unknown) as VariableModel)).toEqual("'abc'");
    });
  });
});
