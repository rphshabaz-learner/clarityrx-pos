import { GIFT_CARD_STATUS, emptyGiftCard } from "./giftCardTypes";

export function buildSeedGiftCards() {
  const demo1 = emptyGiftCard("GC-1000-0001");
  demo1.balance = 25;
  demo1.status = GIFT_CARD_STATUS.ACTIVE;
  demo1.activatedAt = demo1.createdAt;
  demo1.lastActivityAt = demo1.createdAt;
  demo1.purchaserName = "Walk-in";
  demo1.transactions = [
    {
      id: "gctx_seed_1",
      type: "activation",
      amount: 25,
      balanceAfter: 25,
      tenderMethod: "Cash",
      at: demo1.createdAt,
    },
  ];

  const demo2 = emptyGiftCard("GC-1000-0002");
  demo2.status = GIFT_CARD_STATUS.INACTIVE;
  demo2.note = "Unactivated stock card";

  const demo3 = emptyGiftCard("GC-1000-0003");
  demo3.balance = 50;
  demo3.status = GIFT_CARD_STATUS.ACTIVE;
  demo3.activatedAt = demo3.createdAt;
  demo3.lastActivityAt = demo3.createdAt;
  demo3.transactions = [
    {
      id: "gctx_seed_3",
      type: "activation",
      amount: 50,
      balanceAfter: 50,
      tenderMethod: "Debit",
      at: demo3.createdAt,
    },
  ];

  return [demo1, demo2, demo3];
}
