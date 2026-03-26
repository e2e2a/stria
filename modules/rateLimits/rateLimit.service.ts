import { HttpError } from '@/utils/server/errors';
import { getHeaders } from '@/lib/server/getHeaders';
import { rateLimitRepository } from '@/modules/rateLimits/rateLimit.repository';
import { CreateIRateLimitDTO, IRateLimit, IRateLimitType } from '@/types';

export const rateLimitService = {
  checkLimit: async (type: IRateLimitType, email: string) => {
    const now = new Date();
    const RETRY_WINDOW = 1 * 60 * 60 * 1000; // 1h
    const MAX_RETRY = 5;

    const { ip, deviceType } = await getHeaders();
    const payload = {
      email,
      type,
      ip,
      deviceType,
    };

    const accessRecord = await rateLimitService.findAccessRecord(payload as Partial<IRateLimit>);

    if (!accessRecord) {
      return await rateLimitService.create({
        type,
        email,
        retryCount: 0,
        retryResetAt: new Date(now.getTime() + RETRY_WINDOW),
      });
    }
    if (accessRecord) {
      // Token exists → check retry reset
      if (accessRecord.retryResetAt < now) accessRecord.retryCount = 0;

      // Enforce retry limit
      if (accessRecord.retryCount >= MAX_RETRY) throw new HttpError('TOO_MANY_REQUEST', 'Too many attempts. Try again in a couple minutes');

      accessRecord.retryResetAt = new Date(now.getTime() + RETRY_WINDOW);
      accessRecord.retryCount += 1;
      await accessRecord.save();
    }
    return accessRecord;
  },

  resetLimit: async (type: IRateLimitType, email: string) => {
    const { ip, deviceType } = await getHeaders();
    const payload = {
      email,
      type,
      ip,
      deviceType,
    };

    // 1. Use your existing find method
    const accessRecord = await rateLimitService.findAccessRecord(payload as Partial<IRateLimit>);

    if (accessRecord) {
      accessRecord.retryCount = 0;
      accessRecord.retryResetAt = new Date();
      await accessRecord.save();
    }

    return accessRecord;
  },

  create: async (data: { type: string; email: string; retryCount: number; retryResetAt: Date | null; userId?: string }) => {
    const getHead = await getHeaders();
    const payload = {
      ...data,
      ...getHead,
    };
    const accessRecord = await rateLimitRepository.create(payload as CreateIRateLimitDTO);
    return accessRecord;
  },

  findAccessRecord: async (data: Partial<IRateLimit>) => {
    const accessRecord = await rateLimitRepository.findAccessRecord(data);
    return accessRecord;
  },

  findAccessRecordAndUpdate: async (data: Partial<IRateLimit>, updateData: Partial<IRateLimit>) => {
    const accessRecord = await rateLimitRepository.findAccessRecordAndUpdate(data, updateData);
    return accessRecord;
  },
};
