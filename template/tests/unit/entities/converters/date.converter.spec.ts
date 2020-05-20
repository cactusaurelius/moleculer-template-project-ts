import { DateConverter } from '../../../../src/entities/converters/date.converter';

describe('Unit test date-converter', () => {
  let converter: DateConverter;
  beforeEach(() => {
    converter = new DateConverter();
  });
  describe('serialize', () => {
    it('new date', () => {
      const date = new Date();
      const result = converter.serialize(date);
      expect(result).toBeString().toMatch(/.*T.*/);
    });
    it('custom date', () => {
      const date = new Date('2020-01-22');
      const result = converter.serialize(date);
      expect(result)
        .toBeString()
        .toMatch(/2020-01-22T.*/);
    });
  });
  describe('deserialize', () => {
    it('date', () => {
      const date = '2020-02-25T05:06:07';
      const result = converter.deserialize(date);
      expect(result).toBeDefined().toBeDate();
      expect(result!.getFullYear()).toBe(2020);
      expect(result!.getDate()).toBe(25);
      expect(result!.getMonth()).toBe(1);
      expect(result!.getHours()).toBe(5);
      expect(result!.getMinutes()).toBe(6);
      expect(result!.getSeconds()).toBe(7);
    });
    it('empty', () => {
      const result = converter.deserialize(null);
      expect(result).toBeNull();
    });
  });
});
