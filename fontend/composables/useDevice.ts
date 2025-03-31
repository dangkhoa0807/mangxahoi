import { v4 as uuidv4 } from "uuid";

export const useDevice = () => {
  const deviceId = useCookie("device_id", {
    maxAge: 365 * 24 * 60 * 60, // 1 năm
    path: "/",
  });

  function generateDeviceId() {
    if (!deviceId.value) {
      deviceId.value = uuidv4();
    }
    return deviceId.value;
  }

  function getDeviceId() {
    return deviceId.value || generateDeviceId();
  }

  function clearDeviceId() {
    deviceId.value = null;
  }

  function isVerifiedDevice() {
    return !!deviceId.value;
  }

  return {
    deviceId,
    generateDeviceId,
    getDeviceId,
    clearDeviceId,
    isVerifiedDevice,
  };
};
