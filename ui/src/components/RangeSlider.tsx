import "react";

declare module "react" {
  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    jsx?: boolean | string;
    global?: boolean | string;
  }
}

interface Props {
  min: number;
  max: number;
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
  step?: number;
  label: string;
}

const RangeSlider = ({ min, max, value, onChange, step = 1, label }: Props) => {
  const handleMinChange = (newMin: number) => {
    const clampedMin = Math.min(newMin, value.max);
    onChange({ ...value, min: clampedMin });
  };

  const handleMaxChange = (newMax: number) => {
    const clampedMax = Math.max(newMax, value.min);
    onChange({ ...value, max: clampedMax });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-gray-300">
        <span>{label}</span>
        <span>{value.min} - {value.max}</span>
      </div>

      {/* Min slider */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Min: {value.min}</label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.min}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Max slider */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Max: {value.max}</label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.max}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      <style jsx="true">{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .slider::-webkit-slider-track {
          height: 8px;
          background: #374151;
          border-radius: 4px;
        }

        .slider::-moz-range-track {
          height: 8px;
          background: #374151;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default RangeSlider;
