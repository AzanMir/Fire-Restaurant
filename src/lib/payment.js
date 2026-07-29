export function getPaymentDetailsNote(paymentMethod, paymentDetails = {}) {
  if (paymentMethod === "Cash") return "";

  const provider = paymentDetails?.provider?.trim();
  const reference = paymentDetails?.reference?.trim();

  if (provider && reference) {
    if (paymentMethod === "Card") {
      return `Card payment — Cardholder: ${provider}; Card ending: ${reference}`;
    }
    return `Online payment — Provider: ${provider}; Transaction reference: ${reference}`;
  }

  if (paymentMethod === "Card") {
    return "Card payment";
  }
  if (paymentMethod === "Online") {
    return "Online payment";
  }

  return "";
}

