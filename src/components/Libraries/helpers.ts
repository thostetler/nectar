import z from 'zod';

export const isValidEmail = (email: string) => {
  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(email);
  return result.success;
};
