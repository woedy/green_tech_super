import type { ReactNode } from "react";

interface AccountPageHeaderProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

const AccountPageHeader = ({ title, description, icon, actions }: AccountPageHeaderProps) => {
  return (
    <section className="border-b border-border/70 bg-gradient-to-b from-accent/30 to-background py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {icon}
            Customer In-App
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">{description}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
};

export default AccountPageHeader;
