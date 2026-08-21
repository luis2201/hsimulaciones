import { buildGuiaPdfData } from './guiaPdf';

describe('buildGuiaPdfData', () => {
  it('construye filas y secciones para una guía', () => {
    const guia = {
      Codigo: 'GP-2026-000001',
      Tema: 'Técnica de intubación',
      Materia: 'Enfermería',
      Docente: 'Dra. Pérez',
      Complejidad: 'ALTA',
      FechaDiseno: '2026-01-15',
      FechaValidacion: '2026-02-20',
      TemaCaso: 'Caso de emergencia',
      TecnicasProcedimientos: 'Procedimiento A',
      ContextoClinicoEscenario: 'UCI',
      ConocimientosPrevios: 'ABC',
      ObjetivosAprendizaje: 'Objetivo 1',
      ResultadosAprendizaje: 'Resultado 1',
      DescripcionAmbienteAprendizaje: 'Aula',
      MaterialEquiposMedicos: 'Monitor',
      CaracteristicasActor: 'Paciente',
      DescripcionEscena: 'Escena detallada',
      Libreto: 'Texto',
      ReferenciasBibliograficas: 'Referencia 1'
    };

    const data = buildGuiaPdfData(guia, [
      { ApellidosNombres: 'Ana López', Observacion: 'Aprobada' },
      { ApellidosNombres: 'Carlos Pérez', Observacion: 'Pendiente' }
    ]);

    expect(data.metadataRows[0][1]).toBe('GP-2026-000001');
    expect(data.sections[0].title).toBe('Tema del caso');
    expect(data.sections[0].content).toBe('Caso de emergencia');
    expect(data.studentRows[0][0]).toBe('Ana López');
    expect(data.studentRows[1][1]).toBe('Pendiente');
  });
});
