import { LegalScreen } from '../../src/components/LegalScreen';

export default function TermsScreen() {
  return (
    <LegalScreen
      title="TÉRMINOS"
      updated="28 de junio de 2026"
      sections={[
        {
          h: '1. Aceptación',
          b: 'Al usar El Sargento aceptas estos términos. Si no estás de acuerdo, no uses la app.',
        },
        {
          h: '2. Qué es la app',
          b: 'El Sargento es un coach de productividad de ENTRETENIMIENTO con personajes ficticios. NO es terapia, ni consejo médico, legal, financiero ni profesional de ningún tipo. Las respuestas las genera una IA y pueden contener errores.',
        },
        {
          h: '3. Tono de los personajes',
          b: 'Los sargentos usan humor exigente y "regañón" como recurso motivacional. No representa ofensas reales hacia ti. Si en algún momento no te sienta bien, deja de usar la app.',
        },
        {
          h: '4. Tu cuenta',
          b: 'Eres responsable de mantener segura tu contraseña y de la actividad de tu cuenta. Debes dar información veraz al registrarte.',
        },
        {
          h: '5. Suscripción y prueba',
          b: 'La app ofrece una prueba gratuita y una suscripción de pago (renovación automática). La gestión y cancelación se hace desde tu cuenta de App Store o Google Play. Los cobros y reembolsos se rigen por las políticas de la tienda.',
        },
        {
          h: '6. Uso aceptable',
          b: 'No uses la app para fines ilícitos, ni intentes vulnerar su seguridad, abusar de la IA o de la infraestructura.',
        },
        {
          h: '7. Disponibilidad',
          b: 'Hacemos lo posible por mantener la app funcionando, pero puede haber interrupciones o cambios. La función de IA depende de servicios de terceros.',
        },
        {
          h: '8. Limitación de responsabilidad',
          b: 'La app se ofrece "tal cual". En la medida permitida por la ley, no somos responsables de daños derivados del uso o de las decisiones que tomes basándote en la app.',
        },
        {
          h: '9. Emergencias',
          b: 'Si vives una crisis o emergencia, contacta a servicios profesionales o líneas de ayuda de tu país. Esta app no sustituye atención profesional.',
        },
        {
          h: '10. Contacto',
          b: 'Dudas sobre estos términos: jhonatanvillagomez38@gmail.com.',
        },
      ]}
    />
  );
}
