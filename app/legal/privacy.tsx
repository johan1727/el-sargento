import { LegalScreen } from '../../src/components/LegalScreen';

export default function PrivacyScreen() {
  return (
    <LegalScreen
      title="PRIVACIDAD"
      updated="28 de junio de 2026"
      sections={[
        {
          h: '1. Quiénes somos',
          b: 'El Sargento es una app de entretenimiento motivacional. Esta política explica qué datos tratamos y cómo. Contacto: jhonatanvillagomez38@gmail.com.',
        },
        {
          h: '2. Datos que recopilamos',
          b: 'Cuenta: tu correo electrónico y, si lo das, tu nombre. Uso: tus metas, check-ins, racha, rango y los mensajes que intercambias con el sargento. No pedimos datos de salud, ubicación ni contactos.',
        },
        {
          h: '3. Cómo usamos tus datos',
          b: 'Para crear tu cuenta, mostrar tu progreso, generar las respuestas del sargento y enviarte el recordatorio diario que tú configuras. No vendemos tus datos.',
        },
        {
          h: '4. Proveedores',
          b: 'Usamos Supabase (autenticación y base de datos) para guardar tu cuenta y tu progreso, y la API de Google Gemini para generar las respuestas del personaje. El texto de tus mensajes se envía a Gemini únicamente para producir la respuesta. Estos proveedores tratan los datos según sus propias políticas.',
        },
        {
          h: '5. Pagos',
          b: 'Las suscripciones se procesan por App Store (Apple) o Google Play, gestionadas con RevenueCat. No almacenamos los datos de tu tarjeta; los maneja la tienda correspondiente.',
        },
        {
          h: '6. Conservación y borrado',
          b: 'Conservamos tus datos mientras tu cuenta exista. Puedes borrar tu cuenta y todos tus datos desde Ajustes → Borrar mi cuenta; la eliminación es permanente.',
        },
        {
          h: '7. Seguridad',
          b: 'El acceso a tus datos está protegido por reglas a nivel de fila (cada usuario solo ve lo suyo). Aun así, ningún sistema es 100% infalible.',
        },
        {
          h: '8. Menores',
          b: 'La app no está dirigida a menores de 13 años. Si crees que un menor nos dio datos, escríbenos para eliminarlos.',
        },
        {
          h: '9. Tus derechos',
          b: 'Puedes acceder, corregir o borrar tus datos desde la app, o escribiéndonos al correo de contacto.',
        },
        {
          h: '10. Cambios',
          b: 'Podemos actualizar esta política; publicaremos la nueva versión aquí con su fecha.',
        },
      ]}
    />
  );
}
