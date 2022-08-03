import dayjs, { guess_timezone } from "../dayjs";

// TODO: In case of an embed if localStorage is not available(third party), use localStorage of parent(first party) that contains the iframe.
export const localStorage = {
  getItem(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      // In case storage is restricted. Possible reasons
      // 1. Third Party Context in Chrome Incognito mode.
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // In case storage is restricted. Possible reasons
      // 1. Third Party Context in Chrome Incognito mode.
      // 2. Storage limit reached
      return;
    }
  },
};

interface TimeOptions {
  inviteeTimeZone: string;
}

const timeOptions: TimeOptions = {
  inviteeTimeZone: "",
};

const isInitialized = false;

const initClock = () => {
  if (isInitialized) {
    return;
  }

  timeOptions.inviteeTimeZone =
    localStorage.getItem("timeOption.preferredTimeZone") || guess_timezone();
};

function setTimeZone(selectedTimeZone: string) {
  localStorage.setItem("timeOption.preferredTimeZone", selectedTimeZone);
  timeOptions.inviteeTimeZone = selectedTimeZone;
}

const timeZone = (selectedTimeZone?: string) => {
  initClock();
  if (selectedTimeZone) setTimeZone(selectedTimeZone);
  return timeOptions.inviteeTimeZone;
};

export { timeZone as time_zone };
