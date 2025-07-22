export default  {
  servidor: {
    requerido: false,
    etiqueta: "Selección",
    descripcion: 'Seleccione un servidor para el trabajo de monitoreo, hardening o diferido',
    validacion: {
      pattern: /^[a-zA-Z0-9/\s]+$/,
      patron_descripcion: 'Debe ingresar un nombre válido entre mayúsculas, minúsculas, números y espacios en blanco.',
      resultado: '',
    },
  },
};
