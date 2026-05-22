import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import { appendCompletedSale, listPosCustomers } from "../lib/clarityIndexedDb";
import { searchPosCustomers } from "../lib/customers/customerSearch";
import { customerDisplayName } from "../lib/customers/customerTypes";
import { searchSellableProducts } from "../lib/inventory/frontStoreCatalog";
import { loadPosDemographicConfig } from "../lib/posFavorites";
import { computeLineTotal, loyaltyRedemptionAmount } from "../lib/posSalesRegister";
import { isCardPayMethod } from "../lib/posPayments";
import { buildCompletedSaleSnapshot } from "../lib/reporting/saleSnapshot";
import {
  isSelfCheckoutFeatureEnabled,
  loadSelfCheckoutConfig,
  resolveSelfCheckoutTillNumber,
  saveSelfCheckoutConfig,
} from "../lib/selfCheckout/selfCheckoutConfig";
import { appendSelfCheckoutSession, clearSelfCheckoutSessions, listSelfCheckoutSessions } from "../lib/selfCheckout/selfCheckoutSessions";
import {
  emptyKioskSession,
  RECEIPT_DELIVERY,
  SELF_CHECKOUT_STEPS,
} from "../lib/selfCheckout/selfCheckoutTypes";
import { getActiveShift } from "../lib/posShift";
import { isSecurelinkEnabled, resolveSecurelinkTerminalId } from "../lib/securelinkConfig";
import { useSecurelinkPayment } from "./useSecurelinkPayment";
import { completePosSale, transmitInventoryAdjustments } from "../services/posApi";

function catalogLineToCartLine(item) {
  return {
    sku: item.sku,
    name: item.name,
    category: item.category,
    price: Number(item.price) || 0,
    qty: 1,
    lineDiscount: 0,
  };
}

function mergeCartLine(cart, line) {
  const idx = cart.findIndex((row) => row.sku === line.sku);
  if (idx < 0) return [...cart, line];
  const next = [...cart];
  next[idx] = { ...next[idx], qty: Number(next[idx].qty || 0) + 1 };
  return next;
}

