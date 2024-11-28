import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class RequiredPipe<T> implements PipeTransform<T, T> {
  transform(value: T, metadata: ArgumentMetadata): T {
    if (value === undefined) {
      throw new BadRequestException(
        `${metadata.type} ${metadata.data} is required`,
      );
    }
    return value;
  }
}
