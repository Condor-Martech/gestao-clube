import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ProdutoEditDialog } from './produto-edit-dialog'
import { ApproveButton } from './approve-button'
import { ProdutoSyncButton } from './produto-sync-button'
import {
  EditableNumberCell,
  EditableTextCell,
} from './editable-cells'
import type { Produto } from '@/types/entities'

interface Props {
  produtos: Produto[]
  showCampanha?: boolean
  canWrite?: boolean
}

export async function ProdutosTable({ produtos, showCampanha = true, canWrite = false }: Props) {
  const t = await getTranslations('produtos')
  const tc = await getTranslations('common')

  if (produtos.length === 0) {
    return (
      <div className="border-border text-muted-foreground rounded-lg border p-12 text-center">
        {tc('noResults')}
      </div>
    )
  }

  return (
    <div className="border-border rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[64px]">{t('columns.imagem')}</TableHead>
            <TableHead className="w-[140px]">{t('columns.ean')}</TableHead>
            <TableHead className="w-[240px]">{t('columns.nome')}</TableHead>
            <TableHead className="hidden lg:table-cell">
              {t('columns.descricao')}
            </TableHead>
            <TableHead className="w-[100px]">{t('columns.unidade')}</TableHead>
            {showCampanha && (
              <TableHead className="w-[120px]">{t('columns.campanha')}</TableHead>
            )}
            <TableHead className="w-[80px] text-right">
              {t('columns.order')}
            </TableHead>
            <TableHead className="w-[120px]">{t('columns.status')}</TableHead>
            <TableHead className="w-[180px] text-right">
              {tc('actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((p) => {
            const img = p.img_external ?? p.img_internal
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="bg-muted relative size-10 overflow-hidden rounded">
                    {img ? (
                      <Image
                        src={img}
                        alt={p.nome ?? ''}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{p.ean ?? '—'}</TableCell>
                <TableCell className="font-medium">
                  <EditableTextCell
                    produtoId={p.id}
                    field="nome"
                    initialValue={p.nome}
                    canWrite={canWrite}
                  />
                </TableCell>
                <TableCell className="hidden max-w-[420px] lg:table-cell">
                  <EditableTextCell
                    produtoId={p.id}
                    field="descricao"
                    initialValue={p.descricao}
                    multiline
                    className="text-muted-foreground text-xs"
                    canWrite={canWrite}
                  />
                </TableCell>
                <TableCell>
                  <EditableTextCell
                    produtoId={p.id}
                    field="unidade"
                    initialValue={p.unidade}
                    className="text-xs"
                    canWrite={canWrite}
                  />
                </TableCell>
                {showCampanha && (
                  <TableCell className="font-mono text-xs">
                    {p.campanha ?? '—'}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <EditableNumberCell
                    produtoId={p.id}
                    field="order"
                    initialValue={p.order}
                    canWrite={canWrite}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={p.aproved ? 'success' : 'warning'}>
                    {p.aproved ? t('approved') : t('pending')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {canWrite && (
                      <ProdutoSyncButton
                        campanhaCode={p.campanha}
                        variant="ghost"
                      />
                    )}
                    <ApproveButton produtoId={p.id} approved={!!p.aproved} canWrite={canWrite} />
                    {canWrite && <ProdutoEditDialog produto={p} />}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
