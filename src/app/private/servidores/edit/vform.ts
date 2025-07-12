export default  {
  nombre: {
    requerido: true,
    etiqueta: "Alfanumérico",
    descripcion: 'Nombre de referencia del servidor',
    validacion: {
      pattern: /^[a-zA-Z0-9/\s]+$/,
      patron_descripcion: 'Debe ingresar un nombre válido entre mayúsculas, minúsculas, números y espacios en blanco.',
      resultado: '',
    },
  },
  localizacion: {
    requerido: true,
    etiqueta: "Alfanumérico",
    descripcion: 'La localizacion es una referencia puede ser usada para diferencia departamentos o lugares ',
    validacion: {
      pattern: /^[a-zA-Z/\s]+$/,
      patron_descripcion: 'Debe ingresar un texto válido entre mayúsculas, minúsculas y espacios en blanco.',
      resultado: '',
    },
  },
  host: {
    requerido: true,
    etiqueta: "Alfanumérico",
    descripcion: 'La ip o la url del servidor',
    validacion: {
      pattern: /^[a-zA-Z0-9.&%-_\//\s]+$/,
      patron_descripcion: 'Debe ingresar una ip o url valido.',
      resultado: '',
    },
  },
  puerto: {
    requerido: true,
    etiqueta: "Numérico",
    descripcion: 'Número de puerto del servidor para acceso SSH',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe ingresar un numero válido.',
      resultado: '',
    },
  },
  idscript_nuevo: {
    requerido: false,
    etiqueta: "Selección",
    descripcion: 'Script que se ejecutará cuando se cree un nuevo servidor',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe seleccionar un numero válido.',
      resultado: '',
    },
  },
  estado: {
    requerido: true,
    etiqueta: "Selección",
    descripcion: 'Estado de servidor activo o inactivo',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe seleccionar un estado válido.',
      resultado: '',
    },
  },
  test: {
    requerido: false,
    etiqueta: "Ejecución",
    descripcion: 'Test para conocer el estado de la conexión con el servidor',
    validacion: {
      pattern: "",
      patron_descripcion: '',
      resultado: '',
    },
  },
};
