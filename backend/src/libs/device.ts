import { UAParser } from "ua-parser-js";

async function getDeviceName(userAgent: string) {
  const parser = new UAParser();
  const result = parser.setUA(userAgent).getResult();

  let deviceName = "Không xác định";

  if (result.device.model && result.device.vendor) {
    deviceName = `${result.device.model}/${result.device.vendor}`;
  } else if (result.device.model) {
    deviceName = `${result.device.model}`;
  } else if (result.device.vendor) {
    deviceName = `${result.device.vendor}`;
  } else if (result.browser.name) {
    deviceName = `${result.browser.name}`;
  }

  return deviceName;
}

export { getDeviceName };
