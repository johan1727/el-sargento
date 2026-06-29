import { LegalScreen } from '../../src/components/LegalScreen';
import { appLocale } from '../../src/i18n';

const ES = {
  title: 'PRIVACIDAD',
  updated: '29 de junio de 2026',
  sections: [
    {
      h: '1. Quién es el responsable',
      b: 'El Sargento es una app de entretenimiento motivacional operada por Jhonatan Villagómez (persona física), responsable del tratamiento de tus datos. Esta política explica qué datos tratamos y cómo. Contacto: jhonatanvillagomez38@gmail.com.',
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
      h: '4. Proveedores y transferencias internacionales',
      b: 'Usamos Supabase (autenticación y base de datos) para guardar tu cuenta y tu progreso, y la API de Google Gemini para generar las respuestas del personaje. El texto de tus mensajes se envía a Gemini únicamente para producir la respuesta. Como la app se distribuye internacionalmente, estos proveedores pueden procesar y almacenar datos en servidores ubicados fuera de tu país. Cada proveedor trata los datos según sus propias políticas de privacidad.',
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
  ],
};

const EN = {
  title: 'PRIVACY',
  updated: 'June 29, 2026',
  sections: [
    {
      h: '1. Who is responsible',
      b: 'El Sargento is a motivational entertainment app operated by Jhonatan Villagómez (an individual), responsible for the processing of your data. This policy explains what data we process and how. Contact: jhonatanvillagomez38@gmail.com.',
    },
    {
      h: '2. Data we collect',
      b: 'Account: your email and, if you provide it, your name. Usage: your goals, check-ins, streak, rank and the messages you exchange with the sergeant. We do not ask for health, location or contact data.',
    },
    {
      h: '3. How we use your data',
      b: 'To create your account, show your progress, generate the sergeant\'s replies, and send you the daily reminder you set up. We do not sell your data.',
    },
    {
      h: '4. Providers and international transfers',
      b: 'We use Supabase (authentication and database) to store your account and progress, and the Google Gemini API to generate the character\'s replies. The text of your messages is sent to Gemini solely to produce the reply. Because the app is distributed internationally, these providers may process and store data on servers located outside your country. Each provider handles data under its own privacy policy.',
    },
    {
      h: '5. Payments',
      b: 'Subscriptions are processed by the App Store (Apple) or Google Play, managed with RevenueCat. We do not store your card details; the relevant store handles them.',
    },
    {
      h: '6. Retention and deletion',
      b: 'We keep your data while your account exists. You can delete your account and all your data from Settings → Delete my account; deletion is permanent.',
    },
    {
      h: '7. Security',
      b: 'Access to your data is protected by row-level security (each user only sees their own). Still, no system is 100% infallible.',
    },
    {
      h: '8. Minors',
      b: 'The app is not directed to children under 13. If you believe a minor gave us data, write to us to delete it.',
    },
    {
      h: '9. Your rights',
      b: 'You can access, correct or delete your data from within the app, or by writing to the contact email.',
    },
    {
      h: '10. Changes',
      b: 'We may update this policy; we will publish the new version here with its date.',
    },
  ],
};

export default function PrivacyScreen() {
  const d = appLocale() === 'en' ? EN : ES;
  return <LegalScreen title={d.title} updated={d.updated} sections={d.sections} />;
}
