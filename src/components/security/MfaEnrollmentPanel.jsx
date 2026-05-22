import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const inputClass =
  "mt-2 w-full h-12 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500";
const labelClass = "text-sm font-medium text-slate-700";

export default function MfaEnrollmentPanel({
  mfaBundle,
  code,
  onCodeChange,
  recoveryCodes = [],
  showRecoveryCodes = true,
}) {
  const [showManualSecret, setShowManualSecret] = useState(false);

  if (!mfaBundle?.secret) {
    return <p className="text-sm text-slate-500">Preparing enrollment…</p>;
  }

  return (
    <div className="space-y-4">
      <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 leading-relaxed">
        <li>
          Open <strong className="text-slate-800">Google Authenticator</strong> on your phone.
        </li>
        <li>
          Tap <strong className="text-slate-800">+</strong>, then{" "}
          <strong className="text-slate-800">Scan a QR code</strong>.
        </li>
        <li>Scan the code below (or use a setup key if you cannot scan).</li>
      </ol>

      {mfaBundle.otpauthUrl ? (
        <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-3">
          <QRCodeSVG
            value={mfaBundle.otpauthUrl}
            size={180}
            level="M"
            includeMargin
            title="Scan with Google Authenticator to add ClarityRx"
          />
        </div>
      ) : null}

      <button
        type="button"
        className="text-sm font-medium text-cyan-700 hover:text-cyan-800"
        onClick={() => setShowManualSecret((prev) => !prev)}
      >
        {showManualSecret ? "Hide setup key" : "Cannot scan? Enter setup key manually"}
      </button>

      {showManualSecret ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 leading-relaxed">
          <div className={labelClass}>Setup key</div>
          <div className="mt-1 font-mono text-xs text-slate-800 break-all">{mfaBundle.secret}</div>
          <p className="mt-2 text-xs text-slate-500">
            In Google Authenticator: + → Enter a setup key → account name ClarityRx → Time based.
          </p>
        </div>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="auth-mfa-enroll-code">
          Verification code
        </label>
        <input
          id="auth-mfa-enroll-code"
          className={inputClass}
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="6-digit code"
        />
        <p className="mt-2 text-xs text-slate-500">
          Codes refresh every 30 seconds. Enter the current code from Google Authenticator.
        </p>
      </div>

      {showRecoveryCodes && recoveryCodes.length ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-100 rounded-xl px-4 py-2 leading-relaxed">
          MFA enabled. Save these recovery codes: {recoveryCodes.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
