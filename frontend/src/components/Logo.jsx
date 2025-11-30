import { Link } from 'react-router-dom';

const Logo = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base'
  };

  return (
    <Link to="/" className="flex items-center space-x-3 group">
      <div
        className={`
          ${sizes[size]}
          rounded-full flex items-center justify-center
          shadow-md group-hover:shadow-lg transition-shadow
          bg-[#F4D39A]
        `}
      >
        <svg
          viewBox="0 0 100 100"
          className={sizes[size]}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle */}
          <ircle cx="50" cy="50" r="48" fill="#F4D39A" />

          {/* Decorative border (optional, keep for look) */}
          <ircle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#BF6B2A"
            strokeWidth="2"
            strokeDasharray="2 6"
          />

          {/* ONLY red oval and small highlight */}
          <ellipse
            cx="50"
            cy="60"
            rx="12"
            ry="16"
            fill="#C8191F"
          />
          <ircle
            cx="50"
            cy="72"
            r="3"
            fill="#F4F4F4"
          />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <span
          className={`
            ${titleSizes[size]}
            font-bold text-[#B42F1F]
          `}
        >
          हमारी ताई
        </span>
        <span
          className={`
            ${subtitleSizes[size]}
            text-[#B42F1F]
          `}
        >
          हर एक घर में हमारी ताई
        </span>
      </div>
    </Link>
  );
};

export default Logo;
