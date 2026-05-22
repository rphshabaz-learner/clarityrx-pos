import React, { useState } from "react";
import { useInventoryMaintenance } from "../../../hooks/useInventoryMaintenance";
import InventoryCountsSection from "./InventoryCountsSection";
import InventoryCycleCountSection from "./InventoryCycleCountSection";
import InventoryExpirySection from "./InventoryExpirySection";
import InventoryLabelsSection from "./InventoryLabelsSection";
import InventoryProductSection from "./InventoryProductSection";

const INVENTORY_SECTIONS = [
  { id: "products", label: "Products" },
  { id: "counts", label: "Counts" },
  { id: "expiry", label: "Expiry" },
  { id: "cycle", label: "Cycle counts" },
  { id: "labels", label: "Labels" },
];

export default function PosInventoryPanel({ accessToken, tillNumber, onNotify, logActivity }) {
  const [section, setSection] = useState("products");
  const inventory = useInventoryMaintenance({ accessToken, tillNumber, onNotify, logActivity });

  if (inventory.loading) {
    return (
      <div className="crx-card" style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Loading inventory…
      </div>
    );
  }

  const productPickerProps = {
    products: inventory.products,
    filteredProducts: inventory.filteredProducts,
    selectedProduct: inventory.selectedProduct,
    selectedProductId: inventory.selectedProductId,
    setSelectedProductId: inventory.setSelectedProductId,
    listQuery: inventory.listQuery,
    setListQuery: inventory.setListQuery,
    busy: inventory.busy,
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Inventory maintenance</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Front shop · OTC · Cosmetics · Convenience · Seasonal · Home healthcare · Vitamins · Snacks
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 12, fontWeight: 600, color: "#374151" }}>
          <span>Products: {inventory.stats.total}</span>
          <span>Active: {inventory.stats.active}</span>
          <span>Low stock: {inventory.stats.lowStock}</span>
          <span>Expiring (90d): {inventory.stats.expiringSoon}</span>
        </div>
      </div>

      <div className="crx-tabs" style={{ marginBottom: 16 }}>
        {INVENTORY_SECTIONS.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`crx-tab${section === row.id ? " active" : ""}`}
            onClick={() => setSection(row.id)}
          >
            {row.label}
          </button>
        ))}
      </div>

      {section === "products" ? (
        <InventoryProductSection
          {...productPickerProps}
          onCreateProduct={inventory.createProduct}
          onSaveProduct={inventory.saveProduct}
          onRemoveProduct={inventory.removeProduct}
          onSelectByScan={(query) => {
            const hit = inventory.selectProductByQuery(query);
            if (!hit) onNotify?.("No product found for that SKU or UPC.", "warning");
            return hit;
          }}
        />
      ) : null}

      {section === "counts" ? (
        <InventoryCountsSection
          {...productPickerProps}
          onApplyCount={inventory.applyPhysicalCount}
        />
      ) : null}

      {section === "expiry" ? (
        <InventoryExpirySection
          {...productPickerProps}
          onSaveProduct={inventory.saveProduct}
        />
      ) : null}

      {section === "cycle" ? (
        <InventoryCycleCountSection
          products={inventory.products}
          activeCycle={inventory.activeCycle}
          activeCycleId={inventory.activeCycleId}
          setActiveCycleId={inventory.setActiveCycleId}
          cycleSessions={inventory.cycleSessions}
          busy={inventory.busy}
          onCreateCycle={inventory.createCycleCount}
          onUpdateCycle={inventory.updateCycleSession}
          onCompleteCycle={inventory.completeCycleCount}
        />
      ) : null}

      {section === "labels" ? (
        <InventoryLabelsSection
          products={inventory.products}
          selectedProduct={inventory.selectedProduct}
          labelQueue={inventory.labelQueue}
          busy={inventory.busy}
          onQueueLabels={inventory.queueLabels}
          onClearQueue={inventory.clearLabelQueue}
        />
      ) : null}
    </div>
  );
}
