import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define available locales
type Locale = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'zh-CN';

// Define translation keys and their default English values
interface Translations {
  // General
  'common.search': string;
  'common.refresh': string;
  'common.loading': string;
  'common.previous': string;
  'common.next': string;
  'common.loadMore': string;
  'common.clearFilters': string;
  'common.createNewJob': string;
  'common.refreshList': string;
  
  // Table headers
  'table.jobTitle': string;
  'table.applications': string;
  'table.status': string;
  'table.created': string;
  'table.gradeLevels': string;
  'table.hiringManager': string;
  'table.actions': string;
  
  // Status options
  'status.all': string;
  'status.open': string;
  'status.paused': string;
  'status.completed': string;
  
  // Empty states
  'empty.noJobsAvailable': string;
  'empty.noJobsAvailableDescription': string;
  'empty.noJobsMatchFilters': string;
  'empty.noJobsMatchFiltersDescription': string;
  'empty.noJobsFound': string;
  'empty.noJobsFoundDescription': string;
  
  // Pagination
  'pagination.showing': string;
  'pagination.to': string;
  'pagination.of': string;
  'pagination.jobs': string;
  'pagination.page': string;
  'pagination.ofTotal': string;
  
  // Actions
  'actions.copyLink': string;
  'actions.viewJob': string;
  
  // Help text
  'help.search': string;
}

// English translations
const enTranslations: Translations = {
  'common.search': 'Search',
  'common.refresh': 'Refresh',
  'common.loading': 'Loading',
  'common.previous': 'Previous',
  'common.next': 'Next',
  'common.loadMore': 'Load More',
  'common.clearFilters': 'Clear Filters',
  'common.createNewJob': 'Create New Job',
  'common.refreshList': 'Refresh Job List',
  'table.jobTitle': 'Job Title',
  'table.applications': 'Applications',
  'table.status': 'Status',
  'table.created': 'Created',
  'table.gradeLevels': 'Grade Levels',
  'table.hiringManager': 'Hiring Manager',
  'table.actions': 'Actions',
  'status.all': 'All Statuses',
  'status.open': 'Open',
  'status.paused': 'Paused',
  'status.completed': 'Completed',
  'empty.noJobsAvailable': 'No jobs available',
  'empty.noJobsAvailableDescription': 'There are currently no jobs to display.',
  'empty.noJobsMatchFilters': 'No jobs match your filters',
  'empty.noJobsMatchFiltersDescription': 'Try adjusting your search or filter criteria.',
  'empty.noJobsFound': 'No jobs found',
  'empty.noJobsFoundDescription': 'No jobs match your current criteria.',
  'pagination.showing': 'Showing',
  'pagination.to': 'to',
  'pagination.of': 'of',
  'pagination.jobs': 'jobs',
  'pagination.page': 'Page',
  'pagination.ofTotal': 'of',
  'actions.copyLink': 'Copy job link',
  'actions.viewJob': 'View job details',
  'help.search': 'Type to search jobs by title or grade level. Press Enter to navigate to the results table.',
};

// Spanish translations
const esTranslations: Translations = {
  'common.search': 'Buscar',
  'common.refresh': 'Actualizar',
  'common.loading': 'Cargando',
  'common.previous': 'Anterior',
  'common.next': 'Siguiente',
  'common.loadMore': 'Cargar más',
  'common.clearFilters': 'Limpiar filtros',
  'common.createNewJob': 'Crear nuevo trabajo',
  'common.refreshList': 'Actualizar lista de trabajos',
  'table.jobTitle': 'Título del trabajo',
  'table.applications': 'Solicitudes',
  'table.status': 'Estado',
  'table.created': 'Creado',
  'table.gradeLevels': 'Niveles de grado',
  'table.hiringManager': 'Responsable de contratación',
  'table.actions': 'Acciones',
  'status.all': 'Todos los estados',
  'status.open': 'Abierto',
  'status.paused': 'Pausado',
  'status.completed': 'Completado',
  'empty.noJobsAvailable': 'No hay trabajos disponibles',
  'empty.noJobsAvailableDescription': 'Actualmente no hay trabajos para mostrar.',
  'empty.noJobsMatchFilters': 'No hay trabajos que coincidan con sus filtros',
  'empty.noJobsMatchFiltersDescription': 'Intente ajustar su búsqueda o criterios de filtro.',
  'empty.noJobsFound': 'No se encontraron trabajos',
  'empty.noJobsFoundDescription': 'No hay trabajos que coincidan con sus criterios actuales.',
  'pagination.showing': 'Mostrando',
  'pagination.to': 'a',
  'pagination.of': 'de',
  'pagination.jobs': 'trabajos',
  'pagination.page': 'Página',
  'pagination.ofTotal': 'de',
  'actions.copyLink': 'Copiar enlace del trabajo',
  'actions.viewJob': 'Ver detalles del trabajo',
  'help.search': 'Escriba para buscar trabajos por título o nivel de grado. Presione Enter para navegar a la tabla de resultados.',
};

