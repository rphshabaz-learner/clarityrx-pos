import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../AuthContext";
import { useRoleAccess } from "../../RoleAccessContext";
import { usePosWorkspaceData } from "../../hooks/usePosWorkspaceData";
import PosDemographicBar from "../../components/pos/PosDemographicBar";
import PosFavoritesPanel from "../../components/pos/PosFavoritesPanel";
import PosManagePanel from "../../components/pos/PosManagePanel";
import PosPromotionsPanel from "../../components/pos/promotions/PosPromotionsPanel";
import PosCustomersPanel from "../../components/pos/customers/PosCustomersPanel";
import PosPurchasingPanel from "../../components/pos/purchasing/PosPurchasingPanel";
import PosReportsPanel from "../../components/pos/reports/PosReportsPanel";
import { customerDisplayName } from "../../lib/customers/customerTypes";
import PosSalesRegisterPanel from "../../components/pos/sales/PosSalesRegisterPanel";
import {
  computeCouponDiscount,
  computeLineTotal,
  loyaltyRedemptionAmount,
} from "../../lib/posSalesRegister";
import {
  favoriteItemToCartLine,
  loadPosDemographicConfig,
  loadPosFavoritesConfig,
  savePosDemographicConfig,
  savePosFavoritesConfig,
  serviceItemToCartLine,
} from "../../lib/posFavorites";
import { useSecurelinkPayment } from "../../hooks/useSecurelinkPayment";
import { usePosTill } from "../../context/PosTillContext";
import { isCardPayMethod } from "../../lib/posPayments";
import { clearSuspendedSale, loadSuspendedSale, saveSuspendedSale } from "../../lib/posSuspendedSale";
import { isSecurelinkEnabled, resolveSecurelinkTerminalId } from "../../lib/securelinkConfig";
import { appendCompletedSale } from "../../lib/clarityIndexedDb";
import { getActiveShift } from "../../lib/posShift";
import { buildCompletedSaleSnapshot } from "../../lib/reporting/saleSnapshot";
import { completePosSale, lookupPosPickup, transmitInventoryAdjustments } from "../../services/posApi";
import { POS_DEFAULT_CART, POS_FRONT_STORE_ITEMS } from "./posCatalog";

const POS_WORKSPACE_TABS = [
  { id: "till", label: "Sales" },
  { id: "customers", label: "Customers" },
  { id: "purchasing", label: "Purchasing" },
  { id: "promotions", label: "Promotions" },
  { id: "reports", label: "Reporting & Analytics" },
  { id: "favorites", label: "Favorites" },
  { id: "manage", label: "Manage" },
];

const QUICK_SERVICE_ITEMS = [
  { sku: "SVC-BAG", name: "Reusable bag", price: 0.25 },
  { sku: "SVC-BOTTLE-RETURN", name: "Bottle deposit return", price: -0.1 },
  { sku: "SVC-DELIVERY", name: "Local delivery", price: 6.99 },
];

function clampMoney(value) {
  return Math.max(0, Number(value) || 0);
}

