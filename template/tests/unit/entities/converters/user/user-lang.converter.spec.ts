import { UserLangConverter } from '../../../../../src/entities/converters/user/user-lang.converter';
import { UserLang } from '../../../../../src/types';

describe('User lang converter', () => {
  let converter: UserLangConverter;
  beforeEach(() => {
    converter = new UserLangConverter();
  });
  describe('serialize', () => {
    it('ES lang', () => {
      const result = converter.serialize(UserLang.ES);
      expect(result).toBeDefined().toBeString().toBe('es');
    });
    it('CA lang', () => {
      const result = converter.serialize(UserLang.CA);
      expect(result).toBeDefined().toBeString().toBe('ca');
    });
    it('EN lang', () => {
      const result = converter.serialize(UserLang.EN);
      expect(result).toBeDefined().toBeString().toBe('en');
    });
    it('FR lang', () => {
      const result = converter.serialize(UserLang.FR);
      expect(result).toBeDefined().toBeString().toBe('fr');
    });
    it('IT lang', () => {
      const result = converter.serialize(UserLang.IT);
      expect(result).toBeDefined().toBeString().toBe('it');
    });
  });
  describe('deserialize', () => {
    it('es lang', () => {
      const result = converter.deserialize('es');
      expect(result).toBeDefined().toBe(UserLang.ES);
    });
    it('ca lang', () => {
      const result = converter.deserialize('ca');
      expect(result).toBeDefined().toBe(UserLang.CA);
    });
    it('en lang', () => {
      const result = converter.deserialize('en');
      expect(result).toBeDefined().toBe(UserLang.EN);
    });
    it('fr lang', () => {
      const result = converter.deserialize('fr');
      expect(result).toBeDefined().toBe(UserLang.FR);
    });
    it('it lang', () => {
      const result = converter.deserialize('it');
      expect(result).toBeDefined().toBe(UserLang.IT);
    });
    it('unknown lang', () => {
      const test = () => converter.deserialize('xx');
      expect(test).toThrow(Error);
    });
  });
});
