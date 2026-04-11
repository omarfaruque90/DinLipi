import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest } from '../lib/api';

export const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Rent', 'Shopping'] as const;
export type ExpenseCategory = string;
export type TransactionType = 'Expense' | 'Income';

export type ExpenseItem = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  transactionType: TransactionType;
  note?: string;
  date: string;
};

type ExpenseContextType = {
  expenses: ExpenseItem[];
  categories: string[];
  totalBalance: number;
  monthlyBudget: number;
  loading: boolean;
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => Promise<void>;
  updateBalance: (newAmount: number) => void;
  addCategory: (category: string) => void;
  editCategory: (oldCategory: string, newCategory: string) => void;
  deleteCategory: (category: string) => void;
};

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);
  const [totalBalance, setTotalBalance] = useState<number>(25400);
  const [monthlyBudget] = useState<number>(15000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setExpenses([]);
      setCategories([...DEFAULT_CATEGORIES]);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const [categoryRows, transactionRows] = await Promise.all([
          apiRequest<Array<{ id: string; name: string }>>('/categories', { token }),
          apiRequest<
            Array<{
              id: string;
              amount: number;
              type: string;
              note?: string;
              transactionAt: string;
              category?: { name: string } | null;
            }>
          >('/transactions', { token }),
        ]);

        setCategories(categoryRows.map((c) => c.name));
        setExpenses(
          transactionRows.map((item) => ({
            id: item.id,
            amount: item.amount,
            category: item.category?.name ?? DEFAULT_CATEGORIES[0],
            transactionType: item.type === 'income' || item.type === 'deposit' ? 'Income' : 'Expense',
            note: item.note,
            date: item.transactionAt,
          })),
        );
      } catch {
        // keep current local state if sync fails
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const addExpense = async (expense: Omit<ExpenseItem, 'id'>) => {
    const normalizedType = expense.transactionType ?? 'Expense';
    const optimistic = {
      ...expense,
      transactionType: normalizedType,
      id: `${Date.now()}-${Math.random()}`,
    };
    setExpenses((prev) => [
      {
        ...optimistic,
      },
      ...prev,
    ]);
    setTotalBalance((prev) =>
      normalizedType === 'Income' ? prev + expense.amount : prev - expense.amount,
    );

    if (!token) {
      return;
    }
    try {
      const categoryName = expense.category.trim();
      let categoryId: string | undefined;
      const categoryRows = await apiRequest<Array<{ id: string; name: string }>>('/categories', { token });
      const matched = categoryRows.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
      categoryId = matched?.id;
      if (!categoryId) {
        const created = await apiRequest<{ id: string; name: string }>('/categories', {
          token,
          method: 'POST',
          body: { name: categoryName, type: 'expense' },
        });
        categoryId = created.id;
        setCategories((prev) => (prev.includes(created.name) ? prev : [...prev, created.name]));
      }
      const typeMap: Record<TransactionType, 'expense' | 'income' | 'deposit'> = {
        Expense: 'expense',
        Income: 'income',
      };
      const createdTx = await apiRequest<{ id: string }>('/transactions', {
        token,
        method: 'POST',
        body: {
          categoryId,
          type: typeMap[normalizedType],
          amount: expense.amount,
          note: expense.note,
          transactionAt: expense.date,
          currency: 'BDT',
        },
      });
      setExpenses((prev) => prev.map((item) => (item.id === optimistic.id ? { ...item, id: createdTx.id } : item)));
    } catch {
      // keep optimistic local record for continuity
    }
  };
  const updateBalance = (newAmount: number) => {
    if (Number.isNaN(newAmount) || newAmount < 0) {
      return;
    }
    setTotalBalance(newAmount);
  };
  const addCategory = (category: string) => {
    const cleaned = category.trim();
    if (!cleaned) {
      return;
    }
    setCategories((prev) => {
      const alreadyExists = prev.some((item) => item.toLowerCase() === cleaned.toLowerCase());
      if (alreadyExists) {
        return prev;
      }
      return [...prev, cleaned];
    });
    if (token) {
      apiRequest('/categories', {
        token,
        method: 'POST',
        body: { name: cleaned, type: 'expense' },
      }).catch(() => undefined);
    }
  };
  const editCategory = (oldCategory: string, newCategory: string) => {
    const cleaned = newCategory.trim();
    const isDefault = DEFAULT_CATEGORIES.some((item) => item.toLowerCase() === oldCategory.toLowerCase());
    if (!cleaned || isDefault) {
      return;
    }
    setCategories((prev) => {
      const targetIndex = prev.findIndex((item) => item.toLowerCase() === oldCategory.toLowerCase());
      if (targetIndex === -1) {
        return prev;
      }
      const duplicate = prev.some(
        (item, index) => index !== targetIndex && item.toLowerCase() === cleaned.toLowerCase(),
      );
      if (duplicate) {
        return prev;
      }
      const next = [...prev];
      next[targetIndex] = cleaned;
      return next;
    });
    setExpenses((prev) =>
      prev.map((item) =>
        item.category.toLowerCase() === oldCategory.toLowerCase() ? { ...item, category: cleaned } : item,
      ),
    );
    if (token) {
      apiRequest<Array<{ id: string; name: string }>>('/categories', { token })
        .then((rows) => rows.find((c) => c.name.toLowerCase() === oldCategory.toLowerCase()))
        .then((row) => {
          if (!row) return;
          return apiRequest(`/categories/${row.id}`, {
            token,
            method: 'PATCH',
            body: { name: cleaned },
          });
        })
        .catch(() => undefined);
    }
  };
  const deleteCategory = (category: string) => {
    const isDefault = DEFAULT_CATEGORIES.some((item) => item.toLowerCase() === category.toLowerCase());
    if (isDefault) {
      return;
    }
    setCategories((prev) => prev.filter((item) => item.toLowerCase() !== category.toLowerCase()));
    if (token) {
      apiRequest<Array<{ id: string; name: string }>>('/categories', { token })
        .then((rows) => rows.find((c) => c.name.toLowerCase() === category.toLowerCase()))
        .then((row) => {
          if (!row) return;
          return apiRequest(`/categories/${row.id}`, { token, method: 'DELETE' });
        })
        .catch(() => undefined);
    }
  };

  const value = useMemo(
    () => ({
      expenses,
      categories,
      totalBalance,
      monthlyBudget,
      loading,
      addExpense,
      updateBalance,
      addCategory,
      editCategory,
      deleteCategory,
    }),
    [expenses, categories, totalBalance, monthlyBudget, loading],
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used inside ExpenseProvider');
  }
  return context;
}
