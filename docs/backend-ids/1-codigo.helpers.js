// REEMPLAZA el contenido de: BackEnd/src/helpers/codigo.helpers.js
// Genera códigos consecutivos: IM001, IM002 … / PG001 … / HA001 … / SL001 …
// Usa la colección "contador" que ya existe (la misma de AT001, EN001).
import contadorModel from "../models/contador.model.js";

// Mantiene la firma anterior generarCodigo(Model, prefijo): el Model ya no se usa.
// Así implementos.services.js y solicitud.services.js funcionan sin cambios.
export const generarCodigo = async (_Model, prefijo, digitos = 3) => {
    const contador = await contadorModel.findOneAndUpdate(
        { _id: prefijo },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return prefijo + String(contador.seq).padStart(digitos, "0");
};
