import { useCallback, useRef } from "react";
import { cardPayMethodToSecurelinkType } from "../lib/posPayments";
import { isSecurelinkMock } from "../lib/securelinkConfig";
import {
  cancelPosCardPayment,
  fetchPosCardPayment,
  initiatePosCardPayment,
} from "../services/securelinkApi";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 80;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockApproval(payMethod) {
  return {
    state: "approved",
    reference: `MOCK-${Date.now()}`,
    authCode: "MOCK01",
    last4: "4242",
    cardBrand: payMethod === "Debit" ? "Interac" : "Visa",
    entryMethod: "chip",
  };
}

export function useSecurelinkPayment() {
  const activePaymentIdRef = useRef(null);

  const cancelActivePayment = useCallback(async (accessToken) => {
    const paymentId = activePaymentIdRef.current;
    if (!paymentId || !accessToken) return;
    try {
      await cancelPosCardPayment(paymentId, accessToken);
    } catch {
      // Pinpad may already be idle; ignore cancel errors.
    } finally {
      activePaymentIdRef.current = null;
    }
  }, []);

  const processCardPayment = useCallback(
    async ({ amount, payMethod, tillNumber, terminalId, accessToken, onStatus }) => {
      if (isSecurelinkMock()) {
        onStatus?.({ state: "pending", message: "Mock pinpad — approving…" });
        await delay(900);
        const approved = mockApproval(payMethod);
        onStatus?.(approved);
        return approved;
      }

      const initiated = await initiatePosCardPayment(
        {
          amountCents: Math.round(Number(amount) * 100),
          payMethod: cardPayMethodToSecurelinkType(payMethod),
          tillNumber,
          terminalId,
        },
        accessToken
      );

      const paymentId = initiated?.paymentId || initiated?.id;
      if (!paymentId) {
        throw new Error("Securelink did not return a payment id.");
      }

      activePaymentIdRef.current = paymentId;
      onStatus?.({ state: "pending", message: initiated?.message || "Follow prompts on the pinpad." });

      try {
        for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
          const status = await fetchPosCardPayment(paymentId, accessToken);
          onStatus?.(status);

          const state = String(status?.state || "").toLowerCase();
          if (state === "approved") {
            return status;
          }
          if (state === "declined" || state === "cancelled" || state === "error" || state === "failed") {
            throw new Error(status?.message || `Card payment ${state}.`);
          }

          await delay(POLL_INTERVAL_MS);
        }
        throw new Error("Pinpad timed out. Cancel the transaction on the terminal or try again.");
      } finally {
        activePaymentIdRef.current = null;
      }
    },
    []
  );

  return { processCardPayment, cancelActivePayment };
}
