import { bankingRepository } from '../../adapters/outbound/postgres/bankingRepository.js';

export async function getTotalBankedSurplus(shipId: string) {
	const total = await bankingRepository.totalAvailable(shipId);
	return total;
}



