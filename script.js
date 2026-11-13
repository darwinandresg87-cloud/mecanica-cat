function leer(clave, defecto) {
    try {
        const valor = JSON.parse(localStorage.getItem(clave));
        return valor === null || valor === undefined ? defecto : valor;
    } catch (e) {
        return defecto;
    }
}

function esc(texto) {
    return String(texto === undefined || texto === null ? "" : texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const USUARIOS_POR_DEFECTO = [
    // ADMINISTRADORES
    { usuario: "admin", password: "1234", rol: "Administrador" },
    { usuario: "admin2", password: "1234", rol: "Administrador" },

    // CLIENTES
    { usuario: "cliente", password: "1234", rol: "Cliente" },
    { usuario: "cliente2", password: "1234", rol: "Cliente" },
    { usuario: "cliente3", password: "1234", rol: "Cliente" },
    { usuario: "cliente4", password: "1234", rol: "Cliente" },
    { usuario: "cliente5", password: "1234", rol: "Cliente" },

    // RECEPCIONISTAS
    { usuario: "recepcion", password: "1234", rol: "Recepcionista" },
    { usuario: "recepcion2", password: "1234", rol: "Recepcionista" }
];

function obtenerUsuarios() {
    const guardados = leer("usuariosRegistrados", null);
    const lista = guardados && guardados.length ? guardados : USUARIOS_POR_DEFECTO.slice();
    // El rol Mecanico ya no existe: se convierte en Cliente
    lista.forEach(function (u) { if (u.rol === "Mecanico") u.rol = "Cliente"; });
    return lista;
}

function usuarioActual() {
    return leer("usuarioActual", null);
}

// =====================================
// INICIO DE SESIÓN
// =====================================
const formLogin = document.getElementById("formLogin");
if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
        e.preventDefault();

        const inputUsuario = document.getElementById("usuario").value.trim();
        const inputPassword = document.getElementById("password").value;

        const encontrado = obtenerUsuarios().find(function (u) {
            return u.usuario === inputUsuario && u.password === inputPassword;
        });

        if (encontrado) {
            localStorage.setItem("usuarioActual", JSON.stringify(encontrado));
            Swal.fire({
                title: "¡Bienvenido!",
                text: "Has ingresado como " + encontrado.rol,
                icon: "success",
                timer: 1200,
                showConfirmButton: false
            }).then(function () {
                iniciarPanel();
            });
        } else {
            Swal.fire({
                title: "Error",
                text: "Usuario o contraseña incorrectos",
                icon: "error"
            });
        }
    });
}

// =====================================
// REGISTRO DE CUENTA
// =====================================
const formRegistro = document.getElementById("formRegistro");
if (formRegistro) {
    formRegistro.addEventListener("submit", function (e) {
        e.preventDefault();

        const nombre = document.getElementById("nuevoNombre").value.trim();
        const email = document.getElementById("nuevoEmail").value.trim();
        const telefono = document.getElementById("nuevoTelefono").value.trim();
        const nuevoUsuario = document.getElementById("nuevoUsuario").value.trim();
        const nuevoPassword = document.getElementById("nuevoPassword").value;
        const confirmar = document.getElementById("confirmarPassword").value;
        const usuarios = obtenerUsuarios();

        if (usuarios.some(function (u) { return u.usuario.toLowerCase() === nuevoUsuario.toLowerCase(); })) {
            Swal.fire({ title: "Error", text: "Este nombre de usuario ya está registrado", icon: "error" });
            return;
        }

        if (usuarios.some(function (u) { return u.email && u.email.toLowerCase() === email.toLowerCase(); })) {
            Swal.fire({ title: "Error", text: "Este correo electrónico ya está registrado", icon: "error" });
            return;
        }

        if (nuevoPassword.length < 4) {
            Swal.fire({ title: "Error", text: "La contraseña debe tener al menos 4 caracteres", icon: "error" });
            return;
        }

        if (nuevoPassword !== confirmar) {
            Swal.fire({ title: "Error", text: "Las contraseñas no coinciden", icon: "error" });
            return;
        }

        usuarios.push({
            nombre: nombre,
            email: email,
            telefono: telefono,
            usuario: nuevoUsuario,
            password: nuevoPassword,
            rol: "Cliente"
        });
        localStorage.setItem("usuariosRegistrados", JSON.stringify(usuarios));

        Swal.fire({
            title: "¡Cuenta creada!",
            text: "Su cuenta ha sido creada exitosamente. Ya puede iniciar sesión.",
            icon: "success",
            confirmButtonText: "Aceptar"
        }).then(function () {
            window.location.href = "login.html";
        });
    });
}

