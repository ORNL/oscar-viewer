import {elGR, enUS, esES, frFR} from '@mui/x-data-grid/locales';
import type {Locale} from '@/app/contexts/LanguageContext';

const intlLocales: Record<Locale, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    el: 'el-GR',
};

const dataGridLocales = {
    en: enUS,
    es: esES,
    fr: frFR,
    el: elGR,
};

export const getIntlLocale = (language: Locale) => intlLocales[language];

export const getDataGridLocaleText = (language: Locale) =>
    dataGridLocales[language].components.MuiDataGrid.defaultProps.localeText;

export const formatOccupancyStatus = (
    value: string | undefined | null,
    t: (key: string, params?: Record<string, string | number>) => string,
    fallbackKey?: string,
): string => {
    if (value === 'Gamma & Neutron') return t('gammaAndNeutron');
    if (value === 'Gamma') return t('gamma');
    if (value === 'Neutron') return t('neutron');
    if (value === 'None') return t('none');
    if (value) return value;
    return fallbackKey ? t(fallbackKey) : '';
};
