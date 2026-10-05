export interface BoardTheme {
  id: string;
  name: string;
  premium: boolean;
  stage: string; // HSL triplet for the stage background token
  board: string; // full CSS background
  swatch: string; // preview background
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'navy', name: 'Deep Navy', premium: false, stage: '213 64% 9%',
    board: 'radial-gradient(60% 45% at 8% 4%, hsl(213 70% 14% / 0.85), transparent 70%), radial-gradient(55% 40% at 94% 6%, hsl(210 60% 13% / 0.75), transparent 70%), linear-gradient(180deg, hsl(213 64% 10%) 0%, hsl(214 62% 9%) 55%, hsl(216 60% 7%) 100%)',
    swatch: 'linear-gradient(180deg, hsl(213 64% 12%), hsl(216 60% 7%))',
  },
  {
    id: 'midnight', name: 'Midnight', premium: false, stage: '230 30% 6%',
    board: 'linear-gradient(180deg, hsl(230 30% 8%) 0%, hsl(232 32% 5%) 100%)',
    swatch: 'linear-gradient(180deg, hsl(230 30% 10%), hsl(232 32% 5%))',
  },
  {
    id: 'aurora', name: 'Aurora', premium: true, stage: '200 55% 8%',
    board: 'radial-gradient(70% 50% at 20% 10%, hsl(165 70% 25% / 0.6), transparent 70%), radial-gradient(60% 45% at 85% 20%, hsl(280 60% 30% / 0.55), transparent 70%), linear-gradient(180deg, hsl(205 55% 10%) 0%, hsl(220 55% 6%) 100%)',
    swatch: 'linear-gradient(135deg, hsl(165 70% 30%), hsl(280 60% 35%))',
  },
  {
    id: 'sunset', name: 'Sunset', premium: true, stage: '330 40% 10%',
    board: 'radial-gradient(70% 50% at 15% 0%, hsl(20 85% 35% / 0.6), transparent 70%), radial-gradient(60% 45% at 90% 15%, hsl(330 70% 32% / 0.55), transparent 70%), linear-gradient(180deg, hsl(320 40% 12%) 0%, hsl(260 40% 7%) 100%)',
    swatch: 'linear-gradient(135deg, hsl(20 85% 45%), hsl(330 70% 40%))',
  },
  {
    id: 'forest', name: 'Forest', premium: true, stage: '150 40% 7%',
    board: 'radial-gradient(70% 50% at 10% 5%, hsl(140 50% 22% / 0.6), transparent 70%), radial-gradient(60% 45% at 90% 10%, hsl(180 50% 20% / 0.5), transparent 70%), linear-gradient(180deg, hsl(150 40% 9%) 0%, hsl(160 40% 5%) 100%)',
    swatch: 'linear-gradient(135deg, hsl(140 50% 28%), hsl(180 50% 24%))',
  },
];

export const getTheme = (id: string | null | undefined, isPaid: boolean): BoardTheme => {
  const t = BOARD_THEMES.find(x => x.id === id) ?? BOARD_THEMES[0];
  return t.premium && !isPaid ? BOARD_THEMES[0] : t;
};