// =====================================
// CERRAR SESIÓN
// =====================================
function cerrarSesion() {
    localStorage.removeItem("usuarioActual");
    window.location.href = "login.html";
}

// =====================================
// FORMULARIO DE SOLICITUD (solicitud.html)
// =====================================
const formSolicitud = document.getElementById("formSolicitud");
if (formSolicitud) {
    const actual = usuarioActual();

    if (!actual) {
        Swal.fire({
            title: "Inicia sesión",
            text: "Debes iniciar sesión para enviar una solicitud",
            icon: "info",
            confirmButtonText: "Ir a iniciar sesión"
        }).then(function () {
            window.location.href = "login.html";
        });
    }

    // Precargar los datos de la cuenta
    if (actual) {
        if (actual.nombre) document.getElementById("nombreCliente").value = actual.nombre;
        if (actual.telefono) document.getElementById("telefono").value = actual.telefono;
        if (actual.email) document.getElementById("email").value = actual.email;
    }

    // No permitir fechas pasadas
    const campoFecha = document.getElementById("fecha");
    campoFecha.min = new Date().toLocaleDateString("en-CA");

    formSolicitud.addEventListener("submit", function (e) {
        e.preventDefault();

        const sesion = usuarioActual();
        if (!sesion) {
            window.location.href = "login.html";
            return;
        }

        const extras = Array.from(document.querySelectorAll(".extra:checked")).map(function (c) {
            return c.value;
        });

        const marca = document.getElementById("marca").value.trim();
        const modelo = document.getElementById("modelo").value.trim();
        const anio = document.getElementById("anio").value;

        const solicitud = {
            id: Date.now(),
            usuario: sesion.usuario,
            cliente: document.getElementById("nombreCliente").value.trim(),
            telefono: document.getElementById("telefono").value.trim(),
            email: document.getElementById("email").value.trim(),
            placa: document.getElementById("placa").value.trim().toUpperCase(),
            marca: marca,
            modelo: modelo,
            anio: anio,
            vehiculo: marca + " " + modelo + " " + anio,
            kilometraje: document.getElementById("kilometraje").value,
            servicio: document.getElementById("servicio").value,
            fecha: document.getElementById("fecha").value,
            hora: document.getElementById("hora").value,
            modalidad: document.querySelector('input[name="atencion"]:checked').value,
            extras: extras,
            observaciones: document.getElementById("observaciones").value.trim(),
            estado: "Pendiente"
        };

        const solicitudes = leer("solicitudes", []);
        solicitudes.push(solicitud);
        localStorage.setItem("solicitudes", JSON.stringify(solicitudes));

        Swal.fire({
            title: "¡Solicitud guardada!",
            text: "Su solicitud fue registrada correctamente.",
            icon: "success",
            confirmButtonText: "Aceptar"
        }).then(function () {
            formSolicitud.reset();
            window.location.href = "login.html";
        });
    });
}

// =====================================
// PANEL (login.html)
// =====================================
function iniciarPanel() {
    const panel = document.getElementById("panel");
    const seccionLogin = document.getElementById("login");
    if (!panel) return;

    const actual = usuarioActual();

    if (!actual) {
        panel.style.display = "none";
        if (seccionLogin) seccionLogin.style.display = "block";
        return;
    }

    if (seccionLogin) seccionLogin.style.display = "none";
    panel.style.display = "block";

    document.getElementById("tituloPanel").textContent = "Panel de " + actual.rol;
    document.getElementById("rolBadge").textContent = "Rol: " + actual.rol;
    const vacio = '<em>No registrado</em>';
    document.getElementById("perfil").innerHTML =
        '<h3 class="perfil-titulo">Datos de mi cuenta</h3>' +
        '<div class="perfil-datos">' +
        "<p><strong>Nombre completo:</strong> " + (actual.nombre ? esc(actual.nombre) : vacio) + "</p>" +
        "<p><strong>Correo electrónico:</strong> " + (actual.email ? esc(actual.email) : vacio) + "</p>" +
        "<p><strong>Teléfono:</strong> " + (actual.telefono ? esc(actual.telefono) : vacio) + "</p>" +
        "<p><strong>Usuario:</strong> " + esc(actual.usuario) + "</p>" +
        "<p><strong>Rol:</strong> " + esc(actual.rol) + "</p>" +
        "</div>" +
        '<p><a href="solicitud.html">+ Nueva solicitud</a></p>';

    const buscar = document.getElementById("buscar");
    const filtro = document.getElementById("filtroEstado");
    buscar.oninput = mostrarSolicitudes;
    filtro.onchange = mostrarSolicitudes;

    mostrarSolicitudes();
    iniciarUsuarios(actual);
}

