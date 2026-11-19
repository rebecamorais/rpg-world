import * as React from 'react';

import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'react-email';

interface FinishSignUpTemplateProps {
  finishLink: string;
}

export const FinishSignUpTemplate: React.FC<FinishSignUpTemplateProps> = ({ finishLink }) => (
  <Html>
    <Head />
    <Preview>Termine seu cadastro - RPG World</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Termine seu cadastro</Heading>
        <Text style={text}>
          Alguém começou um cadastro no RPG World com este e-mail, e ele ainda não foi confirmado.
          Se foi você, confirme o e-mail e escolha a sua senha no botão abaixo:
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={finishLink}>
            Confirmar e escolher a senha
          </Button>
        </Section>
        <Text style={text}>
          A senha que você escolher aqui é a que vale: nenhuma outra entra na sua conta. O link
          expira em breve. Se não foi você, pode ignorar este e-mail.
        </Text>
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
