import { JsonConverter, JsonCustomConvert } from 'json2typescript';

@JsonConverter
export class DateConverter implements JsonCustomConvert<Date | null> {
  serialize(date: Date): string {
    return date.toISOString();
  }

  deserialize(date: string | null): Date | null {
    return date ? new Date(date) : null;
  }
}
