import { useCallback, useEffect, useMemo, useState } from "react";
import { listPosGiftCards, savePosGiftCard } from "../lib/clarityIndexedDb";
import {
  activateGiftCard,
  findGiftCardByNumber,
  lookupGiftCardBalance,
  redeemGiftCard,
  reloadGiftCard,
} from "../lib/giftCards/giftCardService";
import { buildSeedGiftCards } from "../lib/giftCards/seedGiftCards";
import {
  emptyGiftCard,
  generateGiftCardId,
  giftCardDisplayBalance,
  nextGiftCardNumber,
  normalizeGiftCardNumber,
} from "../lib/giftCards/giftCardTypes";
import {
  buildPosAuditDetail,
  evaluatePosAction,
  logProtectedPosAction,
} from "../lib/posPermissions";

export function useGiftCards({
  onNotify,
  logActivity,
  tillNumber,
  operatorId,
  activeRole,
  managerOverrideActive,
  hasPermission,
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState([]);
  const [lookupNumber, setLookupNumber] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let rows = await listPosGiftCards();
      if (!rows.length) {
        const seed = buildSeedGiftCards();
        await Promise.all(seed.map((row) => savePosGiftCard(row)));
        rows = seed;
      }
      setCards(rows);
    } catch (e) {
      onNotify?.(e.message || "Unable to load gift cards.", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistCard = useCallback(
    async (card) => {
      await savePosGiftCard(card);
      setCards((prev) => {
        const idx = prev.findIndex((row) => row.id === card.id);
        if (idx === -1) return [card, ...prev];
        const copy = [...prev];
        copy[idx] = card;
        return copy;
      });
      return card;
    },
    []
  );

  const permissionContext = useMemo(
    () => ({
      activeRole,
      managerOverrideActive: Boolean(managerOverrideActive),
      hasPermission,
      tillNumber,
      operatorId: operatorId || null,
    }),
    [activeRole, managerOverrideActive, hasPermission, tillNumber, operatorId]
  );

  const meta = useMemo(
    () => ({
      tillNumber,
      operatorId: operatorId || null,
    }),
    [tillNumber, operatorId]
  );

  const gateAction = useCallback(
    (actionKey) => {
      const result = evaluatePosAction(actionKey, permissionContext);
      if (!result.allowed) {
        onNotify?.(result.reason, "warning");
      }
      return result;
    },
    [onNotify, permissionContext]
  );

  const balanceLookup = useMemo(() => lookupGiftCardBalance(cards, lookupNumber), [cards, lookupNumber]);

  const activateNewCard = useCallback(
    async ({ amount, purchaserName, tenderMethod, note, cardNumber }) => {
      const gate = gateAction("giftcards.activate");
      if (!gate.allowed) return null;
      setBusy(true);
      try {
        const normalized = cardNumber ? normalizeGiftCardNumber(cardNumber) : "";
        if (cardNumber && !normalized) {
          throw new Error("Enter a valid card number (GC-####-####) or leave blank for auto-issue.");
        }
        if (normalized && findGiftCardByNumber(cards, normalized)) {
          throw new Error("That card number already exists.");
        }
        const number = normalized || nextGiftCardNumber(cards);
        let card = emptyGiftCard(number);
        card.id = generateGiftCardId();
        card = activateGiftCard(card, amount, {
          ...meta,
          purchaserName,
          tenderMethod,
          note,
          managerOverride: gate.usedOverride,
        });
        await persistCard(card);
        await logProtectedPosAction(
          logActivity,
          "giftcards.activate",
          "Gift card activated",
          { cardNumber: number, amount, tenderMethod },
          permissionContext
        );
        onNotify?.(`Activated ${number} with $${Number(amount).toFixed(2)}.`, "success");
        return card;
      } catch (e) {
        onNotify?.(e.message || "Activation failed.", "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [cards, meta, onNotify, logActivity, persistCard, gateAction, permissionContext]
  );

  const reloadCardByNumber = useCallback(
    async ({ cardNumber, amount, tenderMethod, note }) => {
      const gate = gateAction("giftcards.reload");
      if (!gate.allowed) return null;
      setBusy(true);
      try {
        const card = findGiftCardByNumber(cards, cardNumber);
        if (!card) throw new Error("Gift card not found.");
        const next = reloadGiftCard(card, amount, {
          ...meta,
          tenderMethod,
          note,
          managerOverride: gate.usedOverride,
        });
        await persistCard(next);
        await logProtectedPosAction(
          logActivity,
          "giftcards.reload",
          "Gift card reloaded",
          { cardNumber: next.cardNumber, amount, tenderMethod },
          permissionContext
        );
        onNotify?.(`Reloaded ${next.cardNumber}: +$${Number(amount).toFixed(2)} (balance $${giftCardDisplayBalance(next).toFixed(2)}).`, "success");
        return next;
      } catch (e) {
        onNotify?.(e.message || "Reload failed.", "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [cards, meta, onNotify, logActivity, persistCard, gateAction, permissionContext]
  );

  const redeemByNumber = useCallback(
    async ({ cardNumber, amount, invoiceNumber, note }) => {
      const card = findGiftCardByNumber(cards, cardNumber);
      if (!card) throw new Error("Gift card not found.");
      const next = redeemGiftCard(card, amount, { ...meta, invoiceNumber, note });
      await persistCard(next);
      logActivity?.(
        "pos",
        "Gift card redeemed",
        buildPosAuditDetail(
          "giftcards.redeem",
          { cardNumber: next.cardNumber, amount, invoiceNumber, note: note || null },
          permissionContext
        )
      );
      return next;
    },
    [cards, meta, logActivity, persistCard, permissionContext]
  );

  const activateGate = useMemo(
    () => evaluatePosAction("giftcards.activate", permissionContext),
    [permissionContext]
  );
  const reloadGate = useMemo(
    () => evaluatePosAction("giftcards.reload", permissionContext),
    [permissionContext]
  );

  const stats = useMemo(() => {
    const active = cards.filter((row) => row.status === "active").length;
    const outstanding = cards.reduce((sum, row) => sum + giftCardDisplayBalance(row), 0);
    return { count: cards.length, active, outstanding };
  }, [cards]);

  return {
    loading,
    busy,
    cards,
    refresh,
    lookupNumber,
    setLookupNumber,
    balanceLookup,
    activateNewCard,
    reloadCardByNumber,
    redeemByNumber,
    findByNumber: (num) => findGiftCardByNumber(cards, num),
    lookupBalance: (num) => lookupGiftCardBalance(cards, num),
    stats,
    activateGate,
    reloadGate,
  };
}