// French translations
const frTranslations: Translations = {
  'common.search': 'Rechercher',
  'common.refresh': 'Actualiser',
  'common.loading': 'Chargement',
  'common.previous': 'Précédent',
  'common.next': 'Suivant',
  'common.loadMore': 'Charger plus',
  'common.clearFilters': 'Effacer les filtres',
  'common.createNewJob': 'Créer un nouveau poste',
  'common.refreshList': 'Actualiser la liste des postes',
  'table.jobTitle': 'Titre du poste',
  'table.applications': 'Candidatures',
  'table.status': 'Statut',
  'table.created': 'Créé',
  'table.gradeLevels': 'Niveaux scolaires',
  'table.hiringManager': 'Responsable du recrutement',
  'table.actions': 'Actions',
  'status.all': 'Tous les statuts',
  'status.open': 'Ouvert',
  'status.paused': 'En pause',
  'status.completed': 'Terminé',
  'empty.noJobsAvailable': 'Aucun poste disponible',
  'empty.noJobsAvailableDescription': 'Il n\'y a actuellement aucun poste à afficher.',
  'empty.noJobsMatchFilters': 'Aucun poste ne correspond à vos filtres',
  'empty.noJobsMatchFiltersDescription': 'Essayez d\'ajuster votre recherche ou vos critères de filtrage.',
  'empty.noJobsFound': 'Aucun poste trouvé',
  'empty.noJobsFoundDescription': 'Aucun poste ne correspond à vos critères actuels.',
  'pagination.showing': 'Affichage de',
  'pagination.to': 'à',
  'pagination.of': 'sur',
  'pagination.jobs': 'postes',
  'pagination.page': 'Page',
  'pagination.ofTotal': 'sur',
  'actions.copyLink': 'Copier le lien du poste',
  'actions.viewJob': 'Voir les détails du poste',
  'help.search': 'Tapez pour rechercher des postes par titre ou niveau scolaire. Appuyez sur Entrée pour accéder au tableau des résultats.',
};

// German translations
const deTranslations: Translations = {
  'common.search': 'Suchen',
  'common.refresh': 'Aktualisieren',
  'common.loading': 'Laden',
  'common.previous': 'Vorherige',
  'common.next': 'Nächste',
  'common.loadMore': 'Mehr laden',
  'common.clearFilters': 'Filter löschen',
  'common.createNewJob': 'Neuen Job erstellen',
  'common.refreshList': 'Jobliste aktualisieren',
  'table.jobTitle': 'Job-Titel',
  'table.applications': 'Bewerbungen',
  'table.status': 'Status',
  'table.created': 'Erstellt',
  'table.gradeLevels': 'Klassenstufen',
  'table.hiringManager': 'Personalverantwortlicher',
  'table.actions': 'Aktionen',
  'status.all': 'Alle Status',
  'status.open': 'Offen',
  'status.paused': 'Pausiert',
  'status.completed': 'Abgeschlossen',
  'empty.noJobsAvailable': 'Keine Jobs verfügbar',
  'empty.noJobsAvailableDescription': 'Es sind derzeit keine Jobs zum Anzeigen vorhanden.',
  'empty.noJobsMatchFilters': 'Keine Jobs entsprechen Ihren Filtern',
  'empty.noJobsMatchFiltersDescription': 'Versuchen Sie, Ihre Suche oder Filterkriterien anzupassen.',
  'empty.noJobsFound': 'Keine Jobs gefunden',
  'empty.noJobsFoundDescription': 'Keine Jobs entsprechen Ihren aktuellen Kriterien.',
  'pagination.showing': 'Anzeige von',
  'pagination.to': 'bis',
  'pagination.of': 'von',
  'pagination.jobs': 'Jobs',
  'pagination.page': 'Seite',
  'pagination.ofTotal': 'von',
  'actions.copyLink': 'Job-Link kopieren',
  'actions.viewJob': 'Job-Details anzeigen',
  'help.search': 'Geben Sie einen Suchbegriff für Jobs nach Titel oder Klassenstufe ein. Drücken Sie Enter, um zur Ergebnistabelle zu navigieren.',
};

