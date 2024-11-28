import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'CreateRoleDto' })
export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  daoId: string;
}
