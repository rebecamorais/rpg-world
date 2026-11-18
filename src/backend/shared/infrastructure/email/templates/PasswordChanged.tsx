import * as React from 'react';

import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'react-email';

interface PasswordChangedTemplateProps {
  forgotPasswordLink: string;
}

/**
 * Sent after the password of an account changes, so its owner learns about a change someone else
 * made with an open session, and has a way back in.
 */
export const PasswordChangedTemplate: React.FC<PasswordChangedTemplateProps> = ({
  forgotPasswordLink,
}) => (
  <Html>
    <Head />
    <Preview>Sua senha foi alterada - RPG World</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Sua senha foi alterada</Heading>
        <Text style={text}>
          A senha da sua conta no RPG World acabou de ser trocada. Se foi você, não precisa fazer
          nada.
        </Text>
        <Text style={text}>Se não foi você, escolha uma senha nova agora:</Text>
        <Section style={btnContainer}>
          <Button style={button} href={forgotPasswordLink}>
            Redefinir a senha
          </Button>
        </Section>
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
