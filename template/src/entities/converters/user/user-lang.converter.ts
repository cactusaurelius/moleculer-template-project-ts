import { JsonConverter, JsonCustomConvert } from 'json2typescript';
import { UserLang } from '../../../types';

@JsonConverter
export class UserLangConverter implements JsonCustomConvert<UserLang> {
  serialize(item: UserLang): string {
    return item.toString();
  }

  deserialize(item: string): UserLang {
    const values = Object.values<string>(UserLang);
    const valid = values.includes(item);
    if (!valid) {
      throw new Error(`Not valid enum in lang "${item}"`);
    }
    return item as UserLang;
  }
}
