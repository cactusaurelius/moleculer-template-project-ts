import { UserRoleConverter } from '../../../../../src/entities/converters/user/user-role.converter';
import { UserRole } from '../../../../../src/types';

describe('User role converter', () => {
  let converter: UserRoleConverter;
  beforeEach(() => {
    converter = new UserRoleConverter();
  });
  describe('serialize', () => {
    it('all roles', () => {
      const roles = [UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.APPROVER, UserRole.MODIFIER];
      const result = converter.serialize(roles);
      expect(result).toBeDefined().toBeArray().toEqual(['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SUPERADMIN', 'ROLE_APPROVER', 'ROLE_MODIFIER']);
    });
    it('empty', () => {
      const result = converter.serialize([]);
      expect(result).toBeDefined().toBeArray().toEqual([]);
    });
  });
  describe('deserialize', () => {
    it('all roles', () => {
      const roles = ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SUPERADMIN', 'ROLE_APPROVER', 'ROLE_MODIFIER'];
      const result = converter.deserialize(roles);
      expect(result).toBeDefined().toBeArray().toEqual([UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.APPROVER, UserRole.MODIFIER]);
    });
    it('empty', () => {
      const result = converter.deserialize([]);
      expect(result).toBeDefined().toBeArray().toEqual([]);
    });
    it('unknown role', () => {
      const test = () => converter.deserialize(['xx']);
      expect(test).toThrow(Error);
    });
    it('unknown role with others', () => {
      const test = () => converter.deserialize(['ROLE_USER', 'ROLE_ADMIN', 'xx']);
      expect(test).toThrow(Error);
    });
  });
});