function mostrarSolicitudes() {
    const tabla = document.getElementById("tablaSolicitudes");
    const contador = document.getElementById("contador");
    const actual = usuarioActual();
    if (!tabla || !actual) return;

    let solicitudes = leer("solicitudes", []);

    // El cliente solo ve sus propias solicitudes
    if (actual.rol === "Cliente") {
        solicitudes = solicitudes.filter(function (s) { return s.usuario === actual.usuario; });
    }

    // Filtros
    const texto = document.getElementById("buscar").value.trim().toLowerCase();
    const estado = document.getElementById("filtroEstado").value;

    solicitudes = solicitudes.filter(function (s) {
        const coincideTexto = !texto || [s.cliente, s.vehiculo, s.servicio, s.placa, s.fecha]
            .join(" ").toLowerCase().includes(texto);
        const coincideEstado = !estado || (s.estado || "Pendiente") === estado;
        return coincideTexto && coincideEstado;
    });

    tabla.innerHTML = "";

    if (solicitudes.length === 0) {
        tabla.innerHTML = '<tr><td colspan="7">No hay solicitudes para mostrar</td></tr>';
    }

    solicitudes.forEach(function (s) {
        const est = s.estado || "Pendiente";
        let acciones = "";

        if (actual.rol === "Administrador") {
            acciones += '<select onchange="cambiarEstado(' + s.id + ', this.value)">' +
                ["Pendiente", "Confirmada", "Cancelada"].map(function (op) {
                    return '<option value="' + op + '"' + (op === est ? " selected" : "") + ">" + op + "</option>";
                }).join("") + "</select> ";
        }

        if (actual.rol === "Cliente" && est === "Pendiente") {
            acciones += '<button type="button" class="btn-tabla btn-gris" onclick="cancelarSolicitud(' + s.id + ')">Cancelar</button> ';
        }

        if (actual.rol === "Administrador") {
            acciones += '<button type="button" class="btn-tabla btn-rojo" onclick="eliminarSolicitud(' + s.id + ')">Eliminar</button>';
        }

        const fila = document.createElement("tr");
        fila.innerHTML =
            "<td>" + esc(s.id) + "</td>" +
            "<td>" + esc(s.cliente || "N/A") + "</td>" +
            "<td>" + esc(s.vehiculo || "N/A") + "<br><small>" + esc(s.placa || "") + "</small></td>" +
            "<td>" + esc(s.servicio) + "</td>" +
            "<td>" + esc(s.fecha) + " " + esc(s.hora || "") + "</td>" +
            '<td><span class="estado estado-' + esc(est) + '">' + esc(est) + "</span></td>" +
            "<td>" + acciones + "</td>";
        tabla.appendChild(fila);
    });

    if (contador) {
        contador.textContent = "Total de solicitudes: " + solicitudes.length;
    }
}

function cambiarEstado(id, nuevoEstado) {
    const solicitudes = leer("solicitudes", []);
    solicitudes.forEach(function (s) {
        if (s.id === id) s.estado = nuevoEstado;
    });
    localStorage.setItem("solicitudes", JSON.stringify(solicitudes));
    mostrarSolicitudes();
}

function cancelarSolicitud(id) {
    Swal.fire({
        title: "¿Cancelar solicitud?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "No"
    }).then(function (r) {
        if (r.isConfirmed) cambiarEstado(id, "Cancelada");
    });
}

function eliminarSolicitud(id) {
    Swal.fire({
        title: "¿Eliminar solicitud?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then(function (resultado) {
        if (resultado.isConfirmed) {
            const solicitudes = leer("solicitudes", []).filter(function (s) {
                return s.id !== id;
            });
            localStorage.setItem("solicitudes", JSON.stringify(solicitudes));
            mostrarSolicitudes();
            Swal.fire("Eliminada", "La solicitud fue borrada", "success");
        }
    });
}


// =====================================
// CRUD DE USUARIOS (solo Administrador)
// =====================================
function iniciarUsuarios(actual) {
    const seccion = document.getElementById("gestionUsuarios");
    if (!seccion) return;

    if (actual.rol !== "Administrador") {
        seccion.style.display = "none";
        return;
    }

    seccion.style.display = "block";
    document.getElementById("formUsuario").onsubmit = guardarUsuario;
    document.getElementById("btnCancelarUsuario").onclick = limpiarFormUsuario;
    mostrarUsuarios();
}

