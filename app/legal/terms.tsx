import { LegalScreen } from '../../src/components/LegalScreen';

export default function TermsScreen() {
  return (
    <LegalScreen
      title="TÉRMINOS"
      updated="29 de junio de 2026"
      sections={[
        {
          h: '1. Quién opera la app y aceptación',
          b: 'El Sargento es operado por Jhonatan Villagómez ("nosotros"), de forma individual. Al usar la app aceptas estos términos. Si no estás de acuerdo, no la uses. Contacto: jhonatanvillagomez38@gmail.com.',
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
          b: 'Eres responsable de mantener segura tu contraseña y de la actividad de tu cuenta. Debes dar información veraz al registrarte y tener al menos 13 años (o la edad mínima legal en tu país).',
        },
        {
          h: '5. Suscripción, prueba y renovación',
          b: 'La app ofrece una prueba gratuita de 7 días y, después, una suscripción de pago con RENOVACIÓN AUTOMÁTICA. Se cobra a través de tu cuenta de App Store (Apple) o Google Play. Puedes cancelar en cualquier momento desde los ajustes de tu tienda; la cancelación detiene futuras renovaciones y conservas el acceso hasta el fin del periodo ya pagado.',
        },
        {
          h: '6. Reembolsos',
          b: 'Como regla general NO ofrecemos reembolsos por periodos ya cobrados ni por tiempo no utilizado. Sin embargo, los reembolsos los procesa y decide la tienda (App Store / Google Play) conforme a sus políticas, y respetamos cualquier reembolso que la ley aplicable de tu país te otorgue de forma obligatoria. Para solicitarlos, dirígete a la tienda donde compraste.',
        },
        {
          h: '7. Uso aceptable',
          b: 'No uses la app para fines ilícitos, ni intentes vulnerar su seguridad, abusar de la IA o de la infraestructura.',
        },
        {
          h: '8. Disponibilidad',
          b: 'Hacemos lo posible por mantener la app funcionando, pero puede haber interrupciones o cambios. La función de IA depende de servicios de terceros.',
        },
        {
          h: '9. Limitación de responsabilidad',
          b: 'La app se ofrece "tal cual" y "según disponibilidad". En la medida máxima permitida por la ley, no somos responsables de daños indirectos o derivados del uso, ni de las decisiones que tomes basándote en la app.',
        },
        {
          h: '10. Emergencias',
          b: 'Si vives una crisis o emergencia, contacta a servicios profesionales o líneas de ayuda de tu país. Esta app no sustituye atención profesional.',
        },
        {
          h: '11. Ley aplicable',
          b: 'La app se distribuye internacionalmente a través de App Store y Google Play. Estos términos se interpretan conforme a la legislación aplicable según tu país de residencia, sin que ello te prive de los derechos imperativos que la ley de tu jurisdicción te reconozca como consumidor.',
        },
        {
          h: '12. Cambios y contacto',
          b: 'Podemos actualizar estos términos; publicaremos la nueva versión aquí con su fecha. Dudas: jhonatanvillagomez38@gmail.com.',
        },
      ]}
    />
  );
}
