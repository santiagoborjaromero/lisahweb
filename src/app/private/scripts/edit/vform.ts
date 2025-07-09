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
};
