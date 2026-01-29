import {
  TransfersRequest,
  DBTransfer,
  TransfersResponse,
  TransferMapper,
} from "@/mappers";

interface TransfersRepository {
  getTransfersCount(req: TransfersRequest): Promise<number>;
  getTransfers(req: TransfersRequest): Promise<DBTransfer[]>;
}

export class TransfersService {
  constructor(private TransfersRepository: TransfersRepository) {}

  async getTransfers(params: TransfersRequest): Promise<TransfersResponse> {
    const [totalCount, transfers] = await Promise.all([
      this.TransfersRepository.getTransfersCount(params),
      this.TransfersRepository.getTransfers(params),
    ]);

    return {
      items: transfers.map(TransferMapper.toApi),
      totalCount,
    };
  }
}
