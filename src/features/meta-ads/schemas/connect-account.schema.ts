import { z } from 'zod';

export const connectAccountSchema = z.object({
  externalId: z
    .string()
    .regex(/^act_\d+$/, 'ID deve começar com act_ seguido de números'),
  accessToken: z.string().min(20, 'Token muito curto'),
  name: z.string().optional(),
});

export type ConnectAccountFormData = z.infer<typeof connectAccountSchema>;

export const reconnectAccountSchema = z.object({
  accessToken: z.string().min(20, 'Token muito curto'),
});

export type ReconnectAccountFormData = z.infer<typeof reconnectAccountSchema>;
