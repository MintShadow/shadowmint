const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return;
    await OneSignal.init({ appId: ONESIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true });
    await OneSignal.showSlidedownPrompt();
    await OneSignal.setExternalUserId(userId);
  } catch (err) {
    console.error("Push notification setup failed:", err);
  }
}

export async function sendPushNotification({ toUserId, title, message }: {
  toUserId: string; title: string; message: string;
}): Promise<void> {
  await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toUserId, title, message }),
  });
}