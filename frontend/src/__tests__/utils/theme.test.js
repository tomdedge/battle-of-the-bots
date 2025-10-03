import { theme } from '../../theme';

describe('Theme Configuration', () => {
  it('has aura color palette', () => {
    expect(theme.colors.aura).toBeDefined();
    expect(theme.colors.aura[0]).toBe('#EFE2D3');
    expect(theme.colors.aura[1]).toBe('#0A8FA8');
  });

  it('has correct primary settings', () => {
    expect(theme.primaryColor).toBe('aura');
    expect(theme.primaryShade).toBe(1);
  });

  it('has custom other properties', () => {
    expect(theme.other.textLight).toBe('#2D1B21');
    expect(theme.other.textDark).toBe('#EFE2D3');
  });
});