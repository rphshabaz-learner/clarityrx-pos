import { getRxWorkItemCount, replaceRxWorkItems } from "../clarityIndexedDb";

/** Demo Rx rows for till status lookup when no pharmacy workspace data is loaded. */
const DEMO_RX_WORK_ITEMS = [
  {
    id: "rx-demo-1001",
    rxNumber: "RX-884201",
    patientName: "Maya Chen",
    drugName: "Metformin 500mg",
    stage: "ready",
    krollPatientId: "K-442901",
    bagBarcode: "BAG-442901-01",
    copay: 4.5,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: "rx-demo-1002",
    rxNumber: "RX-884215",
    patientName: "James Okonkwo",
    drugName: "Atorvastatin 20mg",
    stage: "verification",
    krollPatientId: "K-118902",
    bagBarcode: "BAG-118902-02",
    copay: 0,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: "rx-demo-1003",
    rxNumber: "RX-884230",
    patientName: "Sunrise Care Home",
    drugName: "Bulk MAR — May",
    stage: "dispensing",
    krollPatientId: "K-LTC-BULK",
    bagBarcode: "",
    copay: 0,
    updatedAt: Date.now() - 1800000,
  },
];

export async function ensureDemoRxWorkItems() {
  const count = await getRxWorkItemCount();
  if (count > 0) return false;
  await replaceRxWorkItems(DEMO_RX_WORK_ITEMS);
  return true;
}
