import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function StatsCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color = 'blue',
  trend,
  index = 0 
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
    green: 'from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50',
    amber: 'from-amber-500 to-amber-600 text-amber-600 bg-amber-50',
    purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
    rose: 'from-rose-500 to-rose-600 text-rose-600 bg-rose-50'
  };

  const baseClasses = colorClasses[color]?.split(' ') || [];
  const iconColor = baseClasses[2];
  const bgColor = baseClasses.slice(-2).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card rounded-xl p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={clsx("p-3 rounded-lg", bgColor)}>
          <Icon className={clsx("w-6 h-6", iconColor)} />
        </div>
        {typeof trend === 'number' && (
          <div className={clsx(
            "px-2 py-1 rounded-full text-xs font-medium",
            trend > 0 ? "bg-green-100 text-green-700" : trend < 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
