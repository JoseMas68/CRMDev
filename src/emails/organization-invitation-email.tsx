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

interface OrganizationInvitationEmailProps {
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
  appName?: string;
}

export const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? `https://${process.env.NEXT_PUBLIC_APP_URL}`
  : "http://localhost:3000";

export function OrganizationInvitationEmail({
  inviterName,
  organizationName,
  inviteUrl,
  appName = "CRMDev",
}: OrganizationInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Únete a {organizationName} en {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Invitación para unirte a {organizationName}</Heading>
          <Text style={text}>
            Hola,
          </Text>
          <Text style={text}>
            <strong>{inviterName}</strong> te ha invitado a unirte a la organización <strong>{organizationName}</strong> en {appName}.
          </Text>
          <Text style={text}>
            {appName} es una plataforma de gestión de CRM para desarrolladores, donde podrás colaborar en proyectos, gestionar clientes y hacer seguimiento de soporte.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteUrl}>
              Aceptar invitación
            </Button>
          </Section>
          <Text style={text}>
            O copia y pega este enlace en tu navegador:
          </Text>
          <Link href={inviteUrl} style={link}>
            {inviteUrl}
          </Link>
          <Text style={footer}>
            Esta invitación expirará en 7 días. Si no solicitaste esta invitación, puedes ignorar este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrganizationInvitationEmail;

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
