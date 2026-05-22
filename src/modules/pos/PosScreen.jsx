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
import PosStaffPanel from "../../components/pos/staff/PosStaffPanel";
import PosRxIntegrationPanel from "../../components/pos/rx/PosRxIntegrationPanel";
import PosSelfCheckoutPanel from "../../components/pos/selfcheckout/PosSelfCheckoutPanel";
import PosGiftCardsPanel from "../../components/pos/giftcards/PosGiftCardsPanel";
import PosHandheldPanel from "../../components/pos/handheld/PosHandheldPanel";
import { customerDisplayName } from "../../lib/customers/customerTypes";
import PosSalesRegisterPanel from "../../components/pos/sales/PosSalesRegisterPanel";
import AgeVerificationModal from "../../components/pos/sales/AgeVerificationModal";
import { useAgeRestrictedSale } from "../../hooks/useAgeRestrictedSale";
import { cartLineWithAgeRestriction } from "../../lib/compliance/ageRestrictedProducts";
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
import { canConfigurePosPrivacy } from "../../lib/privacy/dataMinimization";
import { loadPosPrivacyConfig, savePosPrivacyConfig } from "../../lib/privacy/posPrivacyConfig";
import { useSecurelinkPayment } from "../../hooks/useSecurelinkPayment";
import { usePosAccessibility } from "../../context/PosAccessibilityContext";
import { usePosRovingTablist } from "../../hooks/usePosRovingTablist";
import { usePosTill } from "../../context/PosTillContext";
import { usePosRealTimeWarnings } from "../../hooks/usePosRealTimeWarnings";
import { giftCardTenderAmount, isCardPayMethod, requiresGiftCardNumber } from "../../lib/posPayments";
import { sanitizeCardPaymentForStorage } from "../../lib/receipt/paymentReceiptRules";
import { logCardPaymentActivity, runAuditedCardPayment } from "../../lib/pci/cardPaymentAudit";
import { findGiftCardByNumber, lookupGiftCardBalance, redeemGiftCard } from "../../lib/giftCards/giftCardService";
import { normalizeGiftCardNumber } from "../../lib/giftCards/giftCardTypes";
import { clearSuspendedSale, loadSuspendedSale, saveSuspendedSale } from "../../lib/posSuspendedSale";
import {
  canConfigureDeviceTill,
  getDeviceTillBindingSync,
  resolveInitialTillNumber,
  saveDeviceTillBinding,
} from "../../lib/posDeviceTill";
import {
  buildTillRegisterState,
  loadTillRegisterState,
  saveTillRegisterState,
} from "../../lib/posTillRegister";
import { isSecurelinkEnabled, resolveSecurelinkTerminalId } from "../../lib/securelinkConfig";
import {
  appendCompletedSale,
  listCompletedSales,
  listPosGiftCards,
  savePosGiftCard,
} from "../../lib/clarityIndexedDb";
import { saleIncludesCashTender, signalCashDrawerOpen } from "../../lib/posCashDrawer";
import { prepareShiftForCharge, usesTransactionShiftMode } from "../../lib/posShiftMode";
import { logAccessEvent } from "../../lib/access/posAccessLog";
import { isControlledSaleItem, logImmutableAudit } from "../../lib/audit/posImmutableAudit";
import { evaluatePosAction, logProtectedPosAction } from "../../lib/posPermissions";
import { buildCompletedSaleSnapshot } from "../../lib/reporting/saleSnapshot";
import { computePosSaleTaxTotals } from "../../lib/tax/computePosSaleTax";
import { loadPosTaxConfig, savePosTaxConfig } from "../../lib/tax/posTaxConfig";
import { provinceTaxLabel } from "../../lib/tax/canadianProvincialTax";
import { enqueueRxPaymentFromSale } from "../../lib/rx/paymentQueue";
import {
  computeExpectedDrawerCash,
  saveDrawerCountAudit,
} from "../../lib/warnings/posRealTimeWarnings";
import { completePosSale, lookupPosPickup, transmitInventoryAdjustments } from "../../services/posApi";
import { POS_DEFAULT_CART, POS_FRONT_STORE_ITEMS } from "./posCatalog";

const POS_WORKSPACE_TAB_TONES = {
  till: "pay",
  rx: "rx",
  customers: "loyalty",
  giftcards: "pay",
};

