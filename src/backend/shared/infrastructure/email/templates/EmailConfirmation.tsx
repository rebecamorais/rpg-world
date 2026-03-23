import * as React from 'react';

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EmailConfirmationTemplateProps {
  confirmationLink: string;
}

export const EmailConfirmationTemplate: React.FC<EmailConfirmationTemplateProps> = ({
  confirmationLink,
}) => (
  <Html>
    <Head />
    <Preview>Confirme seu e-mail para o RPG World</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo ao RPG World!</Heading>
        <Text style={text}>
          Estamos felizes em ter você conosco. Para finalizar seu cadastro e começar sua jornada,
          por favor confirme seu e-mail clicando no botão abaixo:
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={confirmationLink}>
            Confirmar E-mail
          </Button>
        </Section>
        <Text style={text}>Se você não criou esta conta, pode ignorar este e-mail.</Text>
        <Text style={footer}>&copy; 2026 RPG World. Todos os direitos reservados.</Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.1',
  margin: '40px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#d1d5db',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'center' as const,
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '48px 0 0',
  textAlign: 'center' as const,
};
