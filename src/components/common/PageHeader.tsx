import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{t(title)}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{t(description)}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
