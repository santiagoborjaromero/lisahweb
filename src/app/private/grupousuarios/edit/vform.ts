export default  {
  nombre: {
    requerido:true,
    descripcion: "El nombre del grupo puede tener dos funciones operativas en LISAH y en los servidores.",
    validacion:{
      pattern: /^[a-zA-Z0-9._-]+$/,
      patron_descripcion: "Debe ingresar un nombre válido entre mayúsculas, minúsculas, números, guión bajo o medio, punto, no espacios.",
      resultado: "",
    }
  },
  idscript_creacion: {
    requerido:true,
    descripcion: "Script asignado para ejecutar cuando se crea un grupo de usuarios",
    validacion:{
      pattern: /^[0-9]+$/,
      patron_descripcion: "Debe  asignar un script para interactuar con el servidor",
      resultado: "",
    }
  },
};
