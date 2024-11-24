import { IsNotEmpty, IsString } from "class-validator";


export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    id: string;
}
