import React from 'react';
import { Sun, CloudRain, Cloud, Snowflake, Wind, Compass } from 'lucide-react';

export default function WeatherDisplay({ weather }) {
  if (!weather) return null;

  const { season = 'Spring', weather: condition = 'Sunny', temperature = '21°C', description } = weather;

  const getIcon = () => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear sky':
        return <Sun className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '24s' }} />;
      case 'gentle rain':
      case 'rain':
        return <CloudRain className="w-5 h-5 text-sky-500 animate-bounce" />;
      case 'snow':
        return <Snowflake className="w-5 h-5 text-indigo-400 animate-pulse" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="w-5 h-5 text-slate-400" />;
      default:
        return <Compass className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getSeasonBadge = () => {
    switch (season.toLowerCase()) {
      case 'spring': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'summer': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'autumn': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'winter': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-rose-100/60 shadow-sm text-xs">
      <div className="flex items-center gap-1.5 font-medium text-slate-700">
        {getIcon()}
        <span>{condition}</span>
        <span className="text-slate-400">|</span>
        <span className="font-semibold">{temperature}</span>
      </div>
      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${getSeasonBadge()}`}>
        {season}
      </span>
    </div>
  );
}
