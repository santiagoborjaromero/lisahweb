export default  {
  idrol: {
    requerido: false,
    etiqueta: "Selección",
    descripcion: 'Rol de Usuarios',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe ingresar un números entre el 1 y 3.',
      resultado: '',
    },
  },
  
  idcliente: {
    requerido: false,
    descripcion:
      'Script asignado para ejecutar cuando se crea un grupo de usuarios',
    validacion: {
      pattern: /^[a-zA-Z0-9._-]+$/,
      patron_descripcion:
        'Debe ingresar un nombre válido entre mayúsculas, minúsculas, números, guión bajo o medio, punto, no espacios.',
      resultado: '',
    },
  },
  idgrupo_usuario: {
    requerido: true,
    etiqueta: "Selección",
    descripcion: 'Agrupación al que pertenece el usuario',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe seleccionar un grupo de usuario valido.',
      resultado: '',
    },
  },
  nombre: {
    requerido: true,
    etiqueta: "Alfanumérico",
    descripcion: 'Nombre completo del usuario o nombre distintivo dentro de la empresa',
    validacion: {
      pattern: /^[a-zA-Z/\s]+$/,
      patron_descripcion: 'Debe ingresar un nombre válido entre mayúsculas, minúsculas y espacios en blanco.',
      resultado: '',
    },
  },
  usuario: {
    requerido: true,
    etiqueta: "Alfabetico",
    descripcion: 'Nombre con el que podrá loguearse dentro del sistema y dentro de los servidores',
    validacion: {
      pattern: /^[a-z._-]+$/,
      patron_descripcion: 'Debe ingresar un nombre válido entre minúsculas, guión bajo o medio, punto, no espacios.',
      resultado: '',
    },
  },
  email: {
    requerido: true,
    etiqueta: "Alfanumérico",
    descripcion: 'Correo electronico del usuario',
    validacion: {
      pattern: /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/,
      patron_descripcion: 'Debe ingresar un correo electronico válido.',
      resultado: '',
    },
  },
  estado: {
    requerido: false,
    etiqueta: "Selección",
    descripcion: 'Estado del usuario dentro del sistema.',
    validacion: {
      pattern: /^[0-9]+$/,
      patron_descripcion: 'Debe seleccionar un estado válido.',
      resultado: '',
    },
  },
  ntfy_identificador: {
    requerido: false,
    etiqueta: "Alfanumérico",
    descripcion: 'Canal de NTFY creado para comunicación entre el sistema y el móvil del usuario',
    validacion: {
      pattern: /^[a-zA-Z0-9._-]+$/,
      patron_descripcion:
        'Debe ingresar un nombre válido entre mayúsculas, minúsculas, números, guión bajo o medio, punto, no espacios.',
      resultado: '',
    },
  },
  servidores: {
    requerido: false,
    etiqueta: "Alfanumérico",
    descripcion: 'Asigna servidores a usuarios',
    validacion: {
      pattern: /^[a-zA-Z0-9._-]+$/,
      patron_descripcion: 'Debe seleccionar un servidore válido.',
      resultado: '',
    },
  },
};
