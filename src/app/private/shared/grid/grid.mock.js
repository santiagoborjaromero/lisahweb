
  setStructure() {
    this.lstTableHead = [
      {
        nombre: 'id',
        caption: 'ID',
        align: 'text-start',
        visible: true,
        can_be_order: false,
      },
      {
        nombre: 'nombre',
        caption: 'Nombre',
        align: 'text-start',
        visible: true,
        can_be_order: false,
      },
      {
        nombre: 'apellido',
        caption: 'Apellido',
        align: 'text-start',
        visible: true,
        can_be_order: false,
      },
      {
        nombre: 'valor',
        caption: 'Valor',
        align: 'text-end',
        visible: true,
        can_be_order: false,
      },
    ];
  }

  getData() {
    let rpp = 50;

    let records = [];
    for(let i = 1; i<=50; i++){
      records.push({ id: i, nombre: `Alumno ${i}`, apellido: `Apellido ${i}` , valor: Math.random() * (9999999 - 1) + 1 })
    }

    let nrecords = 0;
    if (records.length < rpp){
      nrecords = records.length;
    } else{
      nrecords = rpp;
    }

    this.lstData = {
      page: {
        number_records: nrecords,
        total_records: 99,
        rows_per_page: rpp,
        number_page: this.number_page,
        record_start: 1,
      },
      data: records
    };



  }