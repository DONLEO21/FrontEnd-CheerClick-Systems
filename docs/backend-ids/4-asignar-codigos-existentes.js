// OPCIONAL (se ejecuta UNA vez). Pone código a lo que ya existe en la base.
// Copiar a BackEnd/scripts/asignar-codigos.js y correr desde la carpeta del backend:
//   node --env-file .env scripts/asignar-codigos.js
//
// OJO: los implementos que hoy tienen IM4821 (aleatorio) se renumeran a IM001, IM002… según su fecha de creación.
import mongoose from "mongoose";
import contadorModel from "../src/models/contador.model.js";
import PagosModel from "../src/models/pagos.model.js";
import HabilidadesModel from "../src/models/habilidades.model.js";
import ImplementoModel from "../src/models/implementos.model.js";

const pad = (n) => String(n).padStart(3, "0");

async function numerar(Model, prefijo, soloSinCodigo) {
    const filtro = soloSinCodigo ? { $or: [{ codigo: { $exists: false } }, { codigo: null }] } : {};
    const docs = await Model.find(filtro).sort({ _id: 1 }).select("_id");   // el _id ya viene ordenado por fecha
    let seq = 0;
    if (soloSinCodigo) {
        const c = await contadorModel.findById(prefijo);
        seq = c?.seq ?? 0;
    }
    for (const d of docs) {
        seq += 1;
        await Model.updateOne({ _id: d._id }, { $set: { codigo: prefijo + pad(seq) } });
    }
    await contadorModel.updateOne({ _id: prefijo }, { $set: { seq } }, { upsert: true });
    console.log(`${prefijo}: ${docs.length} documentos numerados (último ${prefijo}${pad(seq)})`);
}

await mongoose.connect(process.env.URI_MONGO);
await numerar(PagosModel, "PG", true);          // solo los que no tienen código
await numerar(HabilidadesModel, "HA", true);
await numerar(ImplementoModel, "IM", false);    // renumera TODOS (quita los aleatorios IM4821)
await mongoose.disconnect();
