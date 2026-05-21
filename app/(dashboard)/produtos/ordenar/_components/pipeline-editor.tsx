'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  Check,
  GripVertical,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { runPipeline, PipelineRunnerError, type PipelineContext } from '@/lib/pipeline/runner'
import type {
  Pipeline,
  PipelineEdge,
  PipelineNode,
  PipelineNodeData,
  PipelineNodeType,
  Produto,
} from '@/types/entities'
import { applyPipelineOrderAction, updatePipelineAction } from '../_actions'

interface SelectOption {
  value: string
  label: string
}

interface Props {
  pipeline: Pipeline
  produtos: Produto[]
  campanhas: SelectOption[]
  departamentos: string[]
  setores: string[]
  eanToCampanhas: Record<string, ReadonlyArray<string>>
}

const EDITABLE_NODE_TYPES: PipelineNodeType[] = ['boostCampanha', 'filterMercadologico', 'sortAuto']

interface MakeNodeContext {
  departamentos?: string[]
  setores?: string[]
}

function makeNode(type: PipelineNodeType, ctx: MakeNodeContext = {}): PipelineNode {
  const data: PipelineNodeData = (() => {
    switch (type) {
      case 'boostCampanha':
        return { campanhaPattern: '' }
      case 'filterMercadologico':
        return {
          departamentos: ctx.departamentos ? [...ctx.departamentos] : [],
          setores: ctx.setores ? [...ctx.setores] : [],
        }
      case 'sortAuto':
        return { field: 'order', dir: 'asc' }
      case 'sortManual':
        return { orderedEans: [] }
      default:
        return {}
    }
  })()
  return {
    id: crypto.randomUUID(),
    type,
    position: { x: 0, y: 0 },
    data,
  }
}

function ensureSourceAndApply(nodes: PipelineNode[]): PipelineNode[] {
  const middle = nodes.filter((n) => n.type !== 'source' && n.type !== 'apply')
  const source = nodes.find((n) => n.type === 'source') ?? makeNode('source')
  const apply = nodes.find((n) => n.type === 'apply') ?? makeNode('apply')
  return [source, ...middle, apply]
}

function deriveLinearEdges(nodes: PipelineNode[]): PipelineEdge[] {
  return nodes.slice(0, -1).map((n, i) => ({
    id: `e-${n.id}-${nodes[i + 1]!.id}`,
    source: n.id,
    target: nodes[i + 1]!.id,
  }))
}

