'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { InviteUserSchema, USER_ROLES, type InviteUserInput } from '@/lib/validators/user'
import { ASSIGNABLE_MODULES, type ModuleLevel } from '@/lib/rbac'
import { inviteUserAction } from '../_actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function InviteUserDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const tForm = useTranslations('users.form')
  const tUsers = useTranslations('users')
  const tRoles = useTranslations('users.roles')
  const tModules = useTranslations('modules')
  const tCommon = useTranslations('common')

  const form = useForm<InviteUserInput>({
    resolver: zodResolver(InviteUserSchema),
    defaultValues: { email: '', role: 'user', phone: '', module_roles: {} },
  })

  const role = form.watch('role')
  const moduleRoles = form.watch('module_roles') ?? {}

  function setModuleLevel(module: string, level: '' | ModuleLevel) {
    const current = { ...moduleRoles }
    if (level === '') {
      delete current[module as keyof typeof current]
    } else {
      ;(current as Record<string, ModuleLevel>)[module] = level
    }
    form.setValue('module_roles', current)
  }

  function onSubmit(values: InviteUserInput) {
    startTransition(async () => {
      const result = await inviteUserAction(values)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(tUsers('invited'))
      form.reset()
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {tUsers('addButton')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tForm('addTitle')}</DialogTitle>
          <DialogDescription>{tForm('addDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('emailLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={tForm('emailPlaceholder')}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('roleLabel')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {tRoles(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role !== 'admin' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{tForm('modulesLabel')}</p>
                <div className="border-border divide-border divide-y rounded-md border">
                  {ASSIGNABLE_MODULES.map((mod) => {
                    const level = (moduleRoles as Record<string, ModuleLevel>)[mod] ?? ''
                    return (
                      <div key={mod} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="text-sm">{tModules(mod)}</span>
                        <div className="flex gap-3 text-xs">
                          {(['', 'user', 'manager'] as const).map((opt) => (
                            <label key={opt} className="flex cursor-pointer items-center gap-1">
                              <input
                                type="radio"
                                name={`module_${mod}`}
                                value={opt}
                                checked={level === opt}
                                onChange={() => setModuleLevel(mod, opt)}
                                disabled={isPending}
                                className="accent-primary"
                              />
                              {tForm(`moduleAccess.${opt === '' ? 'none' : opt}`)}
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('phoneLabel')}</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {tForm('submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
