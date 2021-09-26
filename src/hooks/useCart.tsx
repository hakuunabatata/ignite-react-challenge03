import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const checkProduct = newCart.find((product) => product.id === productId);

      const { data } = await api.get(`/stock/${productId}`);

      const stock = data.amount;

      const oldAmount = checkProduct ? checkProduct.amount : 0;
      const newAmount = oldAmount + 1;

      if (newAmount > stock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (checkProduct) {
        checkProduct.amount = newAmount;
      } else {
        const { data: product } = await api.get(`/products/${productId}`);

        newCart.push({ ...product, amount: newAmount });
      }

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const productIndex = newCart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex === -1) throw new Error();

      newCart.splice(productIndex, 1);

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) throw new Error();

      const newCart = [...cart];
      const checkProduct = newCart.find((product) => product.id === productId);

      if (!checkProduct) throw new Error();

      const { data } = await api.get(`/stock/${productId}`);

      const stock = data.amount;

      if (amount > stock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      checkProduct.amount = amount;

      setCart(newCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
