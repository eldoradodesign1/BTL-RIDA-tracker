export interface PointageFeedbackInput {
  stage: 'idle' | 'capturing' | 'captured';
  gpsMessage?: string;
  geoBadge?: { text: string; status: 'ok' | 'warn' | 'unknown' };
}

export interface PointageFeedbackOutput {
  primaryText?: string;
  showBadge: boolean;
  badgeText?: string;
  badgeStatus?: 'ok' | 'warn' | 'unknown';
}

export function buildPointageFeedback(input: PointageFeedbackInput): PointageFeedbackOutput {
  if (input.stage === 'captured') {
    return {
      primaryText: input.gpsMessage || 'Pointage effectué sur site',
      showBadge: !!input.geoBadge,
      badgeText: input.geoBadge?.text || 'Position vérifiée',
      badgeStatus: input.geoBadge?.status || 'ok',
    };
  }

  if (input.stage === 'capturing') {
    return {
      primaryText: 'Enregistrement de la position GPS...',
      showBadge: false,
    };
  }

  return {
    primaryText: input.gpsMessage || undefined,
    showBadge: !!input.geoBadge,
    badgeText: input.geoBadge?.text,
    badgeStatus: input.geoBadge?.status || 'unknown',
  };
}
