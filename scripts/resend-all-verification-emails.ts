import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

async function main() {
    console.log("Iniciando el reenvío de correos de verificación...");

    // Buscar todos los usuarios que no tienen el correo verificado
    const unverifiedUsers = await prisma.user.findMany({
        where: {
            emailVerified: false,
        },
    });

    if (unverifiedUsers.length === 0) {
        console.log("No hay usuarios pendientes de verificar.");
        return;
    }

    console.log(`Se encontraron ${unverifiedUsers.length} usuarios sin verificar. Procediendo a enviar correos...`);

    // Para enviar el correo, usaremos el API del lado del servidor de better-auth
    for (const user of unverifiedUsers) {
        try {
            console.log(`Enviando correo a: ${user.email}`);

            // Usando el api interno de better auth para disparar el correo de verificación
            // Le pasamos un callbackURL por defecto
            const result = await auth.api.sendVerificationEmail({
                body: {
                    email: user.email,
                    callbackURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                },
            });

            console.log(`✓ Correo enviado con éxito a: ${user.email}`);
        } catch (error) {
            console.error(`✗ Error enviando correo a ${user.email}:`, error);
        }
    }

    console.log("Proceso de reenvío completado.");
}

main()
    .catch((e) => {
        console.error("Error no controlado:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
