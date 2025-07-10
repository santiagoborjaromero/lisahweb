export default  {
  nombre: {
    requerido: true,
    etiqueta: "Alfanumérico",
    descripcion: 'Nombre del script que agrupara una o varias líneas de comando',
    validacion: {
      pattern: /^[a-zA-Z0-9/\s]+$/,
      patron_descripcion: 'Debe ingresar un nombre válido entre mayúsculas, minúsculas y espacios en blanco.',
      resultado: '',
    },
  },
  estado: {
    requerido: true,
    etiqueta: "Lógico",
    descripcion: 'Determina si se encuentra activo o no el script',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe seleccionar Activo o Inactivo.',
      resultado: '',
    },
  },
  cmds: {
    requerido: true,
    etiqueta: "",
    descripcion: 'Seleccione una línea de comandos definido en template de comandos',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe añadir al menos una línea de comando',
      resultado: '',
    },
  },
};
