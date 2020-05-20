import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { IUserBase, UserLang, UserRole } from '../types';
import { DateConverter } from './converters/date.converter';
import { UserRoleConverter } from './converters/user/user-role.converter';
import { UserLangConverter } from './converters/user/user-lang.converter';
import { Config } from '../common';

export interface IUser extends IUserBase {
  _id: Types.ObjectId | string | null;
  password: string;
  activated?: boolean;
  createdBy: Types.ObjectId | string;
  createdDate: Date | null;
  lastModifiedBy?: Types.ObjectId | string | null;
  lastModifiedDate?: Date | null;
}

@JsonObject('User')
export class UserEntity implements IUser {
  @JsonProperty('_id', String, true)
  _id = Config.DB_USER.dialect === 'local' ? Types.ObjectId() : null;

  @JsonProperty('login', String)
  login = '';

  @JsonProperty('password', String)
  password = '';

  @JsonProperty('firstName', String)
  firstName = '';

  @JsonProperty('lastName', String, true)
  lastName = '';

  @JsonProperty('email', String)
  email = '';

  @JsonProperty('langKey', UserLangConverter, true)
  langKey? = UserLang.ES;

  @JsonProperty('roles', UserRoleConverter)
  roles = [UserRole.USER];

  @JsonProperty('activated', Boolean, true)
  activated? = false;

  @JsonProperty('createdBy', String, true)
  createdBy = '';

  @JsonProperty('createdDate', DateConverter, true)
  createdDate = null;

  @JsonProperty('lastModifiedBy', String, true)
  lastModifiedBy? = null;

  @JsonProperty('lastModifiedDate', DateConverter, true)
  lastModifiedDate? = null;

  public getMongoEntity() {
    return {
      _id: this._id ? (this._id as any).toString() : null,
      login: this.login,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      langKey: this.langKey,
      roles: this.roles,
      activated: this.activated,
      createdBy: this.createdBy,
      createdDate: this.createdDate,
      lastModifiedBy: this.lastModifiedBy || undefined,
      lastModifiedDate: this.lastModifiedDate || undefined
    };
  }
}