export function useSelfCheckout({ onNotify, logActivity } = {}) {
  const { accessToken, user } = useAuth();
  const { processCardPayment, cancelActivePayment } = useSecurelinkPayment();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [kiosk, setKiosk] = useState(null);
  const [cardPaymentStatus, setCardPaymentStatus] = useState(null);
  const [loyaltyQuery, setLoyaltyQuery] = useState("");
  const [scanBuffer, setScanBuffer] = useState("");

  const featureEnabled = isSelfCheckoutFeatureEnabled();
  const securelinkActive = isSecurelinkEnabled();
  const tillNumber = resolveSelfCheckoutTillNumber(config);
  const demographicConfig = useMemo(() => loadPosDemographicConfig(), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, sessionRows, customerRows] = await Promise.all([
        loadSelfCheckoutConfig(),
        listSelfCheckoutSessions(),
        listPosCustomers(),
      ]);
      setConfig(cfg);
      setSessions(sessionRows);
      setCustomers(customerRows);
    } catch (cause) {
      onNotify?.(cause?.message || "Could not load self-checkout settings.", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveConfig = useCallback(
    async (patch) => {
      setBusy(true);
      try {
        const next = await saveSelfCheckoutConfig({ ...config, ...patch });
        setConfig(next);
        onNotify?.("Self-checkout settings saved.", "success");
        logActivity?.("pos", "Self-checkout config updated", { tillNumber });
        return next;
      } catch (cause) {
        onNotify?.(cause?.message || "Could not save settings.", "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [config, logActivity, onNotify, tillNumber]
  );

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(
      (row) => row.completedAt && new Date(row.completedAt).toDateString() === today
    );
    return {
      todayCount: todaySessions.length,
      todayTotal: todaySessions.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
      lastInvoice: sessions[0]?.invoiceNumber || "—",
    };
  }, [sessions]);

  const loyaltyMatches = useMemo(() => {
    const q = String(loyaltyQuery || "").trim();
    if (!q || q.length < 3) return [];
    return searchPosCustomers(customers, q).slice(0, 8);
  }, [customers, loyaltyQuery]);

  const kioskTotals = useMemo(() => {
    if (!kiosk) return { subtotal: 0, tax: 0, total: 0, loyaltyRedemption: 0 };
    const subtotal = (kiosk.cart || []).reduce((sum, line) => sum + computeLineTotal(line), 0);
    const loyaltyRedemption = loyaltyRedemptionAmount(kiosk.loyaltyPointsRedeemed, subtotal);
    const taxable = Math.max(0, subtotal - loyaltyRedemption);
    const taxRate = Number(demographicConfig.taxRate) || 0;
    const tax = taxable * taxRate;
    const total = taxable + tax;
    return {
      subtotal,
      loyaltyRedemption,
      tax,
      total,
    };
  }, [demographicConfig.taxRate, kiosk]);

  const startKiosk = useCallback(() => {
    if (!featureEnabled) {
      onNotify?.("Self-checkout is disabled for this store.", "warning");
      return;
    }
    const session = emptyKioskSession();
    session.receiptDelivery = config?.defaultReceiptDelivery || RECEIPT_DELIVERY.PRINT;
    session.step = SELF_CHECKOUT_STEPS.SCAN;
    setKiosk(session);
    setScanBuffer("");
    setLoyaltyQuery("");
    setCardPaymentStatus(null);
    logActivity?.("pos", "Self-checkout session started", { tillNumber });
  }, [config?.defaultReceiptDelivery, featureEnabled, logActivity, onNotify, tillNumber]);

  const endKiosk = useCallback(() => {
    setKiosk(null);
    setScanBuffer("");
    setCardPaymentStatus(null);
    void cancelActivePayment(accessToken);
  }, [accessToken, cancelActivePayment]);

  const setKioskStep = useCallback((step) => {
    setKiosk((prev) => (prev ? { ...prev, step } : prev));
  }, []);

  const scanItem = useCallback(
    async (raw) => {
      const query = String(raw || "").trim();
      if (!query) return false;
      const hits = await searchSellableProducts(query);
      const item = hits[0];
      if (!item) {
        onNotify?.(`No product found for “${query}”.`, "warning");
        return false;
      }
      setKiosk((prev) => {
        if (!prev) return prev;
        const line = catalogLineToCartLine(item);
        const cart = mergeCartLine(prev.cart, line);
        return { ...prev, cart, step: SELF_CHECKOUT_STEPS.SCAN };
      });
      setScanBuffer("");
      return true;
    },
    [onNotify]
  );

  const updateCartQty = useCallback((sku, qty) => {
    setKiosk((prev) => {
      if (!prev) return prev;
      const cart = prev.cart
        .map((line) => (line.sku === sku ? { ...line, qty: Math.max(0, Number(qty) || 0) } : line))
        .filter((line) => line.qty > 0);
      return { ...prev, cart };
    });
  }, []);

  const removeCartLine = useCallback((sku) => {
    setKiosk((prev) => {
      if (!prev) return prev;
      return { ...prev, cart: prev.cart.filter((line) => line.sku !== sku) };
    });
  }, []);

  const attachLoyaltyCustomer = useCallback(
    (customer) => {
      if (!customer) return;
      const points = Number(customer.loyalty?.pointsBalance) || 0;
      const cap = config?.maxLoyaltyRedeemPoints;
      const redeemPoints = cap != null ? Math.min(points, Number(cap)) : points;
      setKiosk((prev) =>
        prev
          ? {
              ...prev,
              loyaltyCustomerId: customer.id,
              loyaltyMemberId: customer.loyalty?.memberId || "",
              loyaltyPointsRedeemed: redeemPoints,
            }
          : prev
      );
      setLoyaltyQuery(customerDisplayName(customer));
      onNotify?.(`Loyalty: ${customerDisplayName(customer)}`, "success");
    },
    [config?.maxLoyaltyRedeemPoints, onNotify]
  );

  const skipLoyalty = useCallback(() => {
    setKiosk((prev) =>
      prev
        ? {
            ...prev,
            loyaltyCustomerId: null,
            loyaltyMemberId: "",
            loyaltyPointsRedeemed: 0,
          }
        : prev
    );
    setKioskStep(SELF_CHECKOUT_STEPS.PAYMENT);
  }, [setKioskStep]);

  const completeKioskSale = useCallback(async () => {
    if (!kiosk?.cart?.length) {
      onNotify?.("Cart is empty.", "warning");
      return false;
    }
    if (!accessToken) {
      onNotify?.("Sign in required to complete self-checkout.", "error");
      return false;
    }

    setBusy(true);
    setCardPaymentStatus(null);
    const totals = kioskTotals;
    try {
      let cardPayment = null;
      if (securelinkActive && isCardPayMethod(kiosk.payMethod)) {
        const terminalId = resolveSecurelinkTerminalId(tillNumber, {
          ...demographicConfig,
          securelinkTerminalId: config?.terminalId || demographicConfig.securelinkTerminalId,
        });
        cardPayment = await processCardPayment({
          amount: totals.total,
          payMethod: kiosk.payMethod,
          tillNumber,
          terminalId,
          accessToken,
          onStatus: setCardPaymentStatus,
        });
      }

      const result = await completePosSale(
        {
          pickupId: null,
          cart: kiosk.cart,
          payMethod: kiosk.payMethod,
          tillNumber,
          rxCopay: 0,
          demographic: "Self-checkout",
          printMerchantCopy: false,
          saleNote: `Self-checkout · ${kiosk.receiptDelivery}${kiosk.receiptContact ? ` · ${kiosk.receiptContact}` : ""}`,
          loyaltyPointsRedeemed: Number(kiosk.loyaltyPointsRedeemed) || 0,
          loyaltyRedemption: Number(totals.loyaltyRedemption.toFixed(2)),
          taxExempt: false,
          cardPayment: cardPayment
            ? {
                reference: cardPayment.reference || cardPayment.authCode,
                authCode: cardPayment.authCode,
                last4: cardPayment.last4,
                cardBrand: cardPayment.cardBrand,
                entryMethod: cardPayment.entryMethod,
                terminalId: resolveSecurelinkTerminalId(tillNumber, {
                  ...demographicConfig,
                  securelinkTerminalId: config?.terminalId || demographicConfig.securelinkTerminalId,
                }),
              }
            : null,
        },
        accessToken
      );

      const inventoryLines = kiosk.cart
        .filter((line) => line?.sku && Number(line.qty) > 0)
        .map((line) => ({
          sku: String(line.sku),
          quantityDelta: -Math.abs(Number(line.qty)),
        }));
      if (inventoryLines.length > 0) {
        try {
          await transmitInventoryAdjustments(inventoryLines, accessToken, {
            tillNumber,
            invoiceNumber: result?.invoiceNumber || null,
          });
        } catch (inventoryError) {
          console.warn("self-checkout inventory transmit", inventoryError?.message || inventoryError);
        }
      }

      const shift = getActiveShift();
      const snapshot = buildCompletedSaleSnapshot({
        cart: kiosk.cart,
        result,
        totals: {
          subtotal: totals.subtotal,
          discount: 0,
          couponDiscount: 0,
          loyaltyRedemption: totals.loyaltyRedemption,
          tax: totals.tax,
          total: totals.total,
        },
        payMethod: kiosk.payMethod,
        splitPayments: null,
        tillNumber,
        shift,
        user,
        rxCopay: 0,
        pickupId: null,
        demographicLabel: "Self-checkout",
        tenderedAmount: null,
        changeDue: 0,
        taxExempt: false,
      });
      snapshot.channel = "self_checkout";
      snapshot.receiptDelivery = kiosk.receiptDelivery;
      snapshot.receiptContact = kiosk.receiptContact || null;
      snapshot.loyaltyCustomerId = kiosk.loyaltyCustomerId;
      await appendCompletedSale(snapshot);

      const sessionRow = {
        ...kiosk,
        completedAt: Date.now(),
        status: "completed",
        invoiceNumber: result?.invoiceNumber || null,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        loyaltyRedemption: totals.loyaltyRedemption,
      };
      const nextSessions = await appendSelfCheckoutSession(sessionRow);
      setSessions(nextSessions);

      logActivity?.("pos", "Self-checkout sale completed", {
        invoiceNumber: result?.invoiceNumber,
        tillNumber,
        total: totals.total,
        receiptDelivery: kiosk.receiptDelivery,
      });

      setKiosk((prev) =>
        prev
          ? {
              ...prev,
              step: SELF_CHECKOUT_STEPS.DONE,
              invoiceNumber: result?.invoiceNumber || null,
              subtotal: totals.subtotal,
              tax: totals.tax,
              total: totals.total,
            }
          : prev
      );

      const receiptHint =
        kiosk.receiptDelivery === RECEIPT_DELIVERY.PRINT
          ? " Receipt printing."
          : kiosk.receiptDelivery === RECEIPT_DELIVERY.NONE
            ? ""
            : " Receipt delivery queued.";

      onNotify?.(
        `Thank you! Invoice ${result?.invoiceNumber || "—"} · $${totals.total.toFixed(2)}.${receiptHint}`,
        "success"
      );
      return true;
    } catch (cause) {
      onNotify?.(cause?.message || "Self-checkout payment failed.", "error");
      return false;
    } finally {
      setBusy(false);
    }
  }, [
    accessToken,
    config?.terminalId,
    demographicConfig,
    kiosk,
    kioskTotals,
    logActivity,
    onNotify,
    processCardPayment,
    securelinkActive,
    tillNumber,
    user,
  ]);

  const clearSessions = useCallback(async () => {
    setBusy(true);
    try {
      await clearSelfCheckoutSessions();
      setSessions([]);
      onNotify?.("Session history cleared.", "success");
    } catch (cause) {
      onNotify?.(cause?.message || "Could not clear sessions.", "error");
    } finally {
      setBusy(false);
    }
  }, [onNotify]);

  const updateConfigDraft = useCallback((patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  return {
    loading,
    busy,
    featureEnabled,
    config,
    updateConfigDraft,
    sessions,
    stats,
    tillNumber,
    securelinkActive,
    saveConfig,
    refresh,
    kiosk,
    kioskTotals,
    startKiosk,
    endKiosk,
    setKioskStep,
    scanItem,
    scanBuffer,
    setScanBuffer,
    updateCartQty,
    removeCartLine,
    loyaltyQuery,
    setLoyaltyQuery,
    loyaltyMatches,
    attachLoyaltyCustomer,
    skipLoyalty,
    setKioskPatch: (patch) => setKiosk((prev) => (prev ? { ...prev, ...patch } : prev)),
    cardPaymentStatus,
    completeKioskSale,
    clearSessions,
    cancelCardPayment: () => cancelActivePayment(accessToken),
  };
}
