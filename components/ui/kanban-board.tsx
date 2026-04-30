"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

export type KanbanColumnDef = {
  id: string;
  title: string;
};

type KanbanBoardProps<T extends { id: string }> = {
  columns: KanbanColumnDef[];
  /** Ordered item ids per column */
  columnItemIds: Record<string, string[]>;
  getItem: (id: string) => T | undefined;
  renderCard: (item: T) => React.ReactNode;
  onColumnItemIdsChange: (next: Record<string, string[]>) => void;
  renderColumnHeader?: (col: KanbanColumnDef, count: number) => React.ReactNode;
  className?: string;
};

function findColumn(
  columnItemIds: Record<string, string[]>,
  id: UniqueIdentifier,
): string | undefined {
  const s = String(id);
  if (s in columnItemIds) {
    return s;
  }
  for (const col of Object.keys(columnItemIds)) {
    if (columnItemIds[col].includes(s)) {
      return col;
    }
  }
  return undefined;
}

function SortableKanbanCard({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-60 shadow-lg",
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  columnItemIds,
  getItem,
  renderCard,
  onColumnItemIdsChange,
  renderColumnHeader,
  className,
}: KanbanBoardProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) {
        return;
      }

      const activeContainer = findColumn(columnItemIds, active.id);
      const overContainer =
        findColumn(columnItemIds, over.id) ?? (String(over.id) in columnItemIds ? String(over.id) : undefined);

      if (!activeContainer || !overContainer) {
        return;
      }

      const next = { ...columnItemIds, [activeContainer]: [...columnItemIds[activeContainer]] };

      if (activeContainer === overContainer) {
        const items = next[activeContainer];
        const oldIndex = items.indexOf(String(active.id));
        const newIndex = items.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
          return;
        }
        next[activeContainer] = arrayMove(items, oldIndex, newIndex);
      } else {
        const fromList = next[activeContainer].filter((id) => id !== String(active.id));
        const toList = [...next[overContainer]];
        const overIsColumn = String(over.id) in columnItemIds;
        if (overIsColumn) {
          toList.push(String(active.id));
        } else {
          const overIndex = toList.indexOf(String(over.id));
          if (overIndex >= 0) {
            toList.splice(overIndex, 0, String(active.id));
          } else {
            toList.push(String(active.id));
          }
        }
        next[activeContainer] = fromList;
        next[overContainer] = toList;
      }

      onColumnItemIdsChange(next);
    },
    [columnItemIds, onColumnItemIdsChange],
  );

  const activeItem = activeId ? getItem(String(activeId)) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={onDragEnd}
    >
      <div className={cn("flex gap-3 overflow-x-auto pb-2", className)}>
        {columns.map((col) => {
          const ids = columnItemIds[col.id] ?? [];
          return (
            <div
              key={col.id}
              className="border-border bg-muted/40 flex w-[min(100%,280px)] min-w-[220px] shrink-0 flex-col rounded-lg border"
              data-kanban-column={col.id}
            >
              <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-2">
                {renderColumnHeader ? (
                  renderColumnHeader(col, ids.length)
                ) : (
                  <>
                    <span className="text-sm font-semibold">{col.title}</span>
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
                      {ids.length}
                    </span>
                  </>
                )}
              </div>
              <SortableContext id={col.id} items={ids} strategy={verticalListSortingStrategy}>
                <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
                  {ids.map((itemId) => {
                    const item = getItem(itemId);
                    if (!item) {
                      return null;
                    }
                    return (
                      <SortableKanbanCard key={itemId} id={itemId}>
                        {renderCard(item)}
                      </SortableKanbanCard>
                    );
                  })}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="ring-primary/20 shadow-lg ring-2">{renderCard(activeItem)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
