const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Inicializamos la App de Admin para acceder a la base de datos
admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Función para verificar si el usuario es el Administrador General
exports.verificarAdmin = onCall(async (request) => {
    // Verificamos si el usuario está autenticado
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const uid = request.auth.uid;

    try {
        // Buscamos el rol en Firestore
        const userDoc = await admin.firestore().collection("usuarios").doc(uid).get();

        if (userDoc.exists && userDoc.data().rol === "admin") {
            logger.info(`Admin accedió: ${uid}`);
            return { isAdmin: true, mensaje: "Acceso concedido al Administrador" };
        } else {
            throw new HttpsError("permission-denied", "No tienes permisos de administrador.");
        }
    } catch (error) {
        logger.error("Error al verificar admin:", error);
        throw new HttpsError("internal", "Error interno del servidor.");
    }
});

// Función para editar datos del club (Socio o Contenido)
exports.editarContenidoClub = onCall(async (request) => {
    // Validación de seguridad: solo el admin puede ejecutar esto
    const userDoc = await admin.firestore().collection("usuarios").doc(request.auth.uid).get();
    if (!userDoc.exists || userDoc.data().rol !== 'admin') {
        throw new HttpsError("permission-denied", "Acción no permitida.");
    }

    const { coleccion, id, datos } = request.data;
    
    await admin.firestore().collection(coleccion).doc(id).update(datos);
    return { status: "success", message: "Club actualizado correctamente" };
});