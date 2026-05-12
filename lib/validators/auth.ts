import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export type LoginInput = z.infer<typeof LoginSchema>
