import { IsString, IsNotEmpty } from 'class-validator';

export class UpsertUserAccountDto {
  @IsString()
  @IsNotEmpty()
  address: string;
}
