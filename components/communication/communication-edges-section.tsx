"use client";

import type { CommunicationEdgeRow } from "@/lib/communication/edge-store";
import { EdgeForm } from "@/components/communication/edge-form";
import { EdgeList } from "@/components/communication/edge-list";
import { useState } from "react";

export function CommunicationEdgesSection({
  businessId,
  initialEdges,
}: {
  businessId: string;
  initialEdges: CommunicationEdgeRow[];
}) {
  const [editing, setEditing] = useState<CommunicationEdgeRow | null>(null);

  return (
    <div>
      <EdgeForm
        businessId={businessId}
        editingEdge={editing}
        onCancelEdit={() => setEditing(null)}
      />
      <EdgeList businessId={businessId} edges={initialEdges} onEdit={setEditing} />
    </div>
  );
}
