# SAT - Sistema de Gestión de Repuestos

Este proyecto es una aplicación web para la gestión de repuestos, diseñada para facilitar el seguimiento y control de inventario en un entorno de servicio técnico.

## Características principales

1. **Visualización de repuestos**: Muestra una lista paginada de todos los repuestos en el inventario.

2. **Búsqueda**: Permite buscar repuestos por referencia, descripción, máquina o grupo.

3. **Gestión de repuestos**: 
   - Añadir nuevos repuestos
   - Editar repuestos existentes (admin)
   - Eliminar repuestos (admin)

4. **Modo administrador**: 
   - Acceso a funciones avanzadas mediante autenticación
   - Reseteo masivo de todos los repuestos
   - Descarga de datos en formato Excel
   - Carga de datos desde un archivo Excel

5. **Información en tiempo real**:
   - Contador de usuarios conectados
   - Total de repuestos en el inventario
   - Estado del servidor y la base de datos

6. **Diseño responsivo**: Adaptado para su uso en dispositivos móviles y de escritorio.

## Cómo usar

1. Accede a la aplicación a través de la URL proporcionada.
2. Utiliza la barra de búsqueda para encontrar repuestos específicos.
3. Para añadir un nuevo repuesto, completa el formulario en la parte inferior de la página.
4. Para editar o eliminar un repuesto, utiliza los botones correspondientes en la columna "Acciones".

### Modo Administrador

Para acceder al modo administrador:
1. 
2. Introduce la contraseña de administrador en el modal que aparece.
3. Una vez autenticado, tendrás acceso a funciones adicionales como reseteo masivo, descarga y carga de datos.

## Tecnologías utilizadas

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Base de datos: MongoDB
- Tiempo real: Socket.IO
- Otras: ExcelJS (para manejo de archivos Excel)

## Notas importantes

- La aplicación está diseñada para uso interno. Asegúrate de mantener la contraseña de administrador segura.
- Al cargar datos desde un archivo Excel, asegúrate de que el formato coincida con el esperado por la aplicación.
- El reseteo masivo y la carga de datos son operaciones que afectan a todos los registros. Úsalas con precaución.
