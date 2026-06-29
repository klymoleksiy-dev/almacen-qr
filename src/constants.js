export const SECTIONS = [
    '2401 Almacen GENERAL M.G.F',
    '2601 Taller Matadero de Cerdos',
    '2701 Taller Diespiece de Cerdos',
    '2703 Envasados Industrial',
    '2704 Taller P.L.S',
  ];

export const MECHANIC_SOURCES = {
    '2401': ['2601', '2701', '2703', '2704'], 
    '2703': ['2703', '2704'],             
    '2704': ['2703', '2704'],                
  };