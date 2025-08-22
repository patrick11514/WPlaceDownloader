import { config } from 'dotenv';
import { z } from 'zod';
config();

const schema = z.object({});

export const env = schema.parse(process.env);
