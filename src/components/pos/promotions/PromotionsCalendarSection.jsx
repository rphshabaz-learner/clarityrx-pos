import React, { useMemo, useState } from "react";
import { PROMO_STATUS, promoTypeLabel } from "../../../lib/promotions/promotionTypes";
import { EmptyState, formatPromoDate, PromoStatusBadge, SectionIntro } from "./PromotionsShared";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function campaignSpansDay(campaign, date) {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  const start = campaign.startAt ? new Date(campaign.startAt) : dayStart;
  const end = campaign.endAt ? new Date(campaign.endAt) : dayEnd;
  return start <= dayEnd && end >= dayStart;
}

export default function PromotionsCalendarSection({ campaigns, onSelectCampaign }) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const { year, month, cells } = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const first = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0).getDate();
    const startPad = first.getDay();
    const totalCells = Math.ceil((startPad + lastDay) / 7) * 7;
    const rows = [];
    for (let i = 0; i < totalCells; i += 1) {
      const dayNum = i - startPad + 1;
      const inMonth = dayNum >= 1 && dayNum <= lastDay;
      const date = inMonth ? new Date(y, m, dayNum) : null;
      const dayCampaigns = inMonth
        ? campaigns.filter((c) => campaignSpansDay(c, date))
        : [];
      rows.push({ key: i, inMonth, dayNum, date, campaigns: dayCampaigns });
    }
    return { year: y, month: m, cells: rows };
  }, [campaigns, viewDate]);

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const shiftMonth = (delta) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <div>
      <SectionIntro
        title="Promo calendar"
        description="Month view of scheduled and active campaigns. Click a campaign chip to open it in Active campaigns."
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button type="button" className="btn-secondary" onClick={() => shiftMonth(-1)}>
          ←
        </button>
        <span style={{ fontWeight: 800, fontSize: 15, minWidth: 160, textAlign: "center" }}>{monthLabel}</span>
        <button type="button" className="btn-secondary" onClick={() => shiftMonth(1)}>
          →
        </button>
        <button type="button" className="btn-secondary" style={{ marginLeft: 8 }} onClick={() => setViewDate(new Date())}>
          Today
        </button>
      </div>

      <div className="crx-card" style={{ padding: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 700,
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((cell) => (
            <div
              key={cell.key}
              style={{
                minHeight: 88,
                padding: 6,
                borderRadius: 8,
                background: cell.inMonth ? "#fff" : "#f9fafb",
                border: "1px solid #f3f4f6",
                opacity: cell.inMonth ? 1 : 0.5,
              }}
            >
              {cell.inMonth ? (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{cell.dayNum}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {cell.campaigns.slice(0, 2).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectCampaign(c.id)}
                        title={`${c.name} · ${formatPromoDate(c.startAt)} – ${formatPromoDate(c.endAt)}`}
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          textAlign: "left",
                          padding: "2px 4px",
                          borderRadius: 4,
                          border: "none",
                          cursor: "pointer",
                          background:
                            c.status === PROMO_STATUS.ACTIVE
                              ? "#dcfce7"
                              : c.status === PROMO_STATUS.SCHEDULED
                                ? "#fef3c7"
                                : "#f3f4f6",
                          color: "#374151",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                    {cell.campaigns.length > 2 ? (
                      <span style={{ fontSize: 9, color: "#9ca3af" }}>+{cell.campaigns.length - 2} more</span>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="crx-card" style={{ padding: 16, marginTop: 16 }}>
        <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
          This month
        </div>
        {campaigns.filter((c) => {
          const start = c.startAt ? new Date(c.startAt) : null;
          const end = c.endAt ? new Date(c.endAt) : null;
          const monthStart = new Date(year, month, 1);
          const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
          if (!start && !end) return false;
          return (!start || start <= monthEnd) && (!end || end >= monthStart);
        }).length === 0 ? (
          <EmptyState message="No campaigns in this month." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {campaigns
              .filter((c) => {
                const start = c.startAt ? new Date(c.startAt) : null;
                const end = c.endAt ? new Date(c.endAt) : null;
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
                return (!start || start <= monthEnd) && (!end || end >= monthStart);
              })
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCampaign(c.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    background: "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      {promoTypeLabel(c.type)} · {formatPromoDate(c.startAt)} – {formatPromoDate(c.endAt)}
                    </div>
                  </div>
                  <PromoStatusBadge status={c.status} />
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
