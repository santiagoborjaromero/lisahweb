export default  {
  nombre: {
    requerido: true,
    etiqueta: "Alfanumérico",
    descripcion: 'Nombre de referencia del servidor',
    validacion: {
      pattern: /^[a-zA-Z0-9-_/\s]+$/,
      patron_descripcion: 'Debe ingresar un nombre válido entre mayúsculas, minúsculas, números y espacios en blanco.',
      resultado: '',
    },
  },
  ubicacion: {
    requerido: true,
    etiqueta: "Alfanumérico",
    descripcion: 'La ubicacion es una referencia puede ser usada para diferencia departamentos o lugares ',
    validacion: {
      pattern: /^[a-zA-Z/\s]+$/,
      patron_descripcion: 'Debe ingresar un texto válido entre mayúsculas, minúsculas y espacios en blanco.',
      resultado: '',
    },
  },
  idservidores_familia: {
    requerido: false,
    etiqueta: "Selección",
    descripcion: 'El tipo de familia de la distribución de linux que pertence el servidor',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe seleccionar un numero válido.',
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
  ssh_puerto: {
    requerido: true,
    etiqueta: "Numérico",
    descripcion: 'Número de puerto del servidor para acceso SSH',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe ingresar un numero válido.',
      resultado: '',
    },
  },
  agente_puerto: {
    requerido: true,
    etiqueta: "Numérico",
    descripcion: 'Número de puerto del servidor para acceso al agente',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe ingresar un numero válido.',
      resultado: '',
    },
  },
  terminal_puerto: {
    requerido: true,
    etiqueta: "Numérico",
    descripcion: 'Número de puerto del servidor para acceso al terminal',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe ingresar un numero válido.',
      resultado: '',
    },
  },
  // idscript_monitoreo: {
  //   requerido: false,
  //   etiqueta: "Selección",
  //   descripcion: 'Script que se ejecutará cuando requiera monitorear el servidor en hardening',
  //   validacion: {
  //     pattern: /^[0-9]+$/,
  //     patron_descripcion: 'Debe seleccionar un numero válido.',
  //     resultado: '',
  //   },
  // },
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
  comentarios: {
    requerido: false,
    etiqueta: "Todo texto",
    descripcion: 'Observaciones sobre el servidor',
    validacion: {
      pattern: /^[A-Za-z0-9]+$/,
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
