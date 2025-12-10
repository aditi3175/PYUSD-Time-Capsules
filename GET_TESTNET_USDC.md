# How to Get Sepolia Testnet USDC

## Quick Links

### 1. Coinbase Developer Platform Faucet (Recommended)
- **URL**: https://coinbase.com/faucets/ethereum-sepolia-faucet
- **Steps**:
  1. Connect your MetaMask wallet
  2. Make sure you're on Sepolia network
  3. Select USDC from the token list
  4. Click "Claim" or "Request"

### 2. ETHGlobal Testnet Faucet
- **URL**: https://ethglobal.com/faucet
- **Steps**:
  1. Select "Ethereum Sepolia (USDC)"
  2. Enter your wallet address
  3. Click "Claim" - You'll get 1 USDC

### 3. Aave Faucet
- **URL**: https://staging.aave.com/faucet/
- **Steps**:
  1. Connect your wallet
  2. Select USDC
  3. Request tokens - You'll get 10 USDC

## Add USDC to MetaMask

After receiving USDC, you need to add it to MetaMask to see your balance:

1. Open MetaMask
2. Make sure you're on **Sepolia** network
3. Scroll down and click **"Import tokens"**
4. Enter the USDC contract address:
   ```
   0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
   ```
   **Note:** This is the Aave-compatible USDC address. Some faucets may use different addresses.
5. Token Symbol: **USDC**
6. Decimals: **6** (USDC uses 6 decimals, not 18)
7. Click "Add Custom Token"

## If You Get USDC from a Different Address

If the faucet gives you USDC from a different contract address:
1. Check the transaction on Sepolia Etherscan to find the actual USDC address
2. Add that address to MetaMask instead
3. **OR** set it in your `.env` file:
   ```
   VITE_USDC_ADDRESS=your_actual_usdc_address_here
   ```
4. Restart your development server

## Important Notes

- **USDC uses 6 decimals**, not 18 like PYUSD
- Testnet tokens have **no real value**
- You may need to wait a few minutes for tokens to appear
- Some faucets have rate limits (e.g., once per day)

## Troubleshooting

If USDC doesn't appear:
1. Check you're on Sepolia network
2. Verify the transaction on Sepolia Etherscan
3. Make sure you added the correct token address
4. Wait a few minutes - sometimes there's a delay

## Alternative: Use USDT Instead

If USDC faucets are not working, you can use USDT:
- USDT Sepolia Address: `0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0`
- USDT also uses 6 decimals
- Select USDT in the form instead of USDC

