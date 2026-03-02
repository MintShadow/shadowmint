interface PaymentLinkOptions {
  username: string;     // e.g. "roviana"
  amount?: string;      // optional
  rail?: "BANK" | "USDC";
  note?: string;
}

export function buildPaymentLink({
  username,
  amount,
  rail,
  note,
}: PaymentLinkOptions) {
  const base = `https://shadowmint.com/pay/${username}`;

  const params = new URLSearchParams();

  if (amount) params.append("amount", amount);
  if (rail) params.append("rail", rail);
  if (note) params.append("note", note);

  const query = params.toString();

  return query ? `${base}?${query}` : base;
}