// READ
function mostrarUsuarios() {
    const tabla = document.getElementById("tablaUsuarios");
    if (!tabla) return;
    const actual = usuarioActual();
    const usuarios = obtenerUsuarios();

    tabla.innerHTML = "";
    usuarios.forEach(function (u, i) {
        const esYo = actual && u.usuario === actual.usuario;
        const fila = document.createElement("tr");
        fila.innerHTML =
            "<td>" + (i + 1) + "</td>" +
            "<td>" + esc(u.usuario) + (esYo ? " <small>(tú)</small>" : "") + "</td>" +
            "<td>" + esc(u.rol) + "</td>" +
            "<td>" +
            '<button type="button" class="btn-tabla btn-gris" onclick="editarUsuario(' + i + ')">Editar</button> ' +
            (esYo ? "" : '<button type="button" class="btn-tabla btn-rojo" onclick="eliminarUsuario(' + i + ')">Eliminar</button>') +
            "</td>";
        tabla.appendChild(fila);
    });
}

// CREATE / UPDATE
function guardarUsuario(e) {
    e.preventDefault();

    const nombre = document.getElementById("gUsuario").value.trim();
    const pass = document.getElementById("gPassword").value;
    const rol = document.getElementById("gRol").value;
    const indice = document.getElementById("usuarioIndice").value;
    const editando = indice !== "";
    const i = Number(indice);
    const usuarios = obtenerUsuarios();

    if (usuarios.some(function (u, idx) {
        return u.usuario.toLowerCase() === nombre.toLowerCase() && (!editando || idx !== i);
    })) {
        Swal.fire({ title: "Error", text: "Ese nombre de usuario ya existe", icon: "error" });
        return;
    }

    if (pass.length < 4) {
        Swal.fire({ title: "Error", text: "La contraseña debe tener al menos 4 caracteres", icon: "error" });
        return;
    }

    const actual = usuarioActual();
    let cambioMiSesion = false;

    if (editando) {
        const anterior = usuarios[i];
        const admins = usuarios.filter(function (u) { return u.rol === "Administrador"; }).length;

        if (anterior.rol === "Administrador" && rol !== "Administrador" && admins === 1) {
            Swal.fire({ title: "No permitido", text: "Debe existir al menos un administrador", icon: "warning" });
            return;
        }

        usuarios[i] = Object.assign({}, anterior, { usuario: nombre, password: pass, rol: rol });

        // Si cambió el nombre, actualizar las solicitudes que le pertenecen
        if (anterior.usuario !== nombre) {
            const solicitudes = leer("solicitudes", []);
            solicitudes.forEach(function (s) {
                if (s.usuario === anterior.usuario) s.usuario = nombre;
            });
            localStorage.setItem("solicitudes", JSON.stringify(solicitudes));
        }

        if (actual && actual.usuario === anterior.usuario) {
            localStorage.setItem("usuarioActual", JSON.stringify(usuarios[i]));
            cambioMiSesion = true;
        }
    } else {
        usuarios.push({ usuario: nombre, password: pass, rol: rol });
    }

    localStorage.setItem("usuariosRegistrados", JSON.stringify(usuarios));
    limpiarFormUsuario();
    mostrarUsuarios();
    if (cambioMiSesion) iniciarPanel();

    Swal.fire({
        title: editando ? "Usuario actualizado" : "Usuario creado",
        icon: "success",
        timer: 1200,
        showConfirmButton: false
    });
}

// Cargar datos en el formulario para editar
function editarUsuario(i) {
    const u = obtenerUsuarios()[i];
    if (!u) return;
    document.getElementById("usuarioIndice").value = i;
    document.getElementById("gUsuario").value = u.usuario;
    document.getElementById("gPassword").value = u.password;
    document.getElementById("gRol").value = u.rol;
    document.getElementById("btnGuardarUsuario").textContent = "Guardar cambios";
    document.getElementById("gUsuario").focus();
}

function limpiarFormUsuario() {
    document.getElementById("formUsuario").reset();
    document.getElementById("usuarioIndice").value = "";
    document.getElementById("btnGuardarUsuario").textContent = "Agregar usuario";
}

// DELETE
function eliminarUsuario(i) {
    const usuarios = obtenerUsuarios();
    const u = usuarios[i];
    const actual = usuarioActual();
    if (!u) return;

    if (actual && u.usuario === actual.usuario) {
        Swal.fire({ title: "No permitido", text: "No puedes eliminar tu propia cuenta", icon: "warning" });
        return;
    }

    Swal.fire({
        title: "¿Eliminar a " + u.usuario + "?",
        text: "Sus solicitudes se conservarán",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then(function (r) {
        if (r.isConfirmed) {
            usuarios.splice(i, 1);
            localStorage.setItem("usuariosRegistrados", JSON.stringify(usuarios));
            limpiarFormUsuario();
            mostrarUsuarios();
        }
    });
}


iniciarPanel();