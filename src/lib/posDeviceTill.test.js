import {
  getDeviceTillBindingSync,
  isDeviceTillLocked,
  resolveInitialTillNumber,
} from "./posDeviceTill";

const ORIGINAL_ENV = process.env;

describe("posDeviceTill", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.REACT_APP_POS_DEVICE_TILL;
    delete process.env.REACT_APP_POS_DEVICE_TILL_LOCK;
    window.localStorage.clear();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("uses deployment env till when set", () => {
    process.env.REACT_APP_POS_DEVICE_TILL = "4";
    expect(resolveInitialTillNumber()).toBe(4);
    expect(getDeviceTillBindingSync().source).toBe("env");
    expect(isDeviceTillLocked()).toBe(true);
  });

  it("respects explicit unlock when env till is set without lock flag", () => {
    process.env.REACT_APP_POS_DEVICE_TILL = "4";
    process.env.REACT_APP_POS_DEVICE_TILL_LOCK = "0";
    expect(isDeviceTillLocked()).toBe(false);
  });

  it("uses workstation config when env is unset", () => {
    window.localStorage.setItem(
      "clarityrx.pos.deviceTill",
      JSON.stringify({ tillNumber: 7, locked: true, source: "local" })
    );
    expect(resolveInitialTillNumber()).toBe(7);
    expect(getDeviceTillBindingSync().locked).toBe(true);
  });
});
