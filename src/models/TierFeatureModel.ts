export class TierFeatureModel {
  async incrementUsage(userId: string, featureName: string, increment: number): Promise<any> {
    throw new Error('Not implemented');
  }
  async incrementUsageAtomic(userId: string, featureName: string, increment: number): Promise<any> {
    throw new Error('Not implemented');
  }
  async getUserFeatureUsage(userId: string): Promise<any> {
    throw new Error('Not implemented');
  }
  async resetUsageCounters(resetType: string, date: Date): Promise<any> {
    throw new Error('Not implemented');
  }
  async create(data: any): Promise<any> {
    throw new Error('Not implemented');
  }
}
