import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { IUserBase, ObjectId, ObjectIdNull, UserLang, UserRole } from '../types';
import { DateConverter } from './converters/date.converter';
import { UserRoleConverter } from './converters/user/user-role.converter';
import { UserLangConverter } from './converters/user/user-lang.converter';
import { Config } from '../common';

export interface IUser extends IUserBase {
  _id: ObjectIdNull;
  password: string;
  createdBy: ObjectId;
  createdDate: Date | null;
  lastModifiedBy?: ObjectIdNull;
  lastModifiedDate?: Date | null;
}

@JsonObject('User')
export class UserEntity implements IUser {
  @JsonProperty('_id', String, true)
  _id = Config.DB_USER.dialect === 'local' ? Types.ObjectId() : null;

  @JsonProperty('login', String)
  login = '';

  @JsonProperty('password', String, true)
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

  @JsonProperty('active', Boolean, true)
  active? = false;

  @JsonProperty('createdBy', Any, true)
  createdBy = '';

  @JsonProperty('createdDate', DateConverter, true)
  createdDate = null;

  @JsonProperty('lastModifiedBy', Any, true)
  lastModifiedBy? = null;

  @JsonProperty('lastModifiedDate', DateConverter, true)
  lastModifiedDate? = null;

  public getMongoEntity() {
    const result: IUser = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
    if (!result._id) {
      delete result._id;
    }
    return result;
  }
}
