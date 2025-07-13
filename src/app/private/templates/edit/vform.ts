export default  {
  linea_comando: {
    requerido: true,
    etiqueta: "Alfanumérico",
    descripcion: 'Linea de comando que se ejecutará en los servidores. No puede contener saltos de línea',
    validacion: {
      pattern: /^.+$/,
      patron_descripcion: 'Debe ingresar un texto válido no puede dejar en blanco.',
      resultado: '',
    },
  },
};
