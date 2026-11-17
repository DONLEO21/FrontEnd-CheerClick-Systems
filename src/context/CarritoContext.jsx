import { createContext, useContext, useEffect, useState } from "react";
import { claveItem } from "../data/pedidos";

const CarritoContext = createContext(null);

const leerGuardado = (storageKey) => {
  try {
    const datos = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
};

/**
 * Item del carrito:
 * { clave, implementoId, implementoNombre, implementoImagen, grupoTalla, talla,
 *   stock, precioUnitario, cantidad }
 */
export function CarritoProvider({ storageKey, children }) {
  const [items, setItems] = useState(() => leerGuardado(storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Almacenamiento no disponible: el carrito sigue funcionando en memoria
    }
  }, [items, storageKey]);

  const cantidadEnCarrito = (implementoId, grupoTalla, talla) =>
    items.find((i) => i.clave === claveItem({ implementoId, grupoTalla, talla }))?.cantidad ?? 0;

  // Suma al carrito sin pasar del stock de esa talla. Devuelve { limitado }
  const agregar = (nuevo) => {
    const clave = claveItem(nuevo);
    const existente = items.find((i) => i.clave === clave);
    const tope = Math.max(1, Number(nuevo.stock) || 1);
    const deseada = (existente?.cantidad ?? 0) + nuevo.cantidad;
    const cantidad = Math.min(tope, deseada);

    setItems((prev) =>
      existente
        ? prev.map((i) => (i.clave === clave ? { ...i, stock: nuevo.stock, cantidad } : i))
        : [...prev, { ...nuevo, clave, cantidad }]
    );
    return { limitado: deseada > tope };
  };

  const cambiarCantidad = (clave, cantidad) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.clave !== clave) return i;
        const tope = Math.max(1, Number(i.stock) || 1);
        return { ...i, cantidad: Math.max(1, Math.min(tope, Number(cantidad) || 1)) };
      })
    );

  const quitar = (clave) => setItems((prev) => prev.filter((i) => i.clave !== clave));
  const vaciar = () => setItems([]);

  const unidades = items.reduce((suma, i) => suma + i.cantidad, 0);
  const total = items.reduce((suma, i) => suma + i.cantidad * Number(i.precioUnitario), 0);

  return (
    <CarritoContext.Provider
      value={{ items, unidades, total, agregar, cambiarCantidad, quitar, vaciar, cantidadEnCarrito }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return ctx;
}
