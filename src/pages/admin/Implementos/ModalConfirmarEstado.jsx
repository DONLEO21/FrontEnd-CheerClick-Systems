import { useState } from "react";
import ModalConfirmar from "../../../components/Compartidos/ModalConfirmar";
import { cambiarEstadoImplemento } from "../../../services/ImplementosService";

// Confirmación de inhabilitar / habilitar un implemento (usa el modal compartido)
export default function ModalConfirmarEstado({ abierto, onCerrar, implemento, accion, onConfirmado, onError }) {
  const [procesando, setProcesando] = useState(false);
  const esInhabilitar = accion === "inhabilitar";

  const confirmar = async () => {
    if (!implemento) return;
    setProcesando(true);
    try {
      await cambiarEstadoImplemento(implemento, esInhabilitar ? "No Disponible" : "Disponible");
      onConfirmado();
    } catch (err) {
      onError?.(err.message);
    } finally {
      setProcesando(false);
      onCerrar();
    }
  };

  return (
    <ModalConfirmar
      abierto={abierto}
      titulo={esInhabilitar ? "¿Inhabilitar elemento deportivo?" : "¿Habilitar elemento deportivo?"}
      mensaje={`¿Está seguro/a de que desea ${esInhabilitar ? "inhabilitar" : "habilitar"} el implemento "${implemento?.nombre ?? ""}"? Su estado cambiará a ${esInhabilitar ? "No Disponible" : "Disponible"}.`}
      tipo={esInhabilitar ? "peligro" : "ok"}
      textoConfirmar={esInhabilitar ? "Inhabilitar" : "Habilitar"}
      cargando={procesando}
      onConfirmar={confirmar}
      onCancelar={onCerrar}
    />
  );
}
