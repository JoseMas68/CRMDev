import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  appName?: string;
}

export function PasswordResetEmail({
  userName,
  resetUrl,
  appName = "CRMDev",
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Restablece tu contraseña en {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Restablece tu contraseña</Heading>
          <Text style={text}>
            Hola {userName},
          </Text>
          <Text style={text}>
            Recibimos una solicitud para restablecer tu contraseña. Haz clic en el
            siguiente enlace para crear una nueva:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Restablecer contraseña
            </Button>
          </Section>
          <Text style={text}>
            O copia y pega este enlace en tu navegador:
          </Text>
          <Link href={resetUrl} style={link}>
            {resetUrl}
          </Link>
          <Text style={footer}>
            Este enlace expirará en 1 hora. Si no solicitaste restablecer tu
            contraseña, puedes ignorar este correo y tu contraseña permanecerá
            sin cambios.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "left" as const,
  padding: "0 40px",
};

const buttonContainer = {
  padding: "27px 0 27px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#5468ff",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 40px",
};

const link = {
  color: "#5468ff",
  fontSize: "14px",
  textDecoration: "underline",
  padding: "0 40px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 40px",
  marginTop: "40px",
};