// Chinese translations
const zhTranslations: Translations = {
  'common.search': '搜索',
  'common.refresh': '刷新',
  'common.loading': '加载中',
  'common.previous': '上一页',
  'common.next': '下一页',
  'common.loadMore': '加载更多',
  'common.clearFilters': '清除筛选',
  'common.createNewJob': '创建新职位',
  'common.refreshList': '刷新职位列表',
  'table.jobTitle': '职位标题',
  'table.applications': '申请数',
  'table.status': '状态',
  'table.created': '创建时间',
  'table.gradeLevels': '年级',
  'table.hiringManager': '招聘经理',
  'table.actions': '操作',
  'status.all': '所有状态',
  'status.open': '开放',
  'status.paused': '暂停',
  'status.completed': '已完成',
  'empty.noJobsAvailable': '暂无职位',
  'empty.noJobsAvailableDescription': '当前没有可显示的职位。',
  'empty.noJobsMatchFilters': '没有符合筛选条件的职位',
  'empty.noJobsMatchFiltersDescription': '请尝试调整搜索或筛选条件。',
  'empty.noJobsFound': '未找到职位',
  'empty.noJobsFoundDescription': '没有符合当前条件的职位。',
  'pagination.showing': '显示第',
  'pagination.to': '至',
  'pagination.of': '项，共',
  'pagination.jobs': '个职位',
  'pagination.page': '第',
  'pagination.ofTotal': '页，共',
  'actions.copyLink': '复制职位链接',
  'actions.viewJob': '查看职位详情',
  'help.search': '输入职位标题或年级进行搜索。按回车键导航到结果表。',
};

// Translation map
const translations: Record<Locale, Translations> = {
  'en-US': enTranslations,
  'es-ES': esTranslations,
  'fr-FR': frTranslations,
  'de-DE': deTranslations,
  'zh-CN': zhTranslations,
};

// Context type
interface I18nContextType {
  t: (key: keyof Translations, ...params: any[]) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  availableLocales: Locale[];
}

// Create context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Hook to use i18n context
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Provider component
interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ 
  children, 
  initialLocale = 'en-US' 
}) => {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const t = (key: keyof Translations, ...params: any[]): string => {
    const translation = translations[locale][key];
    if (!translation) {
      // Fallback to English if translation is not available
      return translations['en-US'][key] || key;
    }

    // Simple parameter replacement (e.g., placeholders like {0}, {1})
    let result = translation;
    params.forEach((param, index) => {
      result = result.replace(`{${index}}`, param);
    });

    return result;
  };

  const value: I18nContextType = {
    t,
    locale,
    setLocale,
    availableLocales: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN'],
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook to use i18n translations for specific keys
export const useTranslations = () => {
  const { t } = useI18n();
  
  return {
    common: {
      search: t('common.search'),
      refresh: t('common.refresh'),
      loading: t('common.loading'),
      previous: t('common.previous'),
      next: t('common.next'),
      loadMore: t('common.loadMore'),
      clearFilters: t('common.clearFilters'),
      createNewJob: t('common.createNewJob'),
      refreshList: t('common.refreshList'),
    },
    table: {
      jobTitle: t('table.jobTitle'),
      applications: t('table.applications'),
      status: t('table.status'),
      created: t('table.created'),
      gradeLevels: t('table.gradeLevels'),
      hiringManager: t('table.hiringManager'),
      actions: t('table.actions'),
    },
    status: {
      all: t('status.all'),
      open: t('status.open'),
      paused: t('status.paused'),
      completed: t('status.completed'),
    },
    empty: {
      noJobsAvailable: t('empty.noJobsAvailable'),
      noJobsAvailableDescription: t('empty.noJobsAvailableDescription'),
      noJobsMatchFilters: t('empty.noJobsMatchFilters'),
      noJobsMatchFiltersDescription: t('empty.noJobsMatchFiltersDescription'),
      noJobsFound: t('empty.noJobsFound'),
      noJobsFoundDescription: t('empty.noJobsFoundDescription'),
    },
    pagination: {
      showing: t('pagination.showing'),
      to: t('pagination.to'),
      of: t('pagination.of'),
      jobs: t('pagination.jobs'),
      page: t('pagination.page'),
      ofTotal: t('pagination.ofTotal'),
    },
    actions: {
      copyLink: t('actions.copyLink'),
      viewJob: t('actions.viewJob'),
    },
    help: {
      search: t('help.search'),
    },
  };
};