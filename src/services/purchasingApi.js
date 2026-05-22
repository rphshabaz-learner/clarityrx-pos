import { buildBackendHttpErrorMessage, fetchBackend, resolvePosTransmitApiBaseUrl } from "../lib/apiConfig";
import { buildSessionHeaders, resolveWorkspaceSession } from "../session/workspaceSession";

const TRANSMIT_API_BASE = resolvePosTransmitApiBaseUrl();

async function parseJson(response) {
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && (payload.error || payload.message)) ||
      buildBackendHttpErrorMessage(TRANSMIT_API_BASE, response) ||
      `Request failed with HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return payload;
}

function transmitHeaders(accessToken) {
  const sessionContext = resolveWorkspaceSession();
  const headers = {
    "Content-Type": "application/json",
    ...buildSessionHeaders(sessionContext),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

function isEndpointMissing(error) {
  const status = Number(error?.status);
  return status === 404 || status === 405 || status === 501;
}

/** EDI/API purchase order submit to wholesaler via pharmacy gateway. */
export async function submitPurchaseOrderEdi(order, accessToken) {
  try {
    const response = await fetchBackend(
      `${TRANSMIT_API_BASE}/pos/purchasing/orders/submit`,
      {
        method: "POST",
        headers: transmitHeaders(accessToken),
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          supplier: order.supplier,
          lines: order.lines,
          source: order.source || "manual",
        }),
      },
      TRANSMIT_API_BASE
    );
    return parseJson(response);
  } catch (error) {
    if (!isEndpointMissing(error)) throw error;
    return {
      mode: "local-stub",
      ediReference: `LOCAL-EDI-${Date.now()}`,
      message: "Pharmacy EDI endpoint not configured; order queued locally.",
      submittedAt: new Date().toISOString(),
    };
  }
}

/** Download wholesaler catalog into pharmacy (and optional POS cache). */
export async function downloadWholesalerCatalog(supplier, accessToken) {
  try {
    const response = await fetchBackend(
      `${TRANSMIT_API_BASE}/pos/purchasing/catalog/download`,
      {
        method: "POST",
        headers: transmitHeaders(accessToken),
        body: JSON.stringify({ supplier }),
      },
      TRANSMIT_API_BASE
    );
    return parseJson(response);
  } catch (error) {
    if (!isEndpointMissing(error)) throw error;
    return {
      mode: "local-stub",
      supplier,
      itemCount: 0,
      message: "Catalog download API not available on transmit host. Import catalog in pharmacy workspace.",
      downloadedAt: new Date().toISOString(),
    };
  }
}

/** Download wholesaler invoices for receiving. */
export async function downloadWholesalerInvoices(supplier, accessToken, options = {}) {
  try {
    const response = await fetchBackend(
      `${TRANSMIT_API_BASE}/pos/purchasing/invoices/download`,
      {
        method: "POST",
        headers: transmitHeaders(accessToken),
        body: JSON.stringify({ supplier, ...options }),
      },
      TRANSMIT_API_BASE
    );
    return parseJson(response);
  } catch (error) {
    if (!isEndpointMissing(error)) throw error;
    return {
      mode: "local-stub",
      supplier,
      invoices: [],
      message: "Invoice download API not available. Enter invoice manually when receiving.",
      downloadedAt: new Date().toISOString(),
    };
  }
}

/** Submit return-to-vendor (RTV) via EDI when supported. */
export async function submitVendorReturnEdi(returnRecord, accessToken) {
  try {
    const response = await fetchBackend(
      `${TRANSMIT_API_BASE}/pos/purchasing/returns/submit`,
      {
        method: "POST",
        headers: transmitHeaders(accessToken),
        body: JSON.stringify(returnRecord),
      },
      TRANSMIT_API_BASE
    );
    return parseJson(response);
  } catch (error) {
    if (!isEndpointMissing(error)) throw error;
    return {
      mode: "local-stub",
      ediReference: `LOCAL-RTV-${Date.now()}`,
      message: "RTV EDI endpoint not configured; return saved locally.",
      submittedAt: new Date().toISOString(),
    };
  }
}
