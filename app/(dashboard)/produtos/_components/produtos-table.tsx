import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Produto } from '@/types/entities'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { ApproveButton } from './approve-button'
import { EditableNumberCell, EditableTextCell } from './editable-cells'
import { ProdutoEditDialog } from './produto-edit-dialog'
import { ProdutoSyncButton } from './produto-sync-button'

interface Props {
  produtos: Produto[]
  showCampanha?: boolean
  showDetails?: boolean
  canWrite?: boolean
}

export async function ProdutosTable({
  produtos,
  showCampanha = true,
  showDetails = true,
  canWrite = false,
}: Props) {
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
            <TableHead>{t('columns.produto')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('columns.descricao')}</TableHead>
            {showDetails && (
              <TableHead className="w-[140px]">{t('columns.detalhes')}</TableHead>
            )}
            <TableHead className="w-[120px]">{t('columns.status')}</TableHead>
            <TableHead className="w-[180px] text-left">{tc('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((p) => {
            const img = p.img_external ?? p.img_internal
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded">
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
                    <div className="min-w-0 flex-1">
                      <EditableTextCell
                        produtoId={p.id}
                        field="nome"
                        initialValue={p.nome}
                        canWrite={canWrite}
                        className="font-medium"
                      />
                      <div className="text-muted-foreground font-mono text-xs">
                        {p.ean ?? '—'}
                      </div>
                    </div>
                  </div>
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
                {showDetails && (
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground shrink-0">Un.</span>
                        <EditableTextCell
                          produtoId={p.id}
                          field="unidade"
                          initialValue={p.unidade}
                          className="flex-1 text-xs"
                          canWrite={canWrite}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground shrink-0">Ord.</span>
                        <EditableNumberCell
                          produtoId={p.id}
                          field="order"
                          initialValue={p.order}
                          className="flex-1"
                          canWrite={canWrite}
                        />
                      </div>
                      {showCampanha && p.campanha && (
                        <div className="text-muted-foreground font-mono">#{p.campanha}</div>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={p.aproved ? 'success' : 'warning'}>
                    {p.aproved ? t('approved') : t('pending')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                  <ApproveButton produtoId={p.id} approved={!!p.aproved} canWrite={canWrite} />
                    {canWrite && <ProdutoSyncButton campanhaCode={p.campanha} variant="ghost" />}
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
