import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deletePosPromotion,
  getPosPromotionSyncMeta,
  listPosPromotions,
  savePosPromotion,
  savePosPromotionSyncMeta,
} from "../lib/clarityIndexedDb";
import { buildDefaultRulesForType, evaluatePromoRules, previewCartContext } from "../lib/promotions/ruleEngine";
import { buildHeadOfficeSyncBatch, buildSeedPromotions } from "../lib/promotions/seedPromotions";
import {
  PROMO_SOURCE,
  PROMO_STATUS,
  PROMO_TYPE,
  defaultTypeConfig,
  generatePromoId,
  isPromoActiveNow,
} from "../lib/promotions/promotionTypes";

export function usePromotions({ onNotify, logActivity }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [syncMeta, setSyncMeta] = useState({ lastSyncAt: null, lastSource: null, pendingCount: 0 });
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let rows = await listPosPromotions();
      if (!rows.length) {
        const seed = buildSeedPromotions();
        await Promise.all(seed.map((row) => savePosPromotion(row)));
        rows = seed;
      }
      const meta = await getPosPromotionSyncMeta();
      setCampaigns(rows);
      setSyncMeta(meta);
      setSelectedCampaignId((prev) => prev || rows[0]?.id || "");
    } catch (e) {
      onNotify?.(e.message || "Unable to load promotions.", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedCampaign = useMemo(
    () => campaigns.find((row) => row.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId]
  );

  const activeCampaigns = useMemo(
    () => campaigns.filter((row) => isPromoActiveNow(row)),
    [campaigns]
  );

  const saveCampaign = useCallback(
    async (campaign) => {
      setBusy(true);
      try {
        const next = { ...campaign, updatedAt: new Date().toISOString() };
        await savePosPromotion(next);
        setCampaigns((prev) => {
          const exists = prev.some((row) => row.id === next.id);
          if (exists) return prev.map((row) => (row.id === next.id ? next : row));
          return [next, ...prev];
        });
        logActivity?.("pos.promotions.save", { campaignId: next.id, name: next.name });
      } catch (e) {
        onNotify?.(e.message || "Unable to save promotion.", "error");
      } finally {
        setBusy(false);
      }
    },
    [logActivity, onNotify]
  );

  const createCampaign = useCallback(
    async (type = PROMO_TYPE.FLYER) => {
      const stamp = new Date().toISOString();
      const campaign = {
        id: generatePromoId(),
        name: "New promotion",
        type,
        status: PROMO_STATUS.DRAFT,
        source: PROMO_SOURCE.STORE,
        startAt: stamp,
        endAt: null,
        config: defaultTypeConfig(type),
        rules: buildDefaultRulesForType(type),
        createdAt: stamp,
        updatedAt: stamp,
      };
      await saveCampaign(campaign);
      setSelectedCampaignId(campaign.id);
      return campaign;
    },
    [saveCampaign]
  );

  const removeCampaign = useCallback(
    async (id) => {
      setBusy(true);
      try {
        await deletePosPromotion(id);
        setCampaigns((prev) => prev.filter((row) => row.id !== id));
        if (selectedCampaignId === id) {
          setSelectedCampaignId("");
        }
        logActivity?.("pos.promotions.delete", { campaignId: id });
        onNotify?.("Promotion removed.", "success");
      } catch (e) {
        onNotify?.(e.message || "Unable to delete promotion.", "error");
      } finally {
        setBusy(false);
      }
    },
    [logActivity, onNotify, selectedCampaignId]
  );

  const syncFromHeadOffice = useCallback(async () => {
    setBusy(true);
    try {
      const incoming = buildHeadOfficeSyncBatch();
      const existingHoIds = new Set(
        campaigns.map((row) => row.headOfficeId).filter(Boolean)
      );
      const toImport = incoming.filter((row) => !existingHoIds.has(row.headOfficeId));
      await Promise.all(toImport.map((row) => savePosPromotion(row)));
      const meta = {
        lastSyncAt: new Date().toISOString(),
        lastSource: "head_office",
        pendingCount: 0,
      };
      await savePosPromotionSyncMeta(meta);
      setSyncMeta(meta);
      await refresh();
      logActivity?.("pos.promotions.sync", { imported: toImport.length });
      onNotify?.(
        toImport.length
          ? `Synced ${toImport.length} head office / banner promotion(s).`
          : "No new promotions from head office.",
        "success"
      );
    } catch (e) {
      onNotify?.(e.message || "Promotion sync failed.", "error");
    } finally {
      setBusy(false);
    }
  }, [campaigns, logActivity, onNotify, refresh]);

  const evaluatePreview = useCallback(
    (campaign, contextOverrides) => {
      if (!campaign) return [];
      return evaluatePromoRules(campaign, previewCartContext(contextOverrides));
    },
    []
  );

  return {
    loading,
    busy,
    campaigns,
    activeCampaigns,
    syncMeta,
    selectedCampaign,
    selectedCampaignId,
    setSelectedCampaignId,
    saveCampaign,
    createCampaign,
    removeCampaign,
    syncFromHeadOffice,
    evaluatePreview,
    refresh,
  };
}
