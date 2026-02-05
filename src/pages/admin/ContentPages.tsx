import { useTranslation } from 'react-i18next';

// Placeholder pages for content management
export function ProjectsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('admin.projects', 'Projects')}
        </h1>
        <p className="text-muted-foreground">
          {t('admin.projectsDescription', 'Manage your portfolio projects')}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        {t('admin.comingSoon', 'Coming soon...')}
      </div>
    </div>
  );
}

export function TestimonialsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('admin.testimonials', 'Testimonials')}
        </h1>
        <p className="text-muted-foreground">
          {t('admin.testimonialsDescription', 'Manage customer testimonials')}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        {t('admin.comingSoon', 'Coming soon...')}
      </div>
    </div>
  );
}