const POS_WORKSPACE_TABS = [
  { id: "till", label: "Sales" },
  { id: "selfcheckout", label: "Self Checkout" },
  { id: "rx", label: "Rx Integration" },
  { id: "customers", label: "Customers" },
  { id: "giftcards", label: "Gift Cards" },
  { id: "handheld", label: "Handheld" },
  { id: "purchasing", label: "Purchasing" },
  { id: "promotions", label: "Promotions" },
  { id: "reports", label: "Reporting & Analytics" },
  { id: "staff", label: "Staff" },
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
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
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

const INITIAL_TILL_NUMBER = resolveInitialTillNumber();
const INITIAL_REGISTER_STATE = loadTillRegisterState(INITIAL_TILL_NUMBER);

export default function PosScreen() {
  const { accessToken, user, sessionWarning, effectiveSessionTimeoutMinutes } = useAuth();
  const { hasPermission, activeRole } = useRoleAccess();
  const { logActivity, runAutosave } = usePosWorkspaceData();
  const {
    selectedTillNumber,
    shift,
    registerTillActions,
    setLastCompletedSale,
    refreshSuspendedSale,
    clearSuspended,
    pushHeaderAlert,
    dismissHeaderAlert,
    managerOverrideActive,
    applyDeviceTillBinding,
    deviceTillBinding,
    deviceTillLocked,
    openShift,
    closeShift,
  } = usePosTill();
  const canPurchasing = hasPermission("pos.purchasing");
  const canPromotions = hasPermission("pos.promotions");
  const canCustomers = hasPermission("pos.customers");
  const canReports = hasPermission("pos.reports");
  const canRx = hasPermission("pos.rx");
  const canSelfCheckout = hasPermission("pos.selfcheckout");
  const canGiftCards = hasPermission("pos.giftcards");
  const canHandheld = hasPermission("pos.handheld");
  const canVoid = hasPermission("pos.voids");
  const canDiscount = hasPermission("pos.discounts");
  const canConfigure = hasPermission("pos.configure");
  const canTax = hasPermission("pos.tax");
  const canSecurity = hasPermission("pos.security");
  const canManage = canConfigure || canTax || canSecurity;
  const { keyboardNavigation: a11yKeyboardNav } = usePosAccessibility();

  const accessLogContext = useMemo(
    () => ({
      tillNumber: selectedTillNumber,
      operatorId: user?.id || user?.email || null,
      operatorName: user?.name || user?.username || null,
      activeRole,
      managerOverrideActive,
      hasPermission,
    }),
    [activeRole, hasPermission, managerOverrideActive, selectedTillNumber, user]
  );

  const notifyTill = useCallback(
    (message, type) => setToast({ message, type: type || "info" }),
    []
  );

  const ageRestrictedSale = useAgeRestrictedSale({
    logActivity,
    accessLogContext,
    tillNumber: selectedTillNumber,
    operatorId: user?.id || user?.email || null,
    managerOverrideActive,
    onNotify: notifyTill,
  });

  const [workspaceTab, setWorkspaceTab] = useState("till");

  const visibleWorkspaceTabs = useMemo(
    () =>
      POS_WORKSPACE_TABS.filter((tab) => {
        if (tab.id === "purchasing" && !canPurchasing) return false;
        if (tab.id === "promotions" && !canPromotions) return false;
        if (tab.id === "customers" && !canCustomers) return false;
        if (tab.id === "reports" && !canReports) return false;
        if (tab.id === "staff" && !canReports) return false;
        if (tab.id === "rx" && !canRx) return false;
        if (tab.id === "selfcheckout" && !canSelfCheckout) return false;
        if (tab.id === "giftcards" && !canGiftCards) return false;
        if (tab.id === "handheld" && !canHandheld) return false;
        if (tab.id === "manage" && !canManage) return false;
        return true;
      }),
    [
      canCustomers,
      canGiftCards,
      canHandheld,
      canManage,
      canPromotions,
      canPurchasing,
      canReports,
      canRx,
      canSelfCheckout,
    ]
  );

  const { tablistRef } = usePosRovingTablist({
    enabled: a11yKeyboardNav,
    tabIds: visibleWorkspaceTabs.map((tab) => tab.id),
    activeId: workspaceTab,
    onActivate: setWorkspaceTab,
  });

  const [activeCustomer, setActiveCustomer] = useState(null);
  const [customersPanelSection, setCustomersPanelSection] = useState("profiles");
  const [customersPanelCustomerId, setCustomersPanelCustomerId] = useState("");
  const [favoritesConfig, setFavoritesConfig] = useState(() => loadPosFavoritesConfig(INITIAL_TILL_NUMBER));
  const [demographicConfig, setDemographicConfig] = useState(loadPosDemographicConfig);
  const [taxConfig, setTaxConfig] = useState(loadPosTaxConfig);
  const [privacyConfig, setPrivacyConfig] = useState(loadPosPrivacyConfig);
  const [selectedDemographicId, setSelectedDemographicId] = useState(
    () => INITIAL_REGISTER_STATE?.selectedDemographicId || loadPosDemographicConfig().defaultId
  );
  const [showDemographicPrompt, setShowDemographicPrompt] = useState(false);

  const [cart, setCart] = useState(() =>
    Array.isArray(INITIAL_REGISTER_STATE?.cart) ? INITIAL_REGISTER_STATE.cart : POS_DEFAULT_CART
  );

  const { refreshDrawerAudit } = usePosRealTimeWarnings({
    pushHeaderAlert,
    dismissHeaderAlert,
    cart,
    catalogItems: POS_FRONT_STORE_ITEMS,
    tillNumber: selectedTillNumber,
    activeRole,
    managerOverrideActive,
    sessionWarning,
    sessionTimeoutMinutes: effectiveSessionTimeoutMinutes,
    enabled: Boolean(user),
  });

  const [selectedPickup, setSelectedPickup] = useState(INITIAL_REGISTER_STATE?.selectedPickup || null);
  const [payMethod, setPayMethod] = useState(INITIAL_REGISTER_STATE?.payMethod || "Credit Card");
  const [search, setSearch] = useState("");
  const [bagScan, setBagScan] = useState("");
  const [saleNote, setSaleNote] = useState(INITIAL_REGISTER_STATE?.saleNote || "");
  const [taxExempt, setTaxExempt] = useState(Boolean(INITIAL_REGISTER_STATE?.taxExempt));
  const [discountType, setDiscountType] = useState(
    INITIAL_REGISTER_STATE?.discountType || loadPosDemographicConfig().defaultDiscountType || "none"
  );
  const [discountValue, setDiscountValue] = useState(
    INITIAL_REGISTER_STATE?.discountValue ?? loadPosDemographicConfig().defaultDiscountValue ?? 0
  );
  const [tenderedAmount, setTenderedAmount] = useState(INITIAL_REGISTER_STATE?.tenderedAmount || "");
  const [couponCode, setCouponCode] = useState(INITIAL_REGISTER_STATE?.appliedCouponCode || "");
  const [appliedCouponCode, setAppliedCouponCode] = useState(INITIAL_REGISTER_STATE?.appliedCouponCode || "");
  const [loyaltyPoints, setLoyaltyPoints] = useState(INITIAL_REGISTER_STATE?.loyaltyPoints || "");
  const [splitEnabled, setSplitEnabled] = useState(Boolean(INITIAL_REGISTER_STATE?.splitEnabled));
  const [splitPayments, setSplitPayments] = useState(
    Array.isArray(INITIAL_REGISTER_STATE?.splitPayments) && INITIAL_REGISTER_STATE.splitPayments.length
      ? INITIAL_REGISTER_STATE.splitPayments
      : [
          { method: "Cash", amount: "" },
          { method: "Credit Card", amount: "" },
        ]
  );
  const [activeDepartment, setActiveDepartment] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [pendingChargeAfterSignature, setPendingChargeAfterSignature] = useState(false);
  const [toast, setToast] = useState(null);
  const [charging, setCharging] = useState(false);
  const [cardPaymentStatus, setCardPaymentStatus] = useState(null);
  const [giftCardNumber, setGiftCardNumber] = useState("");
  const [giftCardLookup, setGiftCardLookup] = useState(null);
  const lastAutoAddIdentifier = useRef("");
  const prevTillRef = useRef(selectedTillNumber);
  const registerStateRef = useRef(null);
  const { processCardPayment, cancelActivePayment } = useSecurelinkPayment();
  const securelinkActive = isSecurelinkEnabled();

  const effectiveDemographicId = demographicConfig.skipPrompt
    ? demographicConfig.defaultId
    : selectedDemographicId;
  const demographicLabel =
    demographicConfig.options.find((o) => o.id === effectiveDemographicId)?.label || "General Customer";

  const hydrateActiveCustomer = useCallback(async (customerId) => {
    if (!customerId) {
      setActiveCustomer(null);
      return;
    }
    const { listPosCustomers } = await import("../../lib/clarityIndexedDb");
    const rows = await listPosCustomers();
    const hit = rows.find((row) => row.id === customerId) || null;
    setActiveCustomer(hit);
  }, []);

  const applyRegisterState = useCallback(
    (state) => {
      if (!state) {
        setCart([]);
        setSelectedPickup(null);
        setPayMethod("Credit Card");
        setSaleNote("");
        setTaxExempt(false);
        setDiscountType(demographicConfig.defaultDiscountType || "none");
        setDiscountValue(demographicConfig.defaultDiscountValue || 0);
        setTenderedAmount("");
        setCouponCode("");
        setAppliedCouponCode("");
        setLoyaltyPoints("");
        setSplitEnabled(false);
        setSplitPayments([
          { method: "Cash", amount: "" },
          { method: "Credit Card", amount: "" },
        ]);
        setActiveCustomer(null);
        setSelectedDemographicId(demographicConfig.defaultId);
        return;
      }
      setCart(Array.isArray(state.cart) ? state.cart : []);
      setSelectedPickup(state.selectedPickup || null);
      setPayMethod(state.payMethod || "Credit Card");
      setSaleNote(state.saleNote || "");
      setTaxExempt(Boolean(state.taxExempt));
      setDiscountType(state.discountType || demographicConfig.defaultDiscountType || "none");
      setDiscountValue(state.discountValue ?? demographicConfig.defaultDiscountValue ?? 0);
      setTenderedAmount(state.tenderedAmount || "");
      setAppliedCouponCode(state.appliedCouponCode || "");
      setCouponCode(state.appliedCouponCode || "");
      setLoyaltyPoints(state.loyaltyPoints || "");
      setSplitEnabled(Boolean(state.splitEnabled));
      setSplitPayments(
        Array.isArray(state.splitPayments) && state.splitPayments.length
          ? state.splitPayments
          : [
              { method: "Cash", amount: "" },
              { method: "Credit Card", amount: "" },
            ]
      );
      setSelectedDemographicId(state.selectedDemographicId || demographicConfig.defaultId);
      hydrateActiveCustomer(state.activeCustomerId);
    },
    [demographicConfig, hydrateActiveCustomer]
  );

  const buildRegisterState = useCallback(
    () =>
      buildTillRegisterState({
        cart,
        activeCustomer,
        selectedPickup,
        payMethod,
        saleNote,
        taxExempt,
        discountType,
        discountValue,
        tenderedAmount,
        appliedCouponCode,
        loyaltyPoints,
        splitEnabled,
        splitPayments,
        selectedDemographicId: effectiveDemographicId,
      }),
    [
      activeCustomer,
      appliedCouponCode,
      cart,
      discountType,
      discountValue,
      effectiveDemographicId,
      loyaltyPoints,
      payMethod,
      saleNote,
      selectedPickup,
      splitEnabled,
      splitPayments,
      taxExempt,
      tenderedAmount,
    ]
  );

  useEffect(() => {
    hydrateActiveCustomer(INITIAL_REGISTER_STATE?.activeCustomerId);
  }, [hydrateActiveCustomer]);

  useEffect(() => {
    registerStateRef.current = buildRegisterState();
  }, [buildRegisterState]);

  useEffect(() => {
    const prev = prevTillRef.current;
    if (prev === selectedTillNumber) return;
    saveTillRegisterState(prev, registerStateRef.current || buildRegisterState());
    applyRegisterState(loadTillRegisterState(selectedTillNumber));
    setFavoritesConfig(loadPosFavoritesConfig(selectedTillNumber));
    prevTillRef.current = selectedTillNumber;
  }, [applyRegisterState, selectedTillNumber]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveTillRegisterState(selectedTillNumber, buildRegisterState());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [buildRegisterState, selectedTillNumber]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!giftCardNumber.trim()) {
        if (!cancelled) setGiftCardLookup(null);
        return;
      }
      try {
        const cards = await listPosGiftCards();
        if (!cancelled) {
          setGiftCardLookup(lookupGiftCardBalance(cards, giftCardNumber));
        }
      } catch {
        if (!cancelled) setGiftCardLookup(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [giftCardNumber]);

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

  const applyCartLine = useCallback((line) => {
    setCart((prev) => {
      const existing = prev.find((row) => row.sku === line.sku);
      if (existing) {
        return prev.map((row) =>
          row.sku === line.sku
            ? {
                ...row,
                qty: row.qty + 1,
                ageRestrictionClass: line.ageRestrictionClass || row.ageRestrictionClass,
                controlled: line.controlled ?? row.controlled,
              }
            : row
        );
      }
      return [
        ...prev,
        {
          ...line,
          category: line.category || "OTC",
          qty: line.qty || 1,
          controlled: Boolean(line.controlled || line.controlledSale),
        },
      ];
    });
  }, []);

  const addToCart = useCallback(
    (item) => {
      const line = cartLineWithAgeRestriction(item);
      if (item.controlled != null || item.controlledSale != null) {
        line.controlled = Boolean(item.controlled || item.controlledSale);
      }
      const result = ageRestrictedSale.guardAddToCart(item, () => {
        applyCartLine(line);
        setToast({ message: `${item.name} added to cart`, type: "success" });
      });
      if (result.added) return;
      if (result.pending) {
        setToast({
          message: `Age verification required for ${item.name}.`,
          type: "warning",
        });
      }
    },
    [ageRestrictedSale, applyCartLine]
  );

  const handleAgeVerifyDob = useCallback(
    async (dateOfBirth) => {
      const result = await ageRestrictedSale.submitDobVerification(dateOfBirth);
      if (result?.ok) {
        const pending = ageRestrictedSale.pendingItem;
        ageRestrictedSale.completePendingAdd(() => {
          if (pending) {
            const line = cartLineWithAgeRestriction(pending);
            applyCartLine(line);
            setToast({ message: `${pending.name} added to cart`, type: "success" });
          }
        });
      }
      return result;
    },
    [ageRestrictedSale, applyCartLine]
  );

  const handleAgeManagerOverride = useCallback(
    async (reason) => {
      await ageRestrictedSale.submitManagerOverride(reason);
      const pending = ageRestrictedSale.pendingItem;
      ageRestrictedSale.completePendingAdd(() => {
        if (pending) {
          applyCartLine(cartLineWithAgeRestriction(pending));
          setToast({ message: `${pending.name} added to cart (override).`, type: "success" });
        }
      });
    },
    [ageRestrictedSale, applyCartLine]
  );

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

  const handleDiscountTypeChange = useCallback(
    (value) => {
      if (value !== "none") {
        const discountCheck = evaluatePosAction("sales.discount", accessLogContext);
        if (!discountCheck.allowed) {
          setToast({ message: discountCheck.reason, type: "warning" });
          return;
        }
      }
      setDiscountType(value);
    },
    [accessLogContext]
  );

  const handleDiscountValueChange = useCallback(
    (value) => {
      if (Number(value) > 0) {
        const discountCheck = evaluatePosAction("sales.discount", accessLogContext);
        if (!discountCheck.allowed) {
          setToast({ message: discountCheck.reason, type: "warning" });
          return;
        }
      }
      setDiscountValue(value);
    },
    [accessLogContext]
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

  const removeFromCart = useCallback(
    (sku) => {
      const voidCheck = evaluatePosAction("sales.line_void", accessLogContext);
      if (!voidCheck.allowed) {
        setToast({ message: voidCheck.reason, type: "warning" });
        return;
      }
      const line = cart.find((row) => row.sku === sku);
      setCart((prev) => prev.filter((row) => row.sku !== sku));
      void logAccessEvent(
        logActivity,
        "void",
        "Sale line voided",
        {
          voidKind: "line",
          sku,
          name: line?.name || sku,
          qty: line?.qty ?? null,
          lineTotal: line ? Number(computeLineTotal(line).toFixed(2)) : null,
        },
        accessLogContext
      );
    },
    [accessLogContext, cart, logActivity]
  );

  const updateCartQty = useCallback(
    (sku, nextQty) => {
      const qty = Math.max(0, Number(nextQty) || 0);
      if (qty === 0 && cart.some((row) => row.sku === sku)) {
        const voidCheck = evaluatePosAction("sales.line_void", accessLogContext);
        if (!voidCheck.allowed) {
          setToast({ message: voidCheck.reason, type: "warning" });
          return;
        }
      }
      setCart((prev) =>
        prev
          .map((row) => (row.sku === sku ? { ...row, qty } : row))
          .filter((row) => row.qty > 0)
      );
    },
    [accessLogContext, cart]
  );

  const updateCartPrice = useCallback(
    (sku, nextPrice) => {
      const priceCheck = evaluatePosAction("sales.price_override", accessLogContext);
      if (!priceCheck.allowed) {
        setToast({ message: priceCheck.reason, type: "warning" });
        return;
      }
      const prior = cart.find((row) => row.sku === sku);
      const price = Math.max(0, Number(nextPrice) || 0);
      setCart((prev) => prev.map((row) => (row.sku === sku ? { ...row, price } : row)));
      if (prior && Number(prior.price) !== price) {
        void logProtectedPosAction(
          logActivity,
          "sales.price_override",
          "Line price override",
          {
            sku,
            priorPrice: Number(prior.price),
            newPrice: price,
            accessLogType: "discount_override",
            discountKind: "price",
          },
          accessLogContext
        );
      }
    },
    [accessLogContext, cart, logActivity]
  );

  const updateLineDiscount = useCallback(
    (sku, nextDiscount) => {
      const discountCheck = evaluatePosAction("sales.discount", accessLogContext);
      const lineDiscount = Math.max(0, Number(nextDiscount) || 0);
      if (lineDiscount > 0 && !discountCheck.allowed) {
        setToast({ message: discountCheck.reason, type: "warning" });
        return;
      }
      const prior = cart.find((row) => row.sku === sku);
      setCart((prev) =>
        prev.map((row) => (row.sku === sku ? { ...row, lineDiscount } : row))
      );
      const priorDisc = Number(prior?.lineDiscount) || 0;
      if (lineDiscount > 0 && lineDiscount !== priorDisc) {
        void logAccessEvent(
          logActivity,
          "discount_override",
          "Line discount override",
          {
            discountKind: "line",
            sku,
            priorDiscount: priorDisc,
            lineDiscount,
            managerOverride: managerOverrideActive,
          },
          accessLogContext
        );
      }
    },
    [accessLogContext, cart, logActivity, managerOverrideActive]
  );

  const clearCart = useCallback((options = {}) => {
    if (!options.skipAccessLog && (cart.length > 0 || selectedPickup)) {
      const voidCheck = evaluatePosAction("sales.cart_void", accessLogContext);
      if (!voidCheck.allowed) {
        setToast({ message: voidCheck.reason, type: "warning" });
        return;
      }
      void logAccessEvent(
        logActivity,
        "void",
        "Sale voided (cart cleared)",
        {
          voidKind: "cart",
          lineCount: cart.length,
          hadRxPickup: Boolean(selectedPickup?.id),
          pickupId: selectedPickup?.id || null,
        },
        accessLogContext
      );
    }
    setCart([]);
    ageRestrictedSale.clearVerifications();
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
  }, [accessLogContext, ageRestrictedSale, cart.length, logActivity, selectedPickup]);

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
    saveSuspendedSale(snapshot, selectedTillNumber);
    refreshSuspendedSale();
    const lineCount = cart.length;
    clearCart({ skipAccessLog: true });
    pushHeaderAlert({ id: "suspended-sale", tone: "warn", message: "Sale suspended — use Resume when ready." });
    logActivity("pos", "Sale suspended", { tillNumber: selectedTillNumber, lines: lineCount });
    void logAccessEvent(
      logActivity,
      "void",
      "Sale suspended",
      { voidKind: "suspend", lineCount, pickupId: selectedPickup?.id || null },
      accessLogContext
    );
    setToast({ message: "Sale suspended.", type: "success" });
    return true;
  }, [
    accessLogContext,
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
    const snapshot = loadSuspendedSale(selectedTillNumber);
    if (!snapshot) {
      setToast({ message: "No suspended sale found for this till.", type: "warning" });
      return false;
    }
    restoreSaleSnapshot(snapshot);
    clearSuspendedSale(selectedTillNumber);
    clearSuspended();
    refreshSuspendedSale();
    logActivity("pos", "Sale resumed", { tillNumber: selectedTillNumber });
    setToast({ message: "Suspended sale restored.", type: "success" });
    return true;
  }, [clearSuspended, logActivity, refreshSuspendedSale, restoreSaleSnapshot, selectedTillNumber]);

  const handleNoSale = useCallback(async () => {
    await signalCashDrawerOpen({
      tillNumber: selectedTillNumber,
      reason: "no-sale",
    });
    logActivity("pos", "No sale — drawer open", { tillNumber: selectedTillNumber });
    setToast({ message: "No sale recorded. Cash drawer signal sent.", type: "info" });
    return true;
  }, [logActivity, selectedTillNumber]);

  const handleRecordDrawerCount = useCallback(async () => {
    const raw = window.prompt("Counted cash in drawer ($):", "");
    if (raw == null) return false;
    const countedDrawer = Number(String(raw).replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(countedDrawer) || countedDrawer < 0) {
      setToast({ message: "Enter a valid drawer count.", type: "warning" });
      return false;
    }
    const openingRaw = window.prompt("Opening float in drawer ($, optional):", "0");
    const openingCash =
      openingRaw == null || openingRaw === ""
        ? 0
        : Number(String(openingRaw).replace(/[^0-9.-]/g, ""));
    const sales = await listCompletedSales();
    const expectedDrawer = computeExpectedDrawerCash(sales, selectedTillNumber);
    saveDrawerCountAudit(selectedTillNumber, {
      countedDrawer,
      openingCash: Number.isFinite(openingCash) ? openingCash : 0,
      expectedDrawer,
    });
    refreshDrawerAudit();
    logActivity("pos", "Drawer count recorded", {
      tillNumber: selectedTillNumber,
      countedDrawer,
      expectedDrawer,
      openingCash: Number.isFinite(openingCash) ? openingCash : 0,
    });
    setToast({ message: `Drawer count $${countedDrawer.toFixed(2)} saved.`, type: "success" });
    return true;
  }, [logActivity, refreshDrawerAudit, selectedTillNumber]);

  const transactionShiftMode = useMemo(
    () => usesTransactionShiftMode(deviceTillBinding, demographicConfig),
    [deviceTillBinding, demographicConfig]
  );

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

  const handleAttachCustomerById = useCallback(
    async (customerId) => {
      const { listPosCustomers } = await import("../../lib/clarityIndexedDb");
      const rows = await listPosCustomers();
      const hit = rows.find((row) => row.id === customerId);
      if (hit) handleAttachCustomerToTill(hit);
      else setToast({ message: "Customer not found.", type: "warning" });
    },
    [handleAttachCustomerToTill]
  );

  const accountCustomerLabel = activeCustomer
    ? `${customerDisplayName(activeCustomer)} · ${activeCustomer.accountNumber || ""}`
    : "";

  const handleAttachPickup = useCallback(
    (pickup) => {
      if (!pickup) return false;
      setSelectedPickup(pickup);
      setWorkspaceTab("till");
      setToast({
        message: `${pickup.rxCount || 1} Rx attached ($${Number(pickup.totalCopay || 0).toFixed(2)})`,
        type: "success",
      });
      void logAccessEvent(
        logActivity,
        "rx_transaction",
        "Rx pickup attached to till",
        {
          rxLinked: true,
          pickupId: pickup.id,
          rxCount: pickup.rxCount || 1,
          totalCopay: Number(pickup.totalCopay) || 0,
          patientName: pickup.patientName || null,
        },
        accessLogContext
      );
      return true;
    },
    [accessLogContext, logActivity]
  );

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
        logActivity("pos", "Manager override enabled", {
          tillNumber: selectedTillNumber,
          operatorId: user?.id || user?.email || null,
          operatorRole: user?.role || null,
          durationMinutes: 5,
        });
        void logImmutableAudit(logActivity, {
          user: user?.id || user?.username || user?.email,
          action: "manager_override",
          terminal: selectedTillNumber,
          newValue: "enabled",
          reason: "header_toggle",
          detail: { durationMinutes: 5, operatorRole: user?.role || null },
        });
      },
      priceCheck: () => true,
      recordDrawerCount: handleRecordDrawerCount,
    });
    return () => registerTillActions(null);
  }, [
    handleAttachPickup,
    handleCustomerLookup,
    handleNoSale,
    handleRecordDrawerCount,
    handleReprintReceipt,
    handleResumeSale,
    handleSuspendSale,
    logActivity,
    registerTillActions,
    selectedTillNumber,
    user,
  ]);

  useEffect(() => {
    if (loadSuspendedSale(selectedTillNumber)) {
      pushHeaderAlert({
        id: "suspended-sale",
        tone: "warn",
        message: "Suspended sale on this till — tap Resume to continue.",
      });
    }
  }, [pushHeaderAlert, selectedTillNumber]);

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
  const saleTax = useMemo(
    () =>
      computePosSaleTaxTotals({
        cart,
        computeLineTotal,
        taxableSubtotal,
        taxExempt,
        taxConfig,
        demographicConfig,
      }),
    [cart, taxableSubtotal, taxExempt, taxConfig, demographicConfig]
  );
  const tax = saleTax.tax;
  const taxBreakdown = saleTax.taxBreakdown;
  const taxRate =
    taxableSubtotal > 0 && !taxExempt ? tax / taxableSubtotal : Number(demographicConfig.taxRate) || 0;
  const total = Math.max(0, saleTax.total + rxCopay);
  const numericTenderedAmount = Number(tenderedAmount);
  const changeDue = payMethod === "Cash" && Number.isFinite(numericTenderedAmount)
    ? Math.max(0, numericTenderedAmount - total)
    : 0;

  const persistDemographics = useCallback((next) => {
    setDemographicConfig(next);
    savePosDemographicConfig(next);
  }, []);

  const handleSaveTaxConfig = useCallback((next) => {
    const saved = savePosTaxConfig(next);
    setTaxConfig(saved);
    logActivity("pos", "Tax configuration updated", {
      provinceCode: saved.provinceCode,
      pricingMode: saved.pricingMode,
      hasBusinessNumber: Boolean(saved.businessNumber),
    });
    return saved;
  }, [logActivity]);

  const runCharge = async () => {
    if (!accessToken) {
      setToast({ message: "Sign in required to complete sale.", type: "error" });
      return;
    }

    const operatorId = user?.id || user?.username || "";
    const { shift: chargeShift, ready } = prepareShiftForCharge(selectedTillNumber, {
      openedBy: operatorId,
      transactionMode: transactionShiftMode,
    });
    if (!ready) {
      setToast({
        message: `Open a shift on till ${selectedTillNumber} before charging.`,
        type: "warning",
      });
      return;
    }
    if (transactionShiftMode) {
      openShift();
    }

    setCharging(true);
    setCardPaymentStatus(null);
    try {
      const giftRedeemTotal = giftCardTenderAmount(payMethod, splitEnabled, splitPayments, total);
      if (giftRedeemTotal > 0) {
        const normalized = normalizeGiftCardNumber(giftCardNumber);
        if (!normalized) {
          throw new Error("Enter the gift card number to pay with Gift Card.");
        }
        const cards = await listPosGiftCards();
        const card = findGiftCardByNumber(cards, normalized);
        if (!card) {
          throw new Error("Gift card not found.");
        }
        const redeemed = redeemGiftCard(card, giftRedeemTotal, {
          tillNumber: selectedTillNumber,
          operatorId: user?.id || user?.email || null,
        });
        await savePosGiftCard(redeemed);
        setGiftCardLookup(lookupGiftCardBalance(cards.map((row) => (row.id === redeemed.id ? redeemed : row)), normalized));
      }

      let cardPayment = null;
      const cardSplitRow = splitEnabled
        ? splitPayments.find((row) => isCardPayMethod(row.method) && Number(row.amount) > 0)
        : null;
      const cardAmount = cardSplitRow ? Number(cardSplitRow.amount) : total;
      const cardMethod = cardSplitRow?.method || payMethod;
      if (securelinkActive && (isCardPayMethod(payMethod) || cardSplitRow)) {
        const terminalId = resolveSecurelinkTerminalId(selectedTillNumber, demographicConfig);
        cardPayment = await runAuditedCardPayment({
          logActivity,
          processCardPayment,
          paymentParams: {
            amount: cardAmount,
            payMethod: cardMethod,
            tillNumber: selectedTillNumber,
            terminalId,
            accessToken,
            onStatus: setCardPaymentStatus,
          },
          auditContext: { tillNumber: selectedTillNumber, channel: "register" },
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
          provinceCode: saleTax.provinceCode,
          businessNumber: saleTax.businessNumber || null,
          taxPricingMode: saleTax.pricingMode,
          taxBreakdown: saleTax.taxBreakdownStored,
          tenderedAmount: Number.isFinite(numericTenderedAmount) ? numericTenderedAmount : null,
          changeDue: Number(changeDue.toFixed(2)),
          cardPayment: cardPayment
            ? sanitizeCardPaymentForStorage({
                ...cardPayment,
                terminalId: resolveSecurelinkTerminalId(selectedTillNumber, demographicConfig),
              })
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
        taxBreakdown: saleTax.taxBreakdownStored,
        provinceCode: saleTax.provinceCode,
        payMethod,
        tillNumber: selectedTillNumber,
        demographic: demographicLabel,
        lineItems: cart.length,
        pickupId: selectedPickup?.id || null,
        invoiceNumber: result.invoiceNumber,
      });
      if (selectedPickup?.id || rxCopay > 0) {
        void logAccessEvent(
          logActivity,
          "rx_transaction",
          "Rx-linked POS charge completed",
          {
            rxLinked: true,
            pickupId: selectedPickup?.id || null,
            rxCopay: Number(rxCopay.toFixed(2)),
            invoiceNumber: result.invoiceNumber,
            total: Number(total.toFixed(2)),
            payMethod,
          },
          accessLogContext
        );
      }
      if (discount > 0) {
        void logAccessEvent(
          logActivity,
          "discount_override",
          "Cart discount override",
          {
            discountKind: "cart",
            discountType,
            discountValue: clampMoney(discountValue),
            discountAmount: Number(discount.toFixed(2)),
          },
          accessLogContext
        );
      }
      cart.filter(isControlledSaleItem).forEach((line) => {
        void logImmutableAudit(logActivity, {
          user: accessLogContext.operatorId || accessLogContext.operatorName,
          action: "controlled_item_sale",
          terminal: selectedTillNumber,
          oldValue: line.sku,
          newValue: line.qty,
          detail: {
            name: line.name,
            price: line.price,
            invoiceNumber: result.invoiceNumber,
            total: Number(total.toFixed(2)),
          },
        });
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
          shift: chargeShift,
          user,
          rxCopay,
          pickupId: selectedPickup?.id || null,
          demographicLabel,
          tenderedAmount: Number.isFinite(numericTenderedAmount) ? numericTenderedAmount : null,
          changeDue,
          taxExempt,
          taxBreakdown: saleTax.taxBreakdownStored,
          taxConfig,
          ageVerifications: ageRestrictedSale.verifications,
          ageComplianceConfig: ageRestrictedSale.ageConfig,
        });
        await appendCompletedSale(saleSnapshot);
        await ageRestrictedSale.logControlledSaleIfNeeded(cart);
        ageRestrictedSale.clearVerifications();
        if (rxCopay > 0 || selectedPickup?.id) {
          try {
            await enqueueRxPaymentFromSale({
              invoiceNumber: result.invoiceNumber,
              pickupId: selectedPickup?.id || null,
              rxCopay,
              otcTotal: otcSubtotal,
              payMethod: splitEnabled ? "Split" : payMethod,
              tillNumber: selectedTillNumber,
              customerAccount: activeCustomer?.accountNumber || null,
              krollPatientId: activeCustomer?.rxProfile?.krollPatientId || null,
              rxNumbers: selectedPickup?.rxNumbers || [],
            });
          } catch (queueError) {
            console.warn("rx payment queue", queueError?.message || queueError);
          }
        }
      } catch (reportError) {
        if (reportError?.code === "POS_INVOICE_DUPLICATE") {
          setToast({
            message: reportError.message,
            type: "error",
          });
        } else {
          console.warn("completed sale snapshot", reportError?.message || reportError);
        }
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
      setGiftCardNumber("");
      setGiftCardLookup(null);
      setSignatureDataUrl(null);
      setSelectedPickup(null);
      setSelectedDemographicId(demographicConfig.defaultId);

      if (saleIncludesCashTender(payMethod, splitEnabled, splitPayments)) {
        await signalCashDrawerOpen({
          tillNumber: selectedTillNumber,
          reason: "sale",
          detail: { invoiceNumber: result.invoiceNumber },
        });
      }
      if (transactionShiftMode) {
        closeShift();
      }
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
    await logCardPaymentActivity(logActivity, "Card payment cancelled", {
      tillNumber: selectedTillNumber,
      channel: "register",
      outcome: "cancelled",
    });
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

    const ageGate = ageRestrictedSale.assertCheckoutCompliance(cart);
    if (!ageGate.ok) {
      setToast({ message: ageGate.message, type: "warning" });
      return;
    }

    if (!validateSplitPayments()) return;

    if (requiresGiftCardNumber(payMethod, splitEnabled, splitPayments)) {
      const normalized = normalizeGiftCardNumber(giftCardNumber);
      if (!normalized) {
        setToast({ message: "Enter the gift card number for this payment.", type: "warning" });
        return;
      }
      const redeemAmount = giftCardTenderAmount(payMethod, splitEnabled, splitPayments, total);
      const lookup = giftCardLookup || (await listPosGiftCards().then((cards) => lookupGiftCardBalance(cards, normalized)));
      if (!lookup?.found) {
        setToast({ message: lookup?.message || "Gift card not found.", type: "error" });
        return;
      }
      if (lookup.balance < redeemAmount - 0.001) {
        setToast({
          message: `Insufficient gift card balance ($${lookup.balance.toFixed(2)} available).`,
          type: "error",
        });
        return;
      }
      if (lookup.status === "inactive" || lookup.status === "suspended") {
        setToast({ message: lookup.message || "Gift card cannot be used.", type: "error" });
        return;
      }
    }

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
    savePosFavoritesConfig({ tabs, items }, selectedTillNumber);
    setFavoritesConfig({ tabs, items });
    setToast({ message: `Favorites saved for till ${selectedTillNumber}.`, type: "success" });
  };

  const handleSaveDemographics = (next) => {
    persistDemographics(next);
    setDiscountType(next.defaultDiscountType || "none");
    setDiscountValue(next.defaultDiscountValue || 0);
    setToast({ message: "Till options saved.", type: "success" });
  };

  const handleSavePrivacy = (next) => savePosPrivacyConfig(next);

  const isCashierView = workspaceTab === "till";

  return (
    <div
      className={`crx-content screen-enter${isCashierView ? " crx-content--cashier" : ""}`}
      role="tabpanel"
      id={`pos-workspace-panel-${workspaceTab}`}
      aria-labelledby={`pos-workspace-tab-${workspaceTab}`}
    >
      {managerOverrideActive ? (
        <div className="crx-manager-banner" role="status">
          Controlled override active — price edits and restricted actions allowed for 5 minutes.
        </div>
      ) : null}

      <PosDemographicBar
        options={demographicConfig.options}
        selectedId={selectedDemographicId}
        defaultId={demographicConfig.defaultId}
        onSelect={setSelectedDemographicId}
        onSetDefault={(id) => persistDemographics({ ...demographicConfig, defaultId: id })}
      />

      <div
        ref={tablistRef}
        className={`crx-tabs${isCashierView ? " crx-tabs--large" : ""}`}
        style={isCashierView ? undefined : { marginBottom: 16 }}
        role="tablist"
        aria-label="POS workspace sections"
      >
        {visibleWorkspaceTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab-id={tab.id}
            id={`pos-workspace-tab-${tab.id}`}
            aria-selected={workspaceTab === tab.id}
            aria-controls={`pos-workspace-panel-${tab.id}`}
            tabIndex={workspaceTab === tab.id ? 0 : -1}
            className={`crx-tab${isCashierView ? " crx-tab--large" : ""}${POS_WORKSPACE_TAB_TONES[tab.id] ? ` crx-tab--tone-${POS_WORKSPACE_TAB_TONES[tab.id]}` : ""}${workspaceTab === tab.id ? " active" : ""}`}
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
          taxConfig={taxConfig}
          onSaveTaxConfig={handleSaveTaxConfig}
          privacyConfig={privacyConfig}
          canConfigurePrivacy={canSecurity}
          canConfigure={canConfigure}
          canTax={canTax}
          canSecurity={canSecurity}
          deviceTillBinding={deviceTillBinding || getDeviceTillBindingSync()}
          deviceTillLocked={deviceTillLocked}
          canConfigureDeviceTill={canConfigureDeviceTill(activeRole)}
          operatorId={user?.id || user?.username || ""}
          onSavePrivacy={(next) => {
            const saved = handleSavePrivacy(next);
            setPrivacyConfig(saved);
            return saved;
          }}
          onNotify={(message, type) => setToast({ message, type: type || "info" })}
          logActivity={logActivity}
          onSaveDeviceTill={async (config) => {
            const saved = await saveDeviceTillBinding({
              tillNumber: config.tillNumber,
              locked: config.locked,
              configuredBy: user?.id || user?.username || "",
            });
            applyDeviceTillBinding({
              tillNumber: saved.tillNumber,
              locked: saved.locked,
              source: saved.source,
              configuredAt: saved.configuredAt,
              configuredBy: saved.configuredBy,
            });
            setToast({
              message: saved.locked
                ? `This workstation is locked to till ${saved.tillNumber}.`
                : `Workstation till set to ${saved.tillNumber}.`,
              type: "success",
            });
          }}
          onSaveFavorites={handleSaveFavorites}
          onSaveDemographics={handleSaveDemographics}
          ageComplianceConfig={ageRestrictedSale.ageConfig}
          onSaveAgeCompliance={(saved) => {
            ageRestrictedSale.setAgeConfig(saved);
            ageRestrictedSale.refreshAgeConfig();
          }}
        />
      ) : null}

      {workspaceTab === "selfcheckout" ? (
        <PosSelfCheckoutPanel
          onNotify={(message, type) => setToast({ message, type: type || "info" })}
          logActivity={logActivity}
        />
      ) : null}

      {workspaceTab === "rx" ? (
        <PosRxIntegrationPanel
          onNotify={(message, type) => setToast({ message, type: type || "info" })}
          logActivity={logActivity}
          accessLogContext={accessLogContext}
          onAttachPickup={handleAttachPickup}
          onAttachCustomer={handleAttachCustomerById}
          onOpenSales={() => setWorkspaceTab("till")}
          onOpenCustomers={() => {
            setCustomersPanelSection("pharmacy");
            setWorkspaceTab("customers");
          }}
        />
      ) : null}

      {workspaceTab === "giftcards" ? (
        <PosGiftCardsPanel
          onNotify={(message, type) => setToast({ message, type: type || "info" })}
          logActivity={logActivity}
          tillNumber={selectedTillNumber}
          operatorId={user?.id || user?.email}
        />
      ) : null}

      {workspaceTab === "customers" ? (
        <PosCustomersPanel
          onNotify={(message, type) => setToast({ message, type: type || "info" })}
          logActivity={logActivity}
          accessLogContext={accessLogContext}
          onAttachToTill={handleAttachCustomerToTill}
          onAttachPickup={handleAttachPickup}
          initialSection={customersPanelSection}
          initialCustomerId={customersPanelCustomerId}
          onSectionChange={setCustomersPanelSection}
        />
      ) : null}

      {workspaceTab === "handheld" ? (
        <PosHandheldPanel
          accessToken={accessToken}
          tillNumber={selectedTillNumber}
          onNotify={(message, type) => setToast({ message, type: type || "info" })}
          logActivity={logActivity}
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

      {workspaceTab === "staff" ? (
        <PosStaffPanel onNotify={(message, type) => setToast({ message, type: type || "info" })} />
      ) : null}

      {workspaceTab === "till" ? (
        <div className="crx-cashier-register">
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
          canVoid={canVoid}
          canDiscount={canDiscount}
          managerOverrideActive={managerOverrideActive}
          favoritesItems={favoritesConfig.items}
          onAddCatalogItem={addToCart}
          onAddFavorite={addFavoriteToCart}
          onFilterDepartment={setActiveDepartment}
          activeDepartment={activeDepartment}
          discountType={discountType}
          discountValue={discountValue}
          onDiscountTypeChange={handleDiscountTypeChange}
          onDiscountValueChange={handleDiscountValueChange}
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
          taxBreakdown={taxBreakdown}
          provinceLabel={provinceTaxLabel(saleTax.provinceCode)}
          taxPricingMode={saleTax.pricingMode}
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
          onSuspendSale={handleSuspendSale}
          onResumeSale={handleResumeSale}
          showKeyboardHints={isCashierView}
          onOpenFavorites={() => setWorkspaceTab("favorites")}
          showSignatureModal={showSignatureModal}
          onSignatureAccept={handleSignatureAccept}
          onSignatureCancel={handleSignatureCancel}
          promptForBag={demographicConfig.promptForBag}
          quickServiceItems={QUICK_SERVICE_ITEMS}
          onAddServiceItem={addServiceItem}
          giftCardNumber={giftCardNumber}
          onGiftCardNumberChange={setGiftCardNumber}
          giftCardLookup={giftCardLookup}
          giftCardRedeemAmount={giftCardTenderAmount(payMethod, splitEnabled, splitPayments, total)}
          showGiftCardTender={requiresGiftCardNumber(payMethod, splitEnabled, splitPayments)}
          onOpenGiftCards={() => setWorkspaceTab("giftcards")}
          ageCheckoutBlocked={ageRestrictedSale.restrictedOnCart(cart).length > 0}
          ageCheckoutMessage={
            ageRestrictedSale.restrictedOnCart(cart).length
              ? `Age verification required before checkout (${ageRestrictedSale.restrictedOnCart(cart).join(", ")}).`
              : null
          }
          pendingAgeVerification={
            ageRestrictedSale.pendingItem?.name || null
          }
        />
        </div>
      ) : null}

      <AgeVerificationModal
        open={Boolean(ageRestrictedSale.pendingItem)}
        classId={ageRestrictedSale.pendingClassId}
        minAge={ageRestrictedSale.pendingMinAge}
        itemName={ageRestrictedSale.pendingItem?.name}
        managerOverrideActive={managerOverrideActive}
        onVerifyDob={handleAgeVerifyDob}
        onManagerOverride={handleAgeManagerOverride}
        onCancel={ageRestrictedSale.cancelPending}
      />

      {toast ? <PosToast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
