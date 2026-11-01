'use client';

import * as React from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@frontend/lib/utils';

const Tabs = TabsPrimitive.Root;

/**
 * The active tab's background slides to the next one. Until it's measured (server render,
 * before hydration) the active tab paints its own background.
 */
function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const place = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      if (!active) return list.removeAttribute('data-indicator');
      list.style.setProperty('--tab-left', `${active.offsetLeft}px`);
      list.style.setProperty('--tab-width', `${active.offsetWidth}px`);
      // A list that wraps (the landing on a phone) puts the active tab on another row
      list.style.setProperty('--tab-top', `${active.offsetTop}px`);
      list.style.setProperty('--tab-height', `${active.offsetHeight}px`);
      list.setAttribute('data-indicator', '');
    };
    place();
    const states = new MutationObserver(place);
    states.observe(list, { subtree: true, attributeFilter: ['data-state'] });
    // Labels change width with the language or the font loading
    const sizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    sizes?.observe(list);
    return () => {
      states.disconnect();
      sizes?.disconnect();
    };
  }, []);

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'group/tabs bg-muted text-muted-foreground relative inline-flex h-10 items-center justify-center rounded-md p-1',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="bg-background absolute top-0 left-0 hidden h-(--tab-height) w-(--tab-width) translate-x-(--tab-left) translate-y-(--tab-top) rounded-sm shadow-sm transition-[translate,width,height] duration-300 ease-out group-data-indicator/tabs:block"
      />
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'focus-ring data-[state=active]:bg-background data-[state=active]:text-foreground hover:text-foreground relative inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm group-data-indicator/tabs:data-[state=active]:bg-transparent group-data-indicator/tabs:data-[state=active]:shadow-none',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('focus-ring mt-2', className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
