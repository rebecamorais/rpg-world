'use client';

import { type ReactNode, useEffect, useRef } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card';

/**
 * The card that replaces an account form once it's sent ("check your e-mail"). The form it
 * replaces held the focus, so the focus moves to the title: a screen reader reads the result, and
 * the Tab key goes on to the actions (`children`) instead of starting over from the page's top.
 */
export function AuthSuccessCard({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  return (
    <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle as="h1" ref={heading} tabIndex={-1} className="outline-none">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">{children}</CardContent>
    </Card>
  );
}
