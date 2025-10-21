import { render, screen } from '@testing-library/react';
import Logo from '../../components/Logo';

describe('Logo Component', () => {
  it('should render the logo text', () => {
    render(<Logo />);
    expect(screen.getByText('deafAuth')).toBeInTheDocument();
  });

  it('should apply default size class', () => {
    const { container } = render(<Logo />);
    const logoElement = container.querySelector('div');
    expect(logoElement?.className).toContain('text-2xl');
  });

  it('should apply custom size class', () => {
    const { container } = render(<Logo size="text-4xl" />);
    const logoElement = container.querySelector('div');
    expect(logoElement?.className).toContain('text-4xl');
  });

  it('should render with primary text color', () => {
    const { container } = render(<Logo />);
    const logoElement = container.querySelector('div');
    expect(logoElement?.className).toContain('text-primary');
  });
});
