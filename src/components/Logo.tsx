import { Hand } from 'lucide-react';

const Logo = ({ size = "text-2xl" }: { size?: string }) => {
  return (
    <div className={`flex items-center gap-2 font-semibold text-primary ${size}`}>
      <Hand className="h-7 w-7 sm:h-8 sm:w-8" />
      <span>deafAuth</span>
    </div>
  );
};

export default Logo;