function PosToast({ message, type = "info", duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  const colors = {
    success: { bg: "#ecfdf5", border: "#bbf7d0", text: "#166534" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  };
  const tone = colors[type] || colors.info;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        padding: "12px 16px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      {message}
    </div>
  );
}

export default function PosScreen() {
  const { accessToken, user } = useAuth();
  const { hasPermission } = useRoleAccess();
  const { logActivity, runAutosave } = usePosWorkspaceData();
  const {
    selectedTillNumber,
    registerTillActions,
    setLastCompletedSale,
    refreshSuspendedSale,
    clearSuspended,
    pushHeaderAlert,
    managerOverrideActive,
  } = usePosTill();
  const canPurchasing = hasPermission("pos.purchasing");
  const canPromotions = hasPermission("pos.promotions");
  const canCustomers = hasPermission("pos.customers");
  const canReports = hasPermission("pos.reports");

  const [workspaceTab, setWorkspaceTab] = useState("till");
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [customersPanelSection, setCustomersPanelSection] = useState("profiles");
  const [customersPanelCustomerId, setCustomersPanelCustomerId] = useState("");
  const [favoritesConfig, setFavoritesConfig] = useState(loadPosFavoritesConfig);
  const [demographicConfig, setDemographicConfig] = useState(loadPosDemographicConfig);
  const [selectedDemographicId, setSelectedDemographicId] = useState(
    () => loadPosDemographicConfig().defaultId
  );
  const [showDemographicPrompt, setShowDemographicPrompt] = useState(false);

  const [cart, setCart] = useState(POS_DEFAULT_CART);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [payMethod, setPayMethod] = useState("Credit Card");
  const [search, setSearch] = useState("");
  const [bagScan, setBagScan] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [taxExempt, setTaxExempt] = useState(false);
  const [discountType, setDiscountType] = useState(() => loadPosDemographicConfig().defaultDiscountType || "none");
  const [discountValue, setDiscountValue] = useState(() => loadPosDemographicConfig().defaultDiscountValue || 0);
  const [tenderedAmount, setTenderedAmount] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState("");
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitPayments, setSplitPayments] = useState([
    { method: "Cash", amount: "" },
    { method: "Credit Card", amount: "" },
  ]);
  const [activeDepartment, setActiveDepartment] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [pendingChargeAfterSignature, setPendingChargeAfterSignature] = useState(false);
  const [toast, setToast] = useState(null);
  const [charging, setCharging] = useState(false);
  const [cardPaymentStatus, setCardPaymentStatus] = useState(null);
  const lastAutoAddIdentifier = useRef("");
  const { processCardPayment, cancelActivePayment } = useSecurelinkPayment();
  const securelinkActive = isSecurelinkEnabled();

  const effectiveDemographicId = demographicConfig.skipPrompt
    ? demographicConfig.defaultId
    : selectedDemographicId;
  const demographicLabel =
    demographicConfig.options.find((o) => o.id === effectiveDemographicId)?.label || "General Customer";

  const normalizedSearch = search.trim().toLowerCase();
  const normalizedBagScan = bagScan.trim();

  const filteredStoreItems = useMemo(() => {
    if (!normalizedSearch) return POS_FRONT_STORE_ITEMS;
    return POS_FRONT_STORE_ITEMS.filter((item) =>
      [item.sku, item.barcode, item.name, item.category].some((value) =>
        String(value).toLowerCase().includes(normalizedSearch)
      )
    );
  }, [normalizedSearch]);

  const exactPosIdentifierMatch = useMemo(() => {
    if (!normalizedSearch) return null;
    return (
      POS_FRONT_STORE_ITEMS.find((item) =>
        [item.sku, item.barcode].some((value) => String(value).toLowerCase() === normalizedSearch)
      ) ?? null
    );
  }, [normalizedSearch]);

  const rxCopay = selectedPickup ? Number(selectedPickup.totalCopay || 0) : 0;

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((row) => row.sku === item.sku);
      if (existing) {
        return prev.map((row) => (row.sku === item.sku ? { ...row, qty: row.qty + 1 } : row));
      }
      return [
        ...prev,
        {
          sku: item.sku,
          name: item.name,
          category: item.category || "OTC",
          qty: 1,
          price: item.price,
        },
      ];
    });
    setToast({ message: `${item.name} added to cart`, type: "success" });
  }, []);

  const addServiceItem = useCallback(
    (item) => {
      addToCart(serviceItemToCartLine(item));
    },
    [addToCart]
  );

  const addFavoriteToCart = useCallback(
    (favoriteItem) => {
      addToCart(favoriteItemToCartLine(favoriteItem));
      setWorkspaceTab("till");
    },
    [addToCart]
  );

  const handleBagScan = useCallback(
    async (barcode) => {
      const value = String(barcode || "").trim();
      if (!value || !accessToken) return;
      try {
        const pickup = await lookupPosPickup(value, accessToken);
        if (!pickup) {
          setToast({ message: "No pickup found for this barcode.", type: "warning" });
          return;
        }
        setSelectedPickup(pickup);
        setToast({
          message: `${pickup.rxCount} Rx attached ($${Number(pickup.totalCopay || 0).toFixed(2)})`,
          type: "success",
        });
        setBagScan("");
      } catch (cause) {
        setToast({ message: cause?.message || "Bag lookup failed.", type: "error" });
      }
    },
    [accessToken]
  );

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key !== "Enter") return;
      if (!filteredStoreItems[0]) return;
      e.preventDefault();
      addToCart(filteredStoreItems[0]);
    },
    [addToCart, filteredStoreItems]
  );

  const handleBagScanKeyDown = useCallback(
    (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      handleBagScan(normalizedBagScan);
    },
    [handleBagScan, normalizedBagScan]
  );

  useEffect(() => {
    if (!normalizedSearch || !exactPosIdentifierMatch) {
      lastAutoAddIdentifier.current = "";
      return;
    }
    if (lastAutoAddIdentifier.current === normalizedSearch) return;
    lastAutoAddIdentifier.current = normalizedSearch;
    addToCart(exactPosIdentifierMatch);
    setSearch("");
  }, [addToCart, exactPosIdentifierMatch, normalizedSearch]);

  const removeFromCart = useCallback((sku) => {
    setCart((prev) => prev.filter((row) => row.sku !== sku));
  }, []);

  const updateCartQty = useCallback((sku, nextQty) => {
    setCart((prev) =>
      prev
        .map((row) => (row.sku === sku ? { ...row, qty: Math.max(0, Number(nextQty) || 0) } : row))
        .filter((row) => row.qty > 0)
    );
  }, []);

  const updateCartPrice = useCallback((sku, nextPrice) => {
    if (!managerOverrideActive) return;
    setCart((prev) =>
      prev.map((row) => (row.sku === sku ? { ...row, price: Math.max(0, Number(nextPrice) || 0) } : row))
    );
  }, [managerOverrideActive]);

  const updateLineDiscount = useCallback((sku, nextDiscount) => {
    setCart((prev) =>
      prev.map((row) =>
        row.sku === sku ? { ...row, lineDiscount: Math.max(0, Number(nextDiscount) || 0) } : row
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedPickup(null);
    setSearch("");
    setBagScan("");
    setSaleNote("");
    setTenderedAmount("");
    setCouponCode("");
    setAppliedCouponCode("");
    setLoyaltyPoints("");
    setSplitEnabled(false);
    setSignatureDataUrl(null);
    setToast({ message: "Register cleared.", type: "info" });
  }, []);

  const buildSaleSnapshot = useCallback(
    () => ({
      savedAt: Date.now(),
      tillNumber: selectedTillNumber,
      cart,
      selectedPickup,
      payMethod,
      saleNote,
      taxExempt,
      discountType,
      discountValue,
      tenderedAmount,
      couponCode: appliedCouponCode,
      loyaltyPoints,
      splitEnabled,
      splitPayments,
      signatureDataUrl,
      selectedDemographicId,
      workspaceTab,
    }),
    [
      appliedCouponCode,
      cart,
      discountType,
      discountValue,
      loyaltyPoints,
      payMethod,
      saleNote,
      selectedDemographicId,
      selectedPickup,
      selectedTillNumber,
      signatureDataUrl,
      splitEnabled,
      splitPayments,
      taxExempt,
      tenderedAmount,
      workspaceTab,
    ]
  );

  const restoreSaleSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    setCart(Array.isArray(snapshot.cart) ? snapshot.cart : []);
    setSelectedPickup(snapshot.selectedPickup || null);
    setPayMethod(snapshot.payMethod || "Credit Card");
    setSaleNote(snapshot.saleNote || "");
    setTaxExempt(Boolean(snapshot.taxExempt));
    setDiscountType(snapshot.discountType || "none");
    setDiscountValue(snapshot.discountValue || 0);
    setTenderedAmount(snapshot.tenderedAmount || "");
    setAppliedCouponCode(snapshot.couponCode || "");
    setCouponCode(snapshot.couponCode || "");
    setLoyaltyPoints(snapshot.loyaltyPoints || "");
    setSplitEnabled(Boolean(snapshot.splitEnabled));
    setSplitPayments(
      Array.isArray(snapshot.splitPayments) && snapshot.splitPayments.length
        ? snapshot.splitPayments
        : [
            { method: "Cash", amount: "" },
            { method: "Credit Card", amount: "" },
          ]
    );
    setSignatureDataUrl(snapshot.signatureDataUrl || null);
    setSelectedDemographicId(snapshot.selectedDemographicId || demographicConfig.defaultId);
    setWorkspaceTab(snapshot.workspaceTab === "till" ? "till" : "till");
    setBagScan("");
    setSearch("");
  }, [demographicConfig.defaultId]);

  const handleSuspendSale = useCallback(() => {
    if (cart.length === 0 && !selectedPickup) {
      setToast({ message: "Nothing on the till to suspend.", type: "warning" });
      return false;
    }
    const snapshot = buildSaleSnapshot();
    saveSuspendedSale(snapshot);
    refreshSuspendedSale();
    clearCart();
    pushHeaderAlert({ id: "suspended-sale", tone: "warn", message: "Sale suspended — use Resume when ready." });
    logActivity("pos", "Sale suspended", { tillNumber: selectedTillNumber, lines: cart.length });
    setToast({ message: "Sale suspended.", type: "success" });
    return true;
  }, [
    buildSaleSnapshot,
    cart.length,
    clearCart,
    logActivity,
    pushHeaderAlert,
    refreshSuspendedSale,
    selectedPickup,
    selectedTillNumber,
  ]);

  const handleResumeSale = useCallback(() => {
    const snapshot = loadSuspendedSale();
    if (!snapshot) {
      setToast({ message: "No suspended sale found.", type: "warning" });
      return false;
    }
    restoreSaleSnapshot(snapshot);
    clearSuspendedSale();
    clearSuspended();
    refreshSuspendedSale();
    logActivity("pos", "Sale resumed", { tillNumber: selectedTillNumber });
    setToast({ message: "Suspended sale restored.", type: "success" });
    return true;
  }, [clearSuspended, logActivity, refreshSuspendedSale, restoreSaleSnapshot, selectedTillNumber]);

  const handleNoSale = useCallback(() => {
    logActivity("pos", "No sale — drawer open", { tillNumber: selectedTillNumber });
    setToast({ message: "No sale recorded. Cash drawer signal sent.", type: "info" });
    return true;
  }, [logActivity, selectedTillNumber]);

  const handleCustomerLookup = useCallback(
    async (query) => {
      const value = String(query || "").trim();
      if (!value) return false;

      if (canCustomers) {
        const { searchPosCustomers } = await import("../../lib/customers/customerSearch");
        const { listPosCustomers } = await import("../../lib/clarityIndexedDb");
        const rows = await listPosCustomers();
        const hit = searchPosCustomers(rows, value)[0];
        if (hit) {
          setActiveCustomer(hit);
          setCustomersPanelCustomerId(hit.id);
          setCustomersPanelSection("profiles");
          setWorkspaceTab("customers");
          setToast({ message: `Customer: ${customerDisplayName(hit)} (${hit.accountNumber})`, type: "success" });
          return true;
        }
      }

      setWorkspaceTab("till");
      if (/^[A-Za-z0-9-]+$/.test(value) && value.length >= 4) {
        await handleBagScan(value);
        return true;
      }
      setSearch(value);
      setToast({ message: `Searching inventory for “${value}”.`, type: "info" });
      return true;
    },
    [canCustomers, handleBagScan]
  );

  const handleAttachCustomerToTill = useCallback((customer) => {
    if (!customer) return;
    setActiveCustomer(customer);
    setWorkspaceTab("till");
    if (customer.taxExempt?.enabled) {
      setTaxExempt(true);
    }
    if (customer.seniorDiscount?.enabled) {
      setDiscountType("percent");
      setDiscountValue(customer.seniorDiscount.percent ?? 10);
    }
    if (Number(customer.loyalty?.pointsBalance) > 0) {
      setLoyaltyPoints(String(customer.loyalty.pointsBalance));
    }
    const alerts = (customer.notes || []).filter((n) => n.severity === "alert");
    if (alerts.length) {
      pushHeaderAlert({
        id: `customer-alert-${customer.id}`,
        tone: "warn",
        message: `${customerDisplayName(customer)}: ${alerts[0].text}`,
      });
    }
    setToast({ message: `${customerDisplayName(customer)} attached to till.`, type: "success" });
    logActivity("pos", "Customer attached to till", {
      customerId: customer.id,
      accountNumber: customer.accountNumber,
      tillNumber: selectedTillNumber,
    });
  }, [logActivity, pushHeaderAlert, selectedTillNumber]);

  const accountCustomerLabel = activeCustomer
    ? `${customerDisplayName(activeCustomer)} · ${activeCustomer.accountNumber || ""}`
    : "";

  const handleAttachPickup = useCallback((pickup) => {
    if (!pickup) return false;
    setSelectedPickup(pickup);
    setWorkspaceTab("till");
    setToast({
      message: `${pickup.rxCount || 1} Rx attached ($${Number(pickup.totalCopay || 0).toFixed(2)})`,
      type: "success",
    });
    return true;
  }, []);

  const handleReprintReceipt = useCallback(
    (sale) => {
      const invoice = sale?.invoiceNumber || "—";
      const total = Number(sale?.total || 0).toFixed(2);
      logActivity("pos", "Receipt reprint", { invoiceNumber: invoice, tillNumber: selectedTillNumber });
      setToast({ message: `Reprint queued for invoice ${invoice} ($${total}).`, type: "success" });
      return true;
    },
    [logActivity, selectedTillNumber]
  );

  useEffect(() => {
    registerTillActions({
      suspendSale: handleSuspendSale,
      resumeSale: handleResumeSale,
      noSale: handleNoSale,
      customerLookup: handleCustomerLookup,
      attachPickup: handleAttachPickup,
      reprintReceipt: handleReprintReceipt,
      managerOverride: () => {
        logActivity("pos", "Manager override enabled", { tillNumber: selectedTillNumber });
      },
      priceCheck: () => true,
    });
    return () => registerTillActions(null);
  }, [
    handleAttachPickup,
    handleCustomerLookup,
    handleNoSale,
    handleReprintReceipt,
    handleResumeSale,
    handleSuspendSale,
    logActivity,
    registerTillActions,
    selectedTillNumber,
  ]);

  useEffect(() => {
    if (loadSuspendedSale()) {
      pushHeaderAlert({
        id: "suspended-sale",
        tone: "warn",
        message: "Suspended sale on this till — tap Resume to continue.",
      });
    }
  }, [pushHeaderAlert]);

  const otcSubtotal = cart.reduce((sum, item) => sum + computeLineTotal(item), 0);
  const discountBase = Math.max(0, otcSubtotal);
  const discount =
    discountType === "percent"
      ? Math.min(discountBase, discountBase * (clampMoney(discountValue) / 100))
      : discountType === "amount"
        ? Math.min(discountBase, clampMoney(discountValue))
        : 0;
  const afterCartDiscount = Math.max(0, otcSubtotal - discount);
  const couponDiscount = computeCouponDiscount(appliedCouponCode, afterCartDiscount);
  const afterCoupon = Math.max(0, afterCartDiscount - couponDiscount);
  const loyaltyRedemption = loyaltyRedemptionAmount(loyaltyPoints, afterCoupon);
  const taxableSubtotal = Math.max(0, afterCoupon - loyaltyRedemption);
  const taxRate = Number(demographicConfig.taxRate) || 0;
  const tax = taxExempt ? 0 : taxableSubtotal * taxRate;
  const total = Math.max(0, taxableSubtotal + tax + rxCopay);
  const numericTenderedAmount = Number(tenderedAmount);
  const changeDue = payMethod === "Cash" && Number.isFinite(numericTenderedAmount)
    ? Math.max(0, numericTenderedAmount - total)
    : 0;

  const persistDemographics = useCallback((next) => {
    setDemographicConfig(next);
    savePosDemographicConfig(next);
  }, []);

  const runCharge = async () => {
    if (!accessToken) {
      setToast({ message: "Sign in required to complete sale.", type: "error" });
      return;
    }

    setCharging(true);
    setCardPaymentStatus(null);
    try {
      let cardPayment = null;
      const cardSplitRow = splitEnabled
        ? splitPayments.find((row) => isCardPayMethod(row.method) && Number(row.amount) > 0)
        : null;
      const cardAmount = cardSplitRow ? Number(cardSplitRow.amount) : total;
      const cardMethod = cardSplitRow?.method || payMethod;
      if (securelinkActive && (isCardPayMethod(payMethod) || cardSplitRow)) {
        const terminalId = resolveSecurelinkTerminalId(selectedTillNumber, demographicConfig);
        cardPayment = await processCardPayment({
          amount: cardAmount,
          payMethod: cardMethod,
          tillNumber: selectedTillNumber,
          terminalId,
          accessToken,
          onStatus: setCardPaymentStatus,
        });
      }

      const result = await completePosSale(
        {
          pickupId: selectedPickup?.id || null,
          cart,
          payMethod: splitEnabled ? "Split" : payMethod,
          tillNumber: selectedTillNumber,
          rxCopay,
          demographic: demographicLabel,
          printMerchantCopy: demographicConfig.printMerchantCopy,
          saleNote: saleNote.trim(),
          discount: {
            type: discountType,
            value: clampMoney(discountValue),
            amount: Number(discount.toFixed(2)),
          },
          couponCode: appliedCouponCode || null,
          couponDiscount: Number(couponDiscount.toFixed(2)),
          loyaltyPointsRedeemed: Number(loyaltyPoints) || 0,
          loyaltyRedemption: Number(loyaltyRedemption.toFixed(2)),
          splitPayments: splitEnabled
            ? splitPayments.map((row) => ({
                method: row.method,
                amount: Number(Number(row.amount).toFixed(2)),
              }))
            : null,
          signatureCaptured: Boolean(signatureDataUrl),
          signatureImage: signatureDataUrl || null,
          taxExempt,
          tenderedAmount: Number.isFinite(numericTenderedAmount) ? numericTenderedAmount : null,
          changeDue: Number(changeDue.toFixed(2)),
          cardPayment: cardPayment
            ? {
                reference: cardPayment.reference || cardPayment.authCode,
                authCode: cardPayment.authCode,
                last4: cardPayment.last4,
                cardBrand: cardPayment.cardBrand,
                entryMethod: cardPayment.entryMethod,
                terminalId: resolveSecurelinkTerminalId(selectedTillNumber, demographicConfig),
              }
            : null,
        },
        accessToken
      );

      const inventoryLines = cart
        .filter((line) => line?.sku && Number(line.qty) > 0)
        .map((line) => ({
          sku: String(line.sku),
          quantityDelta: -Math.abs(Number(line.qty)),
        }));
      if (inventoryLines.length > 0) {
        try {
          await transmitInventoryAdjustments(inventoryLines, accessToken, {
            tillNumber: selectedTillNumber,
            invoiceNumber: result?.invoiceNumber || null,
          });
        } catch (inventoryError) {
          console.warn("inventory transmit", inventoryError?.message || inventoryError);
        }
      }

      const merchantNote =
        payMethod !== "Cash" && !demographicConfig.printMerchantCopy ? " Merchant copy skipped." : "";

      setToast({
        message: result.writebackWarning
          ? `Charged $${total.toFixed(2)}. ${result.writebackWarning}${merchantNote}`
          : `Charged $${total.toFixed(2)} via ${payMethod} · ${demographicLabel}${merchantNote}`,
        type: result.writebackWarning ? "warning" : "success",
      });
      logActivity("pos", "POS charge completed", {
        total: Number(total.toFixed(2)),
        subtotal: Number(otcSubtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        payMethod,
        tillNumber: selectedTillNumber,
        demographic: demographicLabel,
        lineItems: cart.length,
        pickupId: selectedPickup?.id || null,
        invoiceNumber: result.invoiceNumber,
      });
      try {
        const saleSnapshot = buildCompletedSaleSnapshot({
          cart,
          result,
          totals: {
            subtotal: otcSubtotal,
            discount,
            couponDiscount,
            tax,
            total,
          },
          payMethod: splitEnabled ? "Split" : payMethod,
          splitPayments: splitEnabled ? splitPayments : null,
          tillNumber: selectedTillNumber,
          shift: getActiveShift(),
          user,
          rxCopay,
          demographicLabel,
          tenderedAmount: Number.isFinite(numericTenderedAmount) ? numericTenderedAmount : null,
          changeDue,
          taxExempt,
        });
        await appendCompletedSale(saleSnapshot);
      } catch (reportError) {
        console.warn("completed sale snapshot", reportError?.message || reportError);
      }
      setLastCompletedSale({
        invoiceNumber: result.invoiceNumber,
        total: Number(total.toFixed(2)),
        payMethod,
        tillNumber: selectedTillNumber,
        chargedAt: Date.now(),
        lineItems: cart.length,
      });
      runAutosave();
      setCart([]);
      setSearch("");
      setSaleNote("");
      setTenderedAmount("");
      setCouponCode("");
      setAppliedCouponCode("");
      setLoyaltyPoints("");
      setSplitEnabled(false);
      setSignatureDataUrl(null);
      setSelectedPickup(null);
      setSelectedDemographicId(demographicConfig.defaultId);
    } catch (cause) {
      setToast({ message: cause?.message || "Payment error", type: "error" });
    } finally {
      setCharging(false);
      setCardPaymentStatus(null);
      setShowDemographicPrompt(false);
    }
  };

  const handleCancelCardPayment = async () => {
    await cancelActivePayment(accessToken);
    setCharging(false);
    setCardPaymentStatus(null);
    setToast({ message: "Card payment cancelled.", type: "info" });
  };

  const requiresSignature = useCallback(() => {
    if (signatureDataUrl) return false;
    return isCardPayMethod(payMethod) || total >= 25;
  }, [payMethod, signatureDataUrl, total]);

  const validateSplitPayments = useCallback(() => {
    if (!splitEnabled) return true;
    const amounts = splitPayments.map((row) => Number(row.amount)).filter((value) => Number.isFinite(value));
    if (amounts.length < 2 || amounts.some((value) => value <= 0)) {
      setToast({ message: "Enter an amount for each split payment.", type: "warning" });
      return false;
    }
    const sum = amounts.reduce((acc, value) => acc + value, 0);
    if (Math.abs(sum - total) > 0.02) {
      setToast({
        message: `Split payments must equal $${total.toFixed(2)} (currently $${sum.toFixed(2)}).`,
        type: "warning",
      });
      return false;
    }
    return true;
  }, [splitEnabled, splitPayments, total]);

  const handleApplyCoupon = useCallback(() => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setAppliedCouponCode("");
      return;
    }
    const amount = computeCouponDiscount(code, afterCartDiscount);
    if (!amount) {
      setToast({ message: `Coupon “${code}” is not recognized.`, type: "warning" });
      return;
    }
    setAppliedCouponCode(code);
    setToast({ message: `Coupon ${code} applied (-$${amount.toFixed(2)}).`, type: "success" });
  }, [afterCartDiscount, couponCode]);

  const handleSplitPaymentChange = useCallback((index, field, value) => {
    setSplitPayments((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
  }, []);

  const handleCharge = async () => {
    if (cart.length === 0 && !selectedPickup) {
      setToast({ message: "Cart is empty", type: "warning" });
      return;
    }

    if (!validateSplitPayments()) return;

    if (!demographicConfig.skipPrompt && !showDemographicPrompt) {
      setShowDemographicPrompt(true);
      return;
    }

    if (requiresSignature()) {
      setPendingChargeAfterSignature(true);
      setShowSignatureModal(true);
      return;
    }

    await runCharge();
  };

  const handleSignatureAccept = async (dataUrl) => {
    setSignatureDataUrl(dataUrl);
    setShowSignatureModal(false);
    if (pendingChargeAfterSignature) {
      setPendingChargeAfterSignature(false);
      await runCharge();
    }
  };

  const handleSignatureCancel = () => {
    setShowSignatureModal(false);
    setPendingChargeAfterSignature(false);
  };

  const handleSaveFavorites = ({ tabs, items }) => {
    savePosFavoritesConfig({ tabs, items });
    setFavoritesConfig({ tabs, items });
    setToast({ message: "Favorites saved for this till.", type: "success" });
  };

  const handleSaveDemographics = (next) => {
    persistDemographics(next);
    setDiscountType(next.defaultDiscountType || "none");
    setDiscountValue(next.defaultDiscountValue || 0);
    setToast({ message: "Till options saved.", type: "success" });
  };

  return (
    <div className="crx-content screen-enter">
      {managerOverrideActive ? (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 14px",
            borderRadius: 10,
            background: "#fffbeb",
            border: "1px solid #fde68a",
            fontSize: 13,
            fontWeight: 600,
            color: "#92400e",
          }}
        >
          Manager override is active on this till.
        </div>
      ) : null}

      <PosDemographicBar
        options={demographicConfig.options}
        selectedId={selectedDemographicId}
        defaultId={demographicConfig.defaultId}
        onSelect={setSelectedDemographicId}
        onSetDefault={(id) => persistDemographics({ ...demographicConfig, defaultId: id })}
      />

      <div className="crx-tabs" style={{ marginBottom: 16 }}>
        {POS_WORKSPACE_TABS.filter((tab) => {
          if (tab.id === "purchasing" && !canPurchasing) return false;
          if (tab.id === "promotions" && !canPromotions) return false;
          if (tab.id === "customers" && !canCustomers) return false;
          if (tab.id === "reports" && !canReports) return false;
          return true;
        }).map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`crx-tab${workspaceTab === tab.id ? " active" : ""}`}
            onClick={() => setWorkspaceTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {workspaceTab === "favorites" ? (
        <PosFavoritesPanel
          tabs={favoritesConfig.tabs}
          items={favoritesConfig.items}
          onAddItem={addFavoriteToCart}
        />
      ) : null}

      {workspaceTab === "manage" ? (
        <PosManagePanel
          tabs={favoritesConfig.tabs}
          items={favoritesConfig.items}
          demographicConfig={demographicConfig}
          onSaveFavorites={handleSaveFavorites}
          onSaveDemographics={handleSaveDemographics}
        />
      ) : null}

      {workspaceTab === "customers" ? (
        <PosCustomersPanel
          onNotify={(message, type) => setToast({ message, type: type || "info" })}
          logActivity={logActivity}
          onAttachToTill={handleAttachCustomerToTill}
          onAttachPickup={handleAttachPickup}
          initialSection={customersPanelSection}
          initialCustomerId={customersPanelCustomerId}
          onSectionChange={setCustomersPanelSection}
        />
      ) : null}

      {workspaceTab === "purchasing" ? (
        <PosPurchasingPanel
          accessToken={accessToken}
          tillNumber={selectedTillNumber}
          onNotify={(message, type) => setToast({ message, type: type || "info" })}
          logActivity={logActivity}
        />
      ) : null}

      {workspaceTab === "promotions" ? (
        <PosPromotionsPanel
          onNotify={(message, type) => setToast({ message, type: type || "info" })}
          logActivity={logActivity}
        />
      ) : null}

      {workspaceTab === "reports" ? (
        <PosReportsPanel onNotify={(message, type) => setToast({ message, type: type || "info" })} />
      ) : null}

      {workspaceTab === "till" ? (
        <PosSalesRegisterPanel
          cart={cart}
          selectedPickup={selectedPickup}
          rxCopay={rxCopay}
          demographicLabel={demographicLabel}
          accountCustomerLabel={accountCustomerLabel}
          onClearAccountCustomer={() => setActiveCustomer(null)}
          search={search}
          bagScan={bagScan}
          onSearchChange={setSearch}
          onSearchKeyDown={handleSearchKeyDown}
          onBagScanChange={setBagScan}
          onBagScanKeyDown={handleBagScanKeyDown}
          onClearCart={clearCart}
          onRemoveLine={removeFromCart}
          onUpdateQty={updateCartQty}
          onUpdatePrice={updateCartPrice}
          onUpdateLineDiscount={updateLineDiscount}
          managerOverrideActive={managerOverrideActive}
          favoritesItems={favoritesConfig.items}
          onAddCatalogItem={addToCart}
          onAddFavorite={addFavoriteToCart}
          onFilterDepartment={setActiveDepartment}
          activeDepartment={activeDepartment}
          discountType={discountType}
          discountValue={discountValue}
          onDiscountTypeChange={setDiscountType}
          onDiscountValueChange={setDiscountValue}
          couponCode={couponCode}
          onCouponCodeChange={setCouponCode}
          onApplyCoupon={handleApplyCoupon}
          loyaltyPoints={loyaltyPoints}
          onLoyaltyPointsChange={setLoyaltyPoints}
          taxExempt={taxExempt}
          onTaxExemptChange={setTaxExempt}
          saleNote={saleNote}
          onSaleNoteChange={setSaleNote}
          collectSaleNotes={demographicConfig.collectSaleNotes}
          otcSubtotal={otcSubtotal}
          cartDiscount={discount}
          couponDiscount={couponDiscount}
          loyaltyRedemption={loyaltyRedemption}
          tax={tax}
          taxRate={taxRate}
          total={total}
          payMethod={payMethod}
          onPayMethodChange={setPayMethod}
          splitEnabled={splitEnabled}
          onSplitEnabledChange={setSplitEnabled}
          splitPayments={splitPayments}
          onSplitPaymentChange={handleSplitPaymentChange}
          tenderedAmount={tenderedAmount}
          onTenderedAmountChange={setTenderedAmount}
          quickTenderAmounts={demographicConfig.quickTenderAmounts}
          changeDue={changeDue}
          securelinkActive={securelinkActive}
          demographicConfig={demographicConfig}
          selectedTillNumber={selectedTillNumber}
          charging={charging}
          cardPaymentStatus={cardPaymentStatus}
          onCancelCardPayment={handleCancelCardPayment}
          showDemographicPrompt={showDemographicPrompt && !demographicConfig.skipPrompt}
          onCharge={handleCharge}
          onOpenFavorites={() => setWorkspaceTab("favorites")}
          showSignatureModal={showSignatureModal}
          onSignatureAccept={handleSignatureAccept}
          onSignatureCancel={handleSignatureCancel}
          promptForBag={demographicConfig.promptForBag}
          quickServiceItems={QUICK_SERVICE_ITEMS}
          onAddServiceItem={addServiceItem}
        />
      ) : null}

      {toast ? <PosToast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
