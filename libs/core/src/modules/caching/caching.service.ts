import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CachingService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async clearTag(tag: string) {
    const tagKey = `tag:${tag}`;
    const keys = (await this.cacheManager.get<string[]>(tagKey)) || [];

    // Delete all keys associated with this tag
    for (const key of keys) {
      await this.cacheManager.del(key);
    }

    // Delete the tag index itself
    await this.cacheManager.del(tagKey);
  }
}