export function PipelineEditor({
  pipeline,
  produtos,
  campanhas,
  departamentos,
  setores,
  eanToCampanhas,
}: Props) {
  const t = useTranslations('regrasOrdenacao')
  const [nodes, setNodes] = useState<PipelineNode[]>(() =>
    ensureSourceAndApply(pipeline.nodes ?? []),
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, startSave] = useTransition()
  const [isApplying, startApply] = useTransition()
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  const editableNodes = nodes.slice(1, -1)

  const context: PipelineContext = useMemo(
    () => ({
      campanhas: campanhas.map((c) => ({ cod: c.value, nome: c.label })),
      eanToCampanhas,
    }),
    [campanhas, eanToCampanhas],
  )

  const preview = useMemo(() => {
    try {
      return {
        ok: true as const,
        produtos: runPipeline(
          { ...pipeline, nodes, edges: deriveLinearEdges(nodes) },
          produtos,
          context,
        ),
      }
    } catch (err) {
      const message = err instanceof PipelineRunnerError ? err.message : String(err)
      return { ok: false as const, error: message }
    }
  }, [pipeline, nodes, produtos, context])

  // 1 row por EAN. As campanhas associadas vêm do map ean→campanhas
  // para mostrar badge + lista. O orderedEans já é único por construção.
  const previewWithEan = preview.ok
    ? preview.produtos.filter(
        (p): p is Produto & { ean: string } => typeof p.ean === 'string' && p.ean.length > 0,
      )
    : []
  const previewWithoutEan = preview.ok ? preview.produtos.filter((p) => !p.ean) : []
  const previewSortableIds = previewWithEan.map((p) => p.id)
  const orderedEans = previewWithEan.map((p) => p.ean)

  const updateData = (id: string, patch: Partial<PipelineNodeData>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)))
    setIsDirty(true)
  }

  const removeNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setIsDirty(true)
  }

  const moveNode = (id: string, dir: -1 | 1) => {
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === id)
      const newIdx = idx + dir
      if (idx < 1 || idx > prev.length - 2) return prev
      if (newIdx < 1 || newIdx > prev.length - 2) return prev
      const next = [...prev]
      const [moved] = next.splice(idx, 1)
      next.splice(newIdx, 0, moved!)
      return next
    })
    setIsDirty(true)
  }

  const addNode = (type: PipelineNodeType) => {
    setNodes((prev) => [
      ...prev.slice(0, -1),
      makeNode(type, { departamentos, setores }),
      prev[prev.length - 1]!,
    ])
    setIsDirty(true)
  }

  const applyManualOrder = (newOrderedEans: string[]) => {
    setNodes((prev) => {
      const existing = prev.find((n) => n.type === 'sortManual')
      if (existing) {
        const without = prev.filter((n) => n.id !== existing.id)
        const apply = without[without.length - 1]!
        const updated: PipelineNode = {
          ...existing,
          data: { ...existing.data, orderedEans: newOrderedEans },
        }
        return [...without.slice(0, -1), updated, apply]
      }
      const fresh = makeNode('sortManual')
      const apply = prev[prev.length - 1]!
      const updated: PipelineNode = {
        ...fresh,
        data: { ...fresh.data, orderedEans: newOrderedEans },
      }
      return [...prev.slice(0, -1), updated, apply]
    })
    setIsDirty(true)
  }

  const handlePreviewDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = previewWithEan.findIndex((p) => p.id === active.id)
    const newIndex = previewWithEan.findIndex((p) => p.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(previewWithEan, oldIndex, newIndex)
    applyManualOrder(reordered.map((p) => p.ean))
  }

  const handleMoveToTop = (rowId: string) => {
    const idx = previewWithEan.findIndex((p) => p.id === rowId)
    if (idx <= 0) return
    const reordered = arrayMove(previewWithEan, idx, 0)
    applyManualOrder(reordered.map((p) => p.ean))
  }

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleSave = () => {
    startSave(async () => {
      const result = await updatePipelineAction(pipeline.id, {
        nodes,
        edges: deriveLinearEdges(nodes),
      })
      if (result.ok) {
        toast.success(t('editor.savedSuccess'))
        setIsDirty(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleApply = () => {
    if (orderedEans.length === 0) return
    startApply(async () => {
      const result = await applyPipelineOrderAction({ orderedEans })
      if (result.ok) {
        toast.success(t('editor.appliedSuccess', { count: result.data?.affected ?? 0 }))
      } else {
        toast.error(result.error)
      }
    })
  }

  const applyDisabled = isApplying || isDirty || !preview.ok || orderedEans.length === 0

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <section className="border-border bg-card space-y-3 rounded-lg border p-4">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t('detail.nodes')}</h2>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
            <Save className="size-4" />
            {t('editor.save')}
          </Button>
        </header>

        <ol className="space-y-2">
          <NodeRow node={nodes[0]!} index={0} fixed />
          {editableNodes.map((node, i) => (
            <NodeRow
              key={node.id}
              node={node}
              index={i + 1}
              campanhas={campanhas}
              departamentos={departamentos}
              setores={setores}
              canMoveUp={i > 0}
              canMoveDown={i < editableNodes.length - 1}
              onUpdate={(patch) => updateData(node.id, patch)}
              onRemove={() => removeNode(node.id)}
              onMoveUp={() => moveNode(node.id, -1)}
              onMoveDown={() => moveNode(node.id, 1)}
            />
          ))}
          <NodeRow node={nodes[nodes.length - 1]!} index={nodes.length - 1} fixed />
        </ol>

        <AddNodeBar onAdd={addNode} />

        {isDirty && <p className="text-muted-foreground text-xs italic">{t('editor.dirty')}</p>}
      </section>

      <section className="border-border bg-card space-y-3 rounded-lg border p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">{t('detail.preview')}</h2>
            <p className="text-muted-foreground text-xs">{t('detail.previewSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            {preview.ok && (
              <span className="text-muted-foreground text-xs">
                {t('detail.previewProducts', {
                  count: preview.produtos.length,
                })}
              </span>
            )}
            <Button onClick={handleApply} disabled={applyDisabled}>
              <Check className="size-4" />
              {t('detail.apply')}
            </Button>
          </div>
        </header>

        {!preview.ok ? (
          <p className="text-destructive py-8 text-center text-sm">
            {t('detail.runnerError', { message: preview.error })}
          </p>
        ) : preview.produtos.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {t('editor.previewEmpty')}
          </p>
        ) : (
          <>
            {isDirty && (
              <p className="text-muted-foreground text-xs italic">
                {t('editor.applyDisabledDirty')}
              </p>
            )}
            <p className="text-muted-foreground text-[11px]">{t('editor.dragHint')}</p>
            <div className="border-border rounded-md border">
              <div className="bg-muted/40 grid grid-cols-[72px_60px_1fr_140px_140px_120px] items-center border-b px-2 py-2 text-[11px] font-semibold tracking-wide uppercase">
                <div></div>
                <div>#</div>
                <div>{t('detail.previewColumns.nome')}</div>
                <div>{t('detail.previewColumns.ean')}</div>
                <div>{t('detail.previewColumns.departamento')}</div>
                <div>{t('detail.previewColumns.campanha')}</div>
              </div>
              {isMounted ? (
                <DndContext
                  sensors={dndSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handlePreviewDragEnd}
                >
                  <SortableContext
                    items={previewSortableIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="max-h-[600px] overflow-y-auto">
                      {previewWithEan.map((p, i) => (
                        <SortablePreviewRow
                          key={p.id}
                          produto={p}
                          index={i}
                          campanhasAssociadas={eanToCampanhas[p.ean] ?? []}
                          onMoveToTop={handleMoveToTop}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-muted-foreground py-8 text-center text-xs">
                  {t('editor.previewMounting')}
                </p>
              )}
              {previewWithoutEan.length > 0 && (
                <p className="text-muted-foreground border-t px-2 py-2 text-[11px] italic">
                  {t('editor.previewMissingEan', {
                    count: previewWithoutEan.length,
                  })}
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

interface NodeRowProps {
  node: PipelineNode
  index: number
  fixed?: boolean
  campanhas?: SelectOption[]
  departamentos?: string[]
  setores?: string[]
  canMoveUp?: boolean
  canMoveDown?: boolean
  onUpdate?: (patch: Partial<PipelineNodeData>) => void
  onRemove?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

function NodeRow({
  node,
  index,
  fixed,
  campanhas,
  departamentos,
  setores,
  canMoveUp,
  canMoveDown,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: NodeRowProps) {
  const t = useTranslations('regrasOrdenacao')
  return (
    <li className={cn('border-border space-y-2 rounded-md border p-3', fixed && 'bg-muted/30')}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-5 font-mono text-xs">{index + 1}</span>
          <span className="text-sm font-medium">
            {t.has(`detail.nodeTypes.${node.type}` as never)
              ? t(`detail.nodeTypes.${node.type}` as never)
              : `[legacy: ${node.type}]`}
          </span>
        </div>
        {!fixed && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label={t('editor.moveUp')}
            >
              <ArrowUp className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label={t('editor.moveDown')}
            >
              <ArrowDown className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive size-7"
              onClick={onRemove}
              aria-label={t('editor.removeNode')}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </header>

      {!fixed && onUpdate && (
        <NodeFields
          node={node}
          campanhas={campanhas ?? []}
          departamentos={departamentos ?? []}
          setores={setores ?? []}
          onUpdate={onUpdate}
        />
      )}
    </li>
  )
}

interface NodeFieldsProps {
  node: PipelineNode
  campanhas: SelectOption[]
  departamentos: string[]
  setores: string[]
  onUpdate: (patch: Partial<PipelineNodeData>) => void
}

function NodeFields({ node, campanhas, departamentos, setores, onUpdate }: NodeFieldsProps) {
  const t = useTranslations('regrasOrdenacao')
  switch (node.type) {
    case 'boostCampanha':
      return (
        <Field label={t('editor.fields.campanhaPattern')}>
          <Input
            value={node.data.campanhaPattern ?? ''}
            onChange={(e) => onUpdate({ campanhaPattern: e.target.value })}
            placeholder={t('editor.fields.campanhaPatternPlaceholder')}
            className="h-8 text-xs"
            maxLength={120}
          />
          <p className="text-muted-foreground mt-1 text-[10px]">
            {t('editor.fields.campanhaPatternHint')}
          </p>
        </Field>
      )
    case 'filterMercadologico':
      return (
        <div className="space-y-2">
          <Field label={t('editor.fields.departamentos')}>
            <MultiCheckSelect
              options={departamentos.map((d) => ({ value: d, label: d }))}
              value={node.data.departamentos ?? []}
              onChange={(v) => onUpdate({ departamentos: v })}
            />
          </Field>
          <Field label={t('editor.fields.setores')}>
            <MultiCheckSelect
              options={setores.map((s) => ({ value: s, label: s }))}
              value={node.data.setores ?? []}
              onChange={(v) => onUpdate({ setores: v })}
            />
          </Field>
        </div>
      )
    case 'sortAuto':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Field label={t('editor.fields.field')}>
            <Select
              value={node.data.field ?? 'order'}
              onValueChange={(v) =>
                onUpdate({
                  field: v as NonNullable<PipelineNodeData['field']>,
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order">{t('editor.fieldOptions.order')}</SelectItem>
                <SelectItem value="nome">{t('editor.fieldOptions.nome')}</SelectItem>
                <SelectItem value="ean">{t('editor.fieldOptions.ean')}</SelectItem>
                <SelectItem value="updated_at">{t('editor.fieldOptions.updated_at')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('editor.fields.dir')}>
            <Select
              value={node.data.dir ?? 'asc'}
              onValueChange={(v) => onUpdate({ dir: v as 'asc' | 'desc' })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{t('editor.dirOptions.asc')}</SelectItem>
                <SelectItem value="desc">{t('editor.dirOptions.desc')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      )
    case 'sortManual': {
      const count = node.data.orderedEans?.length ?? 0
      return (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs italic">
            {t('editor.sortManualHint', { count })}
          </p>
          {count > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdate({ orderedEans: [] })}
              className="h-7 text-xs"
            >
              <RotateCcw className="size-3" />
              {t('editor.clearManual')}
            </Button>
          )}
        </div>
      )
    }
    default:
      return null
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-muted-foreground text-[11px] font-medium uppercase">{label}</span>
      {children}
    </label>
  )
}

function MultiCheckSelect({
  options,
  value,
  onChange,
}: {
  options: SelectOption[]
  value: string[]
  onChange: (next: string[]) => void
}) {
  const t = useTranslations('regrasOrdenacao')
  const [search, setSearch] = useState('')
  const set = new Set(value)
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
  const toggle = (val: string) => {
    if (set.has(val)) onChange(value.filter((v) => v !== val))
    else onChange([...value, val])
  }
  return (
    <div className="space-y-1.5">
      <Input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('editor.searchPlaceholder')}
        className="h-7 text-xs"
      />
      <div className="border-border max-h-40 overflow-y-auto rounded-md border">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground p-2 text-xs italic">{t('editor.noOptions')}</p>
        ) : (
          filtered.map((opt) => (
            <label
              key={opt.value}
              className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 px-2 py-1 text-xs"
            >
              <input
                type="checkbox"
                checked={set.has(opt.value)}
                onChange={() => toggle(opt.value)}
                className="size-3.5"
              />
              <span className="truncate">{opt.label}</span>
            </label>
          ))
        )}
      </div>
      <p className="text-muted-foreground text-[10px]">
        {t('editor.selectedCount', { count: value.length })}
      </p>
    </div>
  )
}

function AddNodeBar({ onAdd }: { onAdd: (type: PipelineNodeType) => void }) {
  const t = useTranslations('regrasOrdenacao')
  const [type, setType] = useState<PipelineNodeType>(EDITABLE_NODE_TYPES[0]!)
  return (
    <div className="border-border flex items-center gap-2 rounded-md border border-dashed p-2">
      <Select value={type} onValueChange={(v) => setType(v as PipelineNodeType)}>
        <SelectTrigger className="h-8 flex-1 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EDITABLE_NODE_TYPES.map((nodeType) => (
            <SelectItem key={nodeType} value={nodeType}>
              {t(`detail.nodeTypes.${nodeType}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" onClick={() => onAdd(type)}>
        <Plus className="size-4" />
        {t('editor.addNode')}
      </Button>
    </div>
  )
}

function SortablePreviewRow({
  produto,
  index,
  campanhasAssociadas,
  onMoveToTop,
}: {
  produto: Produto & { ean: string }
  index: number
  campanhasAssociadas: ReadonlyArray<string>
  onMoveToTop: (rowId: string) => void
}) {
  const t = useTranslations('regrasOrdenacao')
  const ean = produto.ean
  const totalCampanhas = campanhasAssociadas.length
  const isMultiCampanha = totalCampanhas > 1
  const campanhasJoined = campanhasAssociadas.join(', ')
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: produto.id })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'border-border hover:bg-muted/40 grid grid-cols-[72px_60px_1fr_140px_140px_120px] items-center border-b px-2 py-1.5 text-xs last:border-b-0',
        isDragging && 'bg-muted ring-primary z-10 opacity-80 shadow-lg ring-2',
      )}
    >
      <div className="flex items-center gap-1">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={t('editor.dragHandle')}
          className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={t('editor.moveToTop')}
          title={t('editor.moveToTop')}
          onClick={() => onMoveToTop(produto.id)}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          disabled={index === 0}
        >
          <ArrowUpToLine className="size-3.5" />
        </button>
      </div>
      <div className="text-muted-foreground font-mono">{index + 1}</div>
      <div className="flex items-center gap-1.5 truncate text-sm">
        <span className="truncate" title={produto.nome ?? ''}>
          {produto.nome ?? '—'}
        </span>
        {isMultiCampanha && (
          <span
            className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
            title={`${t('editor.duplicateTooltip', { count: totalCampanhas })}\n${campanhasJoined}`}
          >
            x{totalCampanhas}
          </span>
        )}
      </div>
      <div className="font-mono">{ean}</div>
      <div className="truncate" title={produto.departamento ?? ''}>
        {produto.departamento ?? '—'}
      </div>
      <div className="truncate" title={campanhasJoined || produto.campanha || ''}>
        {totalCampanhas === 0
          ? (produto.campanha ?? '—')
          : totalCampanhas === 1
            ? campanhasAssociadas[0]
            : `${campanhasAssociadas[0]} +${totalCampanhas - 1}`}
      </div>
    </li>
  )
}
