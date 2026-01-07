// Central theme configuration (master source of truth)

// The five original premium themes (restored from AppTheme)
export const themes = {
  'theme-midnight-cobalt': {
    key: 'theme-midnight-cobalt',
    background: '#0B1120',
    surface: 'rgba(15,23,36,0.78)',
    primary: '#38BDF8',
    textMain: '#EAF6FF',
    textSecondary: '#9FB8CB',
    border: 'rgba(255,255,255,0.06)',
    shadow: '0 18px 36px rgba(0,0,0,0.65)',
    glass: 'blur(10px)',
  glassBorder: '1px solid rgba(255,255,255,0.08)',
  primaryGlow: '0 8px 32px rgba(56,189,248,0.18)',
    success: '#10B981',
    error: '#EF4444',
    info: '#38BDF8'
  },

  'theme-arctic-tech': {
    key: 'theme-arctic-tech',
    background: '#F1F5F9',
    surface: 'rgba(255,255,255,0.98)',
    primary: '#0EA5E9',
    textMain: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    shadow: '0 6px 18px rgba(2,6,23,0.06)',
    glass: 'none',
  glassBorder: '1px solid rgba(2,6,23,0.06)',
  primaryGlow: '0 8px 32px rgba(14,165,233,0.12)',
    success: '#10B981',
    error: '#EF4444',
    info: '#0EA5E9'
  },

  'theme-forest-mint': {
    key: 'theme-forest-mint',
    background: '#0F172A',
    surface: 'rgba(12,20,36,0.8)',
    primary: '#10B981',
    textMain: '#E8FDF2',
    textSecondary: '#9FB8A8',
    border: 'rgba(255,255,255,0.04)',
    shadow: '0 18px 36px rgba(0,0,0,0.65)',
    glass: 'blur(10px)',
  glassBorder: '1px solid rgba(255,255,255,0.04)',
  primaryGlow: '0 8px 32px rgba(16,185,129,0.14)',
    success: '#10B981',
    error: '#EF4444',
    info: '#00D4FF'
  },

  'theme-modern-studio': {
    key: 'theme-modern-studio',
    background: '#18181B',
    surface: 'rgba(24,24,27,0.78)',
    primary: '#8B5CF6',
    textMain: '#F5F3FF',
    textSecondary: '#C7B8F0',
    border: 'rgba(255,255,255,0.04)',
    shadow: '0 18px 36px rgba(0,0,0,0.65)',
    glass: 'blur(10px)',
  glassBorder: '1px solid rgba(255,255,255,0.04)',
  primaryGlow: '0 8px 32px rgba(139,92,246,0.12)',
    success: '#10B981',
    error: '#EF4444',
    info: '#00D4FF'
  },

  'theme-carbon-slate': {
    key: 'theme-carbon-slate',
    background: '#111111',
    surface: 'rgba(30,30,30,0.80)',
    primary: '#F59E0B',
    primaryGradient: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)',
    textMain: '#FFF8EB',
    textSecondary: '#C7B39B',
    border: 'rgba(255,255,255,0.04)',
    shadow: '0 24px 48px rgba(0,0,0,0.75)',
    glass: 'blur(10px)',
    glassBorder: '1px solid rgba(255,255,255,0.10)',
    primaryGlow: '0px 4px 20px rgba(255, 215, 0, 0.5)',
    success: '#10B981',
    error: '#EF4444',
    info: '#00D4FF'
  }
};

export const DEFAULT_THEME_KEY = 'theme-carbon-slate';
