export enum EVariants {
  BLOCK = "block",
  PACK = "pack",
}

export const STANDARD_SERVICES: Record<string, string> = {
  "00001800-0000-1000-8000-00805f9b34fb": "Generic Access",
  "00001801-0000-1000-8000-00805f9b34fb": "Generic Attribute",
  "0000180a-0000-1000-8000-00805f9b34fb": "Device Information",
  "0000180d-0000-1000-8000-00805f9b34fb": "Heart Rate",
  "0000180f-0000-1000-8000-00805f9b34fb": "Battery Service",
};

export const STANDARD_CHARACTERISTICS: Record<string, string> = {
  "00002a00-0000-1000-8000-00805f9b34fb": "Device Name",
  "00002a01-0000-1000-8000-00805f9b34fb": "Appearance",
  "00002a05-0000-1000-8000-00805f9b34fb": "Service Changed",

  "00002a19-0000-1000-8000-00805f9b34fb": "Battery Level",

  "00002a24-0000-1000-8000-00805f9b34fb": "Model Number",
  "00002a26-0000-1000-8000-00805f9b34fb": "Firmware Revision",
  "00002a28-0000-1000-8000-00805f9b34fb": "Software Revision",
  "00002a29-0000-1000-8000-00805f9b34fb": "Manufacturer Name",
};
