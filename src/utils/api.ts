// Mock data — replace with real API calls when backend is ready

export function getProfile() {
  return Promise.resolve({
    id: 1,
    name: "Roviana M.",
    username: "roviana",
    email: "roviana@example.com",
    phone: "+61 400 000 000",
    photo: null,
    kyc_status: "verified",
    bank_bsb: "123-456",
    bank_account: "987654321",
    bank_name: "Roviana M.",
    usdc_address: "0xA1B2C3D4E5F6789ABCDEF",
  });
}

export function updateProfile(data: any) {
  return Promise.resolve({ user: data });
}

export function getSessions() {
  return Promise.resolve([]);
}

export function terminateSession(id: number) {
  return Promise.resolve({ success: true });
}

export function sendPayment(payload: any) {
  return Promise.resolve({ success: true });
}

export function requestPayment(payload: any) {
  return Promise.resolve({ success: true });
}

export function getActivity() {
  return Promise.resolve([]);
}

export function getPaymentById(id: number) {
  return Promise.resolve(null);
}

export function getPublicProfile(username: string) {
  return Promise.resolve({
    id: 1,
    name: "Roviana M.",
    username,
    photo: null,
  });
}