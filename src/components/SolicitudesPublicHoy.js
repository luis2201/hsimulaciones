import React, { useEffect, useMemo, useState } from 'react';
import config from '../config';

const API_URL = config.API_URL;
const TIEMPO_REFRESH = 30000;
const REGISTROS_POR_PAGINA = 3;
const TIEMPO_CAMBIO_PAGINA = 10000;

const SolicitudesPublicHoy = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ahora, setAhora] = useState(new Date());
  const [paginaActual, setPaginaActual] = useState(1);
  const [esFechaActual, setEsFechaActual] = useState(true);

  const obtenerEstado = (s) => {
    if (s.Estado && String(s.Estado).trim() !== '') {
      return String(s.Estado).trim().toUpperCase();
    }
    if (s.EstadoSolicitud && String(s.EstadoSolicitud).trim() !== '') {
      return String(s.EstadoSolicitud).trim().toUpperCase();
    }
    return 'PENDIENTE';
  };

  const ordenarSolicitudes = (lista) => {
    return [...lista].sort((a, b) => {
      const horaA = a.HoraInicio || '';
      const horaB = b.HoraInicio || '';
      const comparacionInicio = horaA.localeCompare(horaB);
      if (comparacionInicio !== 0) return comparacionInicio;

      const horaFinA = a.HoraFin || '';
      const horaFinB = b.HoraFin || '';
      return horaFinA.localeCompare(horaFinB);
    });
  };

  const cargarSolicitudes = async () => {
    try {
      setError('');

      const response = await fetch(`${API_URL}/solicitudes/public/hoy`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const lista = Array.isArray(data.Solicitudes) ? data.Solicitudes : [];
      const ordenadas = ordenarSolicitudes(lista);

      setSolicitudes(ordenadas);
      setFecha(data.Fecha || '');
      setEsFechaActual(data.EsFechaActual !== false);
    } catch (err) {
      console.error('Error al cargar solicitudes públicas:', err);
      setSolicitudes([]);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();

    const intervaloDatos = setInterval(() => {
      cargarSolicitudes();
    }, TIEMPO_REFRESH);

    const intervaloReloj = setInterval(() => {
      setAhora(new Date());
    }, 1000);

    return () => {
      clearInterval(intervaloDatos);
      clearInterval(intervaloReloj);
    };
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [solicitudes.length]);

  const totalPaginas = Math.max(1, Math.ceil(solicitudes.length / REGISTROS_POR_PAGINA));

  useEffect(() => {
    if (totalPaginas <= 1) return;

    const intervaloPaginacion = setInterval(() => {
      setPaginaActual((prev) => {
        if (prev >= totalPaginas) return 1;
        return prev + 1;
      });
    }, TIEMPO_CAMBIO_PAGINA);

    return () => clearInterval(intervaloPaginacion);
  }, [totalPaginas]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(1);
    }
  }, [paginaActual, totalPaginas]);

  const solicitudesPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    const fin = inicio + REGISTROS_POR_PAGINA;
    return solicitudes.slice(inicio, fin);
  }, [solicitudes, paginaActual]);

  const getEstadoClass = (estado) => {
    switch ((estado || '').toUpperCase()) {
      case 'PENDIENTE':
      case 'NO INICIADA':
      case 'PROGRAMADA':
        return 'estado estado-pendiente';
      case 'EN CURSO':
      case 'APROBADA':
        return 'estado estado-encurso';
      case 'FINALIZADA':
        return 'estado estado-finalizada';
      case 'SUSPENDIDA':
      case 'RECHAZADA':
      case 'CANCELADA':
        return 'estado estado-suspendida';
      case 'REPROGRAMADA':
        return 'estado estado-reprogramada';
      default:
        return 'estado estado-default';
    }
  };

  const formatearHora = (hora) => {
    if (!hora) return '--:--';
    return String(hora).slice(0, 5);
  };

  const formatearFechaLarga = (fechaStr) => {
    const base = fechaStr ? new Date(`${fechaStr}T00:00:00`) : new Date();

    return base.toLocaleDateString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const horaActual = useMemo(() => {
    return ahora.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [ahora]);

  const fechaEncabezadoPantalla = useMemo(() => {
    const base = !esFechaActual && fecha ? new Date(`${fecha}T00:00:00`) : ahora;

    return base.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, [ahora, esFechaActual, fecha]);

  return (
    <div className="public-board min-h-screen overflow-hidden">
      <style>{`
        .public-board {
          background: linear-gradient(180deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%);
          color: #f8fafc;
        }

        .header-main {
          background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%);
          border-bottom: 4px solid #93c5fd;
          color: #ffffff;
        }

        .header-logo {
          background: #ffffff;
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
        }

        .sub-header {
          background: #1e40af;
          color: #dbeafe;
          border-bottom: 2px solid #60a5fa;
        }

        .board-head {
          background: #1d4ed8;
          color: #ffffff;
          border-bottom: 1px solid rgba(255,255,255,0.18);
        }

        .row-even {
          background: #ffffff;
          color: #0f172a;
        }

        .row-odd {
          background: #eff6ff;
          color: #0f172a;
        }

        .rounded-2xl.overflow-hidden.shadow-2xl.border-2.border-sky-200 {
          background: rgba(255,255,255,0.95);
        }

        .estado {
          display: inline-block;
          min-width: 112px;
          text-align: center;
          padding: 7px 8px;
          border-radius: 9999px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
          animation: blinkSoft 1.2s infinite;
          box-shadow: 0 0 0 2px rgba(255,255,255,.15) inset;
        }

        .estado-pendiente {
          background: #eab308;
          color: #0f172a;
        }

        .estado-encurso {
          background: #2563eb;
          color: #ffffff;
        }

        .estado-finalizada {
          background: #14b8a6;
          color: #ffffff;
        }

        .estado-suspendida {
          background: #ef4444;
          color: #ffffff;
        }

        .estado-reprogramada {
          background: #64748b;
          color: #ffffff;
        }

        .estado-default {
          background: #334155;
          color: #ffffff;
        }

        @keyframes blinkSoft {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.72;
            transform: scale(1.03);
          }
        }
      `}</style>

      <div className="header-main px-8 py-3">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <img
                src="/logo_hospital.png"
                alt="Logo Hospital de Simulaciones"
                className="header-logo h-20 w-28 object-contain"
              />
              <img
                src="/logo_eco_itsup.png"
                alt="Logo ECO ITSUP"
                className="header-logo h-20 w-20 object-contain"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-wide leading-tight">
              HOSPITAL DE SIMULACIONES
            </h1>
          </div>
          <div className="text-right min-w-[360px] max-w-[520px]">
            <div className="text-[11px] md:text-xs uppercase tracking-widest text-sky-100 leading-snug">
              Horario de Prácticas de Simulación y Desarrollo de Habilidades
            </div>
            <div className="text-2xl font-extrabold tracking-widest leading-tight mt-1">{horaActual}</div>
            <div className="text-sm text-sky-100">{fechaEncabezadoPantalla}</div>
          </div>
        </div>
      </div>

      <div className="sub-header px-8 py-2 flex items-center justify-between font-bold uppercase tracking-wide text-xs md:text-sm">
        <div>
          {esFechaActual ? formatearFechaLarga(fecha) : `Próxima fecha: ${formatearFechaLarga(fecha)}`}
        </div>
        <div>
          Página {paginaActual} de {totalPaginas} · Total solicitudes: {solicitudes.length}
        </div>
      </div>

      <div className="px-5 py-3">
        <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-sky-200">
          <div className="board-head grid grid-cols-[78px_78px_1fr_1.35fr_1.3fr_1.1fr_136px] text-[10px] font-bold uppercase">
            <div className="px-2 py-2 border-r border-sky-300 text-center">Inicio</div>
            <div className="px-2 py-2 border-r border-sky-300 text-center">Fin</div>
            <div className="px-3 py-2 border-r border-sky-300">Carrera</div>
            <div className="px-4 py-2 border-r border-sky-300">Asignatura / Tema</div>
            <div className="px-4 py-2 border-r border-sky-300">Docente</div>
            <div className="px-4 py-2 border-r border-sky-300">Sala</div>
            <div className="px-2 py-2 text-center">Estado</div>
          </div>

          <div>
            {loading ? (
              <div className="py-16 text-center text-2xl text-white font-bold">
                Cargando información...
              </div>
            ) : error ? (
              <div className="py-16 text-center text-2xl text-red-200 font-bold">
                {error}
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="py-16 text-center text-2xl text-white font-bold">
                No hay solicitudes para hoy.
              </div>
            ) : (
              solicitudesPaginadas.map((s, index) => {
                const estado = obtenerEstado(s);
                const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';

                return (
                  <div
                    key={s.ID}
                    className={`grid grid-cols-[78px_78px_1fr_1.35fr_1.3fr_1.1fr_136px] ${rowClass} border-t border-sky-200`}
                  >
                    <div className="px-2 py-2 border-r border-sky-200 text-base font-extrabold text-[#0a4e89] flex items-center justify-center text-center">
                      {formatearHora(s.HoraInicio)}
                    </div>

                    <div className="px-2 py-2 border-r border-sky-200 text-base font-extrabold text-[#0a4e89] flex items-center justify-center text-center">
                      {formatearHora(s.HoraFin)}
                    </div>

                    <div className="px-3 py-2 border-r border-sky-200 flex items-center">
                      <div className="text-[11px] font-bold uppercase leading-tight">
                        {s.Carrera || 'SIN CARRERA'}
                      </div>
                    </div>

                    <div className="px-4 py-2 border-r border-sky-200">
                      <div className="text-[11px] font-extrabold uppercase leading-tight">
                        {s.AsignaturaTema || `${s.Asignatura || 'SIN ASIGNATURA'} / ${s.Tema || 'SIN TEMA'}`}
                      </div>
                      <div className="text-[10px] mt-1 uppercase font-semibold leading-tight text-slate-700">
                        {s.TipoPractica || 'Sin tipo'}
                      </div>
                    </div>

                    <div className="px-4 py-2 border-r border-sky-200 flex items-center">
                      <div className="text-[11px] font-bold uppercase leading-tight">
                        {s.Docente || 'SIN DOCENTE'}
                      </div>
                    </div>

                    <div className="px-4 py-2 border-r border-sky-200 flex items-center">
                      <div className="text-[11px] font-bold uppercase leading-tight">
                        {s.Sala || 'SIN SALA'}
                      </div>
                    </div>

                    <div className="px-2 py-2 flex flex-col items-center justify-center text-center">
                      <span className={getEstadoClass(estado)}>
                        {estado}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#083964] text-white border-t border-sky-300 px-6 py-2 text-sm flex justify-between">
        <span>Actualización automática cada 30 segundos</span>
        <span>Cambio automático de página cada 10 segundos</span>
      </div>
    </div>
  );
};

export default SolicitudesPublicHoy;
