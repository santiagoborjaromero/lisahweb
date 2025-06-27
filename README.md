# Lisahweb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.



```bash
ldapsearch -h ldap.example.com -p 389 -b "dc=example,dc=com" -D "cn=admin,dc=example,dc=com" -w password "cn=testuser"
```


```bash
https://www.jsdelivr.com/package/npm/ecuador-validator

import validator from 'ecuador-validator';

validator.ci(ci: string): boolean;
validator.ruc(ruc: string): boolean;
validator.cellphone(cellphone: string, type?: 'simple' | 'code'): boolean;
validator.telephone(telephone: string, type?: 'simple' | 'code' | 'international'): boolean;
validator.placaCar(placa: string): boolean;
validator.placaMoto(placa: string): boolean;


validator.cedula('1723456789'); // true
validator.ruc('1723456789001'); // true
validator.cellphone('0991234567'); // true, type is simple by default
validator.cellphone('0991234567', 'code'); // false
validator.cellphone('+593991234567', 'code'); // true
validator.cellphone('593991234567', 'code'); // true
validator.telephone('2123456'); // true, type is simple by default
validator.telephone('022123456', 'code'); // true
validator.telephone('+59322123456', 'international'); // true
validator.telephone('59322123456', 'international'); // true
validator.placaCar('ABC-123'); // false
validator.placaCar('ABC0123'); // true
validator.placaMoto('AA012E'); // true


```