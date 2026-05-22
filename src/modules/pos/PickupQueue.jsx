import React from "react";

export function PickupQueue({ pickups, selectedPickupId, onSelect, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="crx-card" style={{ padding: 20, color: "#9ca3af", fontSize: 13 }}>
        Loading pickup queue…
      </div>
    );
  }

  if (error) {
    return (
      <div className="crx-card" style={{ padding: 20, color: "#b91c1c", fontSize: 13 }}>
        {error}
      </div>
    );
  }

  if (!pickups.length) {
    return (
      <div className="crx-card" style={{ padding: 20, color: "#9ca3af", fontSize: 13, textAlign: "center" }}>
        No prescriptions ready for pickup.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {pickups.map((pickup) => {
        const selected = pickup.id === selectedPickupId;
        return (
          <button
            key={pickup.id || pickup.patientId}
            type="button"
            className={`crx-pickup-btn${selected ? " selected" : ""}`}
            onClick={() => onSelect?.(pickup)}
          >
            <div style={{ fontWeight: 700, color: "#14532d", fontSize: 14 }}>{pickup.patientName}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {pickup.rxCount} Rx ready
              {pickup.bagBarcode ? ` · Bag ${pickup.bagBarcode}` : ""}
            </div>
            <div style={{ fontWeight: 800, color: "#15803d", marginTop: 6, fontSize: 15 }}>
              ${Number(pickup.totalCopay || 0).toFixed(2)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
