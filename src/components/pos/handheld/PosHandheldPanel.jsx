import React, { useCallback, useState } from "react";
import { useInventoryMaintenance } from "../../../hooks/useInventoryMaintenance";
import { usePurchasing } from "../../../hooks/usePurchasing";
import { useRoleAccess } from "../../../RoleAccessContext";
import HandheldPriceVerifySection from "./HandheldPriceVerifySection";
import HandheldReceiveSection from "./HandheldReceiveSection";
import HandheldShelfSection from "./HandheldShelfSection";
import HandheldStockCheckSection from "./HandheldStockCheckSection";
import { HandheldSectionIntro, HandheldTaskTile } from "./HandheldShared";

const HANDHELD_TASKS = [
  {
    id: "shelf",
    label: "Shelf inventory",
    emoji: "🏷️",
    description: "On-hand, department, and retail by scan.",
  },
  {
    id: "stock",
    label: "Stock check",
    emoji: "📋",
    description: "Physical count and post variance.",
  },
  {
    id: "receive",
    label: "Receiving",
    emoji: "📦",
    description: "Receive PO lines by scan.",
  },
  {
    id: "price",
    label: "Price verification",
    emoji: "💲",
    description: "Shelf tag vs system retail.",
  },
];

export default function PosHandheldPanel({ accessToken, tillNumber, onNotify, logActivity }) {
  const { hasPermission } = useRoleAccess();
  const [task, setTask] = useState(null);
  const canReceive = hasPermission("pos.purchasing");

  const inventory = useInventoryMaintenance({ accessToken, tillNumber, onNotify, logActivity });
  const purchasing = usePurchasing({ accessToken, tillNumber, onNotify, logActivity });

  const findProduct = useCallback(
    async (query) => {
      const hit = await inventory.findBySkuOrUpc(query);
      if (hit) {
        inventory.setSelectedProductId(hit.id);
      }
      return hit;
    },
    [inventory]
  );

  const loading = inventory.loading || purchasing.loading;
  const busy = inventory.busy || purchasing.busy;

  if (loading) {
    return (
      <div className="crx-handheld">
        <div className="crx-card" style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
          Loading handheld…
        </div>
      </div>
    );
  }

  return (
    <div className="crx-handheld">
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Handheld</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Mobile scanner workflows · Till {tillNumber}
        </div>
      </div>

      {!task ? (
        <>
          <HandheldSectionIntro
            title="Choose a task"
            description="Optimized for phones and wireless barcode scanners. Each scan field accepts keyboard-wedge scanner input."
          />
          <div className="crx-handheld__task-grid">
            {HANDHELD_TASKS.map((row) => (
              <HandheldTaskTile
                key={row.id}
                emoji={row.emoji}
                label={row.label}
                description={row.description}
                onClick={() => setTask(row.id)}
              />
            ))}
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 11,
              color: "#9ca3af",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {inventory.stats.total} front-shop SKUs loaded
            {inventory.stats.lowStock > 0 ? ` · ${inventory.stats.lowStock} low stock` : ""}
          </div>
        </>
      ) : null}

      {task === "shelf" ? (
        <HandheldShelfSection busy={busy} findProduct={findProduct} onBack={() => setTask(null)} onNotify={onNotify} />
      ) : null}

      {task === "stock" ? (
        <HandheldStockCheckSection
          busy={busy}
          findProduct={findProduct}
          onApplyCount={inventory.applyPhysicalCount}
          onBack={() => setTask(null)}
          onNotify={onNotify}
        />
      ) : null}

      {task === "receive" ? (
        <HandheldReceiveSection
          busy={busy}
          orders={purchasing.orders}
          onReceive={purchasing.receiveOrder}
          onBack={() => setTask(null)}
          onNotify={onNotify}
          canReceive={canReceive}
        />
      ) : null}

      {task === "price" ? (
        <HandheldPriceVerifySection
          busy={busy}
          findProduct={findProduct}
          onBack={() => setTask(null)}
          onNotify={onNotify}
        />
      ) : null}
    </div>
  );
}
