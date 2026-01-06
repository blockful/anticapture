import {
  TransfersRequest,
  DBTransfer,
  TransfersResponse,
  TransferMapper,
} from "@/api/mappers";

interface TransfersRepository {
  getTransfers(req: TransfersRequest): Promise<DBTransfer[]>;
}

export class TransfersService {
  constructor(private TransfersRepository: TransfersRepository) {}

  async getTransfers(params: TransfersRequest): Promise<TransfersResponse> {
    const transfers = await this.TransfersRepository.getTransfers(params);

    return {
      items: transfers.map(TransferMapper.toApi),
      totalCount: transfers.length,
    };
  }
}
