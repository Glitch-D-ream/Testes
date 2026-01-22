import { z } from 'zod';

/**
 * Schema para análise de texto
 */
export const AnalysisSchema = z.object({
  text: z
    .string()
    .min(10, 'Texto deve ter no mínimo 10 caracteres')
    .max(10000, 'Texto não pode exceder 10000 caracteres'),
  author: z
    .string()
    .max(255, 'Nome do autor não pode exceder 255 caracteres')
    .optional(),
  category: z
    .enum([
      'EDUCATION',
      'HEALTH',
      'INFRASTRUCTURE',
      'ECONOMY',
      'SECURITY',
      'ENVIRONMENT',
      'EMPLOYMENT',
      'SOCIAL',
      'TECHNOLOGY',
      'OTHER',
    ])
    .optional(),
});

export type AnalysisInput = z.infer<typeof AnalysisSchema>;

/**
 * Schema para registro de usuário
 */
export const RegisterSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email não pode exceder 255 caracteres'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(255, 'Nome não pode exceder 255 caracteres'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Schema para login
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Schema para refresh token
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token é obrigatório'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

/**
 * Schema para consentimento LGPD
 */
export const ConsentSchema = z.object({
  dataProcessing: z
    .boolean()
    .refine(val => val === true, 'Você deve consentir com o processamento de dados'),
  privacyPolicy: z
    .boolean()
    .refine(val => val === true, 'Você deve aceitar a política de privacidade'),
});

export type ConsentInput = z.infer<typeof ConsentSchema>;

/**
 * Função auxiliar para validar dados
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Erro de validação desconhecido' };
  }
}
