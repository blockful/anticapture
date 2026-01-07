import {
  DelegationsRequest,
  DelegationsResponse,
} from "@/api/mappers/delegations";

export class DelegationsService {
  constructor(private delegationsRepository: DelegationsRepository) {}

  async getTransactions(
    params: DelegationsRequest,
  ): Promise<DelegationsResponse> {
    return this.delegationsRepository.getDelegations(params);
  }
}
