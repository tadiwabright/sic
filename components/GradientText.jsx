import './GradientText.css';

export default function GradientText({
  children,
  className = '',
  colors = ['#40ffaa', '#4079ff', '#40ffaa', '#4079ff', '#40ffaa'],
  animationSpeed = 8,
  showBorder = false,
  as = 'div'
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    animationDuration: `${animationSpeed}s`
  };

  const Tag = as;
  return (
    <div className={`animated-gradient-text ${className}`}>
      {showBorder && <div className="gradient-overlay" style={gradientStyle}></div>}
      <Tag className="text-content" style={gradientStyle}>
        {children}
      </Tag>
    </div>
  );
}
