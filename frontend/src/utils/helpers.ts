
/**
 * Converts a BigInt amount in wei to a human-readable PYUSD string
 * @param amount BigInt
 * @param decimals number of decimals (default 18)
 * @returns string
 */
export const formatPYUSD = (amount: bigint, decimals: number = 18): string => {
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 4); // first 4 digits
  return `${whole}.${fractionStr} PYUSD`;
};

/**
 * Converts a UNIX timestamp to a human-readable date string
 * @param timestamp number
 * @returns string
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

/**
 * Shortens an Ethereum address for display (e.g., 0x1234...abcd)
 * @param address string
 * @returns string
 */
export const shortenAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
