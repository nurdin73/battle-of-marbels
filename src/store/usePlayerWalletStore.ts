import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const INITIAL_WALLET_BALANCE = 50;

export interface PlayerWalletState {
  balance: number;
  initialBalance: number;
  deductBet: (amount: number) => boolean;
  addEarnings: (amount: number) => void;
  refillBalance: () => void;
}

export const usePlayerWalletStore = create<PlayerWalletState>()(
  persist(
    (set, get) => ({
      balance: INITIAL_WALLET_BALANCE,
      initialBalance: INITIAL_WALLET_BALANCE,

      deductBet: (amount: number): boolean => {
        const currentBalance = get().balance;
        if (currentBalance < amount) {
          return false;
        }
        set({ balance: currentBalance - amount });
        return true;
      },

      addEarnings: (amount: number): void => {
        if (amount <= 0) return;
        set((state) => ({ balance: state.balance + amount }));
      },

      refillBalance: (): void => {
        set({ balance: INITIAL_WALLET_BALANCE });
      },
    }),
    {
      name: 'kelereng_clash_wallet',
    }
  )
);
