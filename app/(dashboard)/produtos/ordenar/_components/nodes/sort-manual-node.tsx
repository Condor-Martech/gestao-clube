'use client'

import { memo, useEffect } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
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
import { GripVertical, ListOrdered } from 'lucide-react'
import type { Produto } from '@/types/entities'
import { cn } from '@/lib/utils'
import { useReconcileOrder } from '../hooks/use-reconcile-order'

export interface SortManualNodeData {
  orderedEans?: string[]
  __input?: Produto[]
  __onChange?: (orderedEans: string[]) => void
  [key: string]: unknown
}

const MAX_VISIBLE = 200
const SOFT_CAP = 500

function SortableRow({
  produto,
  index,
}: {
  produto: Produto
  index: number
}) {
  const ean = produto.ean ?? ''
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ean })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm',
        isDragging && 'shadow-lg ring-2 ring-primary',
      )}
    >
      <button
        type="button"
        aria-label="Arrastar"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
        {index + 1}
      </span>
      <span className="flex-1 truncate" title={produto.nome ?? ''}>
        {produto.nome ?? '—'}
      </span>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
        {ean}
      </span>
    </li>
  )
}

function SortManualNodeImpl({ data, selected }: NodeProps) {
  const nodeData = data as SortManualNodeData
  const input = nodeData.__input ?? []
  const stored = nodeData.orderedEans ?? []
  const onChange = nodeData.__onChange

  const inputEans = input
    .map((p) => p.ean)
    .filter((e): e is string => typeof e === 'string' && e.length > 0)

  const reconciled = useReconcileOrder(inputEans, stored)

  // Sync reconciled order back to node data when it differs from stored
  useEffect(() => {
    if (!onChange) return
    if (
      reconciled.length !== stored.length ||
      reconciled.some((e, i) => e !== stored[i])
    ) {
      onChange(reconciled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconciled.join('|')])

  const byEan = new Map(input.map((p) => [p.ean ?? '', p]))
  const ordered = reconciled
    .map((ean) => byEan.get(ean))
    .filter((p): p is Produto => Boolean(p))

  const visible = ordered.slice(0, MAX_VISIBLE)
  const overflow = ordered.length - visible.length
  const overSoftCap = ordered.length > SOFT_CAP

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !onChange) return
    const oldIndex = reconciled.indexOf(active.id as string)
    const newIndex = reconciled.indexOf(over.id as string)
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(reconciled, oldIndex, newIndex))
  }

  return (
    <div
      className={cn(
        'w-[360px] rounded-lg border bg-card shadow-sm',
        selected && 'ring-2 ring-primary',
      )}
    >
      <Handle type="target" position={Position.Left} />
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <ListOrdered className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Ordem manual</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {ordered.length} produto{ordered.length === 1 ? '' : 's'}
        </span>
      </header>
      <div className="space-y-2 p-3">
        {ordered.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Sem produtos. Conecte um nó de entrada.
          </p>
        )}
        {overSoftCap && (
          <p className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-400">
            Mais de {SOFT_CAP} produtos. Filtre antes para um DnD performático.
          </p>
        )}
        {ordered.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={reconciled}
              strategy={verticalListSortingStrategy}
            >
              <ul className="nodrag nopan nowheel max-h-[420px] space-y-1 overflow-y-auto pr-1">
                {visible.map((produto, idx) => (
                  <SortableRow
                    key={produto.ean ?? idx}
                    produto={produto}
                    index={idx}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        {overflow > 0 && (
          <p className="text-[11px] text-muted-foreground">
            +{overflow} produtos não exibidos (DnD limitado a {MAX_VISIBLE}).
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export const SortManualNode = memo(SortManualNodeImpl)
