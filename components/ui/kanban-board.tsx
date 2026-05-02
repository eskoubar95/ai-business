"use client";

import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type KanbanColumnDef = {
  id: string;
  title: string;
};

type KanbanBoardProps<T extends { id: string }> = {
  columns: KanbanColumnDef[];
  /** Ordered item ids per column — managed by parent */
  columnItemIds: Record<string, string[]>;
  getItem: (id: string) => T | undefined;
  renderCard: (item: T, isDragOverlay?: boolean) => React.ReactNode;
  onColumnItemIdsChange: (next: Record<string, string[]>) => void;
  renderColumnHeader?: (col: KanbanColumnDef, count: number) => React.ReactNode;
  renderColumnFooter?: (col: KanbanColumnDef) => React.ReactNode;
  className?: string;
};

function findColForItem(
  map: Record<string, string[]>,
  id: UniqueIdentifier,
): string | undefined {
  const s = String(id);
  if (s in map) return s; // id is a column itself
  for (const col of Object.keys(map)) {
    if (map[col].includes(s)) return col;
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
      }}
      className={cn(
        "touch-none select-none cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

/**
 * Makes the column cards area itself a droppable target so that empty columns
 * can receive dragged items. Without this, dnd-kit has nothing to collide with
 * in an empty column and drops silently fail.
 */
function DroppableColumnBody({
  colId,
  children,
}: {
  colId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: colId });
  return (
    <div ref={setNodeRef} className="flex flex-1 flex-col gap-1.5 p-2">
      {children}
    </div>
  );
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  columnItemIds: externalIds,
  getItem,
  renderCard,
  onColumnItemIdsChange,
  renderColumnHeader,
  renderColumnFooter,
  className,
}: KanbanBoardProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Local copy for optimistic visual updates during drag
  const [localIds, setLocalIds] = useState<Record<string, string[]>>(externalIds);
  const localIdsRef = useRef(localIds);
  localIdsRef.current = localIds;

  // Sync when external state changes (after server round-trip)
  useEffect(() => {
    setLocalIds(externalIds);
  }, [externalIds]);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  // Scroll container ref for wheel → horizontal scroll conversion
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Only redirect vertical scroll when not dragging
      if (activeIdRef.current !== null) return;
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY * 0.8;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onDragStart = useCallback(({ active }: { active: { id: UniqueIdentifier } }) => {
    setActiveId(active.id);
    document.body.style.cursor = "grabbing";
  }, []);

  const onDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const current = localIdsRef.current;
    const activeCol = findColForItem(current, active.id);
    const overCol =
      findColForItem(current, over.id) ??
      (String(over.id) in current ? String(over.id) : undefined);

    if (!activeCol || !overCol) return;

    setOverColumnId(overCol);

    if (activeCol === overCol) return;

    setLocalIds((prev) => {
      const fromList = prev[activeCol].filter((id) => id !== String(active.id));
      const toList = [...prev[overCol]];
      const overIsColumn = String(over.id) in prev;

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

      return { ...prev, [activeCol]: fromList, [overCol]: toList };
    });
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverColumnId(null);
      document.body.style.cursor = "";

      if (!over) {
        // Revert to external state on cancel
        setLocalIds(externalIds);
        return;
      }

      const current = localIdsRef.current;
      const activeCol = findColForItem(current, active.id);
      const overCol =
        findColForItem(current, over.id) ??
        (String(over.id) in current ? String(over.id) : undefined);

      if (!activeCol || !overCol) {
        setLocalIds(externalIds);
        return;
      }

      let next = { ...current };

      if (activeCol === overCol) {
        const items = [...current[activeCol]];
        const oldIdx = items.indexOf(String(active.id));
        const newIdx = items.indexOf(String(over.id));
        if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) {
          onColumnItemIdsChange(current);
          return;
        }
        next[activeCol] = arrayMove(items, oldIdx, newIdx);
      } else {
        // Cross-column was already handled in onDragOver — current state is correct
        next = current;
      }

      setLocalIds(next);
      onColumnItemIdsChange(next);
    },
    [externalIds, onColumnItemIdsChange],
  );

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    setOverColumnId(null);
    setLocalIds(externalIds);
    document.body.style.cursor = "";
  }, [externalIds]);

  const activeItem = activeId ? getItem(String(activeId)) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-3 overflow-x-auto pb-4",
          "[&::-webkit-scrollbar]:hidden [scrollbar-width:none]",
          className,
        )}
      >
        {columns.map((col) => {
          const ids = localIds[col.id] ?? [];
          const isOver = overColumnId === col.id && activeId !== null;

          return (
            <div
              key={col.id}
              data-kanban-column={col.id}
              data-testid={`task-column-${col.id}`}
              className={cn(
                "flex min-h-[360px] w-[min(100%,272px)] min-w-[220px] shrink-0 flex-col rounded-md",
                "border border-border bg-background",
                "transition-colors duration-150",
                isOver && "border-white/[0.14] bg-white/[0.025]",
              )}
            >
              {/* Column header */}
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                {renderColumnHeader ? (
                  renderColumnHeader(col, ids.length)
                ) : (
                  <>
                    <span className="text-[12px] font-medium text-foreground/80 tracking-wide">
                      {col.title}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground/40 tabular-nums">
                      {ids.length}
                    </span>
                  </>
                )}
              </div>

              {/* Cards — wrapped in DroppableColumnBody so empty columns are valid drop targets */}
              <SortableContext id={col.id} items={ids} strategy={verticalListSortingStrategy}>
                <DroppableColumnBody colId={col.id}>
                  {ids.map((itemId) => {
                    const item = getItem(itemId);
                    if (!item) return null;
                    return (
                      <SortableKanbanCard key={itemId} id={itemId}>
                        {renderCard(item)}
                      </SortableKanbanCard>
                    );
                  })}
                </DroppableColumnBody>
              </SortableContext>

              {/* Optional column footer (e.g. "Add task" button) */}
              {renderColumnFooter && (
                <div className="px-2 pb-2">
                  {renderColumnFooter(col)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DragOverlay: fixed-width ghost card that follows the cursor */}
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        {activeItem ? (
          <div
            className="w-[272px] rounded-md ring-1 ring-primary/30 shadow-2xl shadow-black/60 rotate-[0.8deg] scale-[1.02]"
            style={{ transition: "none" }}
          >
            {renderCard(activeItem, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
