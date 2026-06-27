import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_STELLAR_NETWORK = 'testnet';
process.env.NEXT_PUBLIC_STELLAR_RPC_URL = 'https://soroban-testnet.stellar.org';
process.env.NEXT_PUBLIC_MARKETPLACE_REGISTRY_CONTRACT_ID = 'CTEST00000000000000000000000000000000000000000000001';
process.env.NEXT_PUBLIC_ESCROW_VAULT_CONTRACT_ID = 'CTEST00000000000000000000000000000000000000000000002';
process.env.NEXT_PUBLIC_EXPLORER_URL = 'https://stellar.expert/explorer/testnet';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock StellarWalletsKit — it needs browser APIs we don't have in test env
vi.mock('@creit.tech/stellar-wallets-kit', () => ({
  StellarWalletsKit: vi.fn().mockImplementation(() => ({
    openModal: vi.fn(),
    setWallet: vi.fn(),
    getAddress: vi.fn().mockResolvedValue({ address: 'GBTEST...' }),
    signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: 'AAAA...' }),
  })),
  Networks: {
    TESTNET: 'Test SDF Network ; September 2015',
    PUBLIC: 'Public Global Stellar Network ; September 2015',
    FUTURENET: 'Test SDF Future Network ; October 2022',
  },
}));

vi.mock('@creit.tech/stellar-wallets-kit/modules/freighter', () => ({
  FREIGHTER_ID: 'freighter',
}));

vi.mock('@creit.tech/stellar-wallets-kit/modules/utils', () => ({
  defaultModules: vi.fn(() => []),
}));

// Mock stellar-sdk for tests
vi.mock('@stellar/stellar-sdk', () => ({
  Networks: {
    TESTNET: 'Test SDF Network ; September 2015',
  },
  SorobanRpc: {
    Server: vi.fn(),
    Api: {
      isSimulationError: vi.fn(() => false),
      isSimulationRestore: vi.fn(() => false),
      GetTransactionStatus: {
        SUCCESS: 'SUCCESS',
        FAILED: 'FAILED',
        NOT_FOUND: 'NOT_FOUND',
      },
    },
    assembleTransaction: vi.fn(),
  },
  TransactionBuilder: vi.fn(),
  Contract: vi.fn(),
  Address: {
    fromString: vi.fn((s: string) => ({ toScVal: () => ({}) })),
  },
  nativeToScVal: vi.fn(() => ({})),
  scValToNative: vi.fn(() => ({})),
  BASE_FEE: '100',
  xdr: {},
  token: {
    TokenClient: vi.fn(),
  },
}));

// Suppress console errors in tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {});
