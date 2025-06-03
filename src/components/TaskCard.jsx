import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, Play, Calendar } from 'lucide-react';
import clsx from 'clsx';

export default function TaskCard({ task, surahName, onStart, index = 0 }) {
  const isHafazan = task.type !== 'murajaah';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card rounded-xl p-6 hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "p-3 rounded-lg",
            isHafazan ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
          )}>
            {isHafazan ? <BookOpen className="w-5 h-5" /> : <Star className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              {isHafazan ? 'New Memorization' : 'Review (Murajaah)'}
            </h3>
            <p className="text-sm text-slate-600">
              {surahName} - {task.startAyah && task.endAyah && task.startAyah !== task.endAyah 
                ? `Ayahs ${task.startAyah}-${task.endAyah}` 
                : `Ayah ${task.ayahNumber || task.startAyah}`}
            </p>
          </div>
        </div>
        <span className={clsx(
          "px-3 py-1 rounded-full text-xs font-medium",
          isHafazan ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
        )}>
          {isHafazan ? 'Hafazan' : 'Murajaah'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          <span>Today</span>
        </div>

        <button
          onClick={() => onStart(task, isHafazan ? 'hafazan' : 'murajaah')}
          className={clsx(
            "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 group-hover:scale-105",
            isHafazan ? "btn-primary" : "btn-warning"
          )}
        >
          <Play className="w-4 h-4" />
          Start {isHafazan ? 'Memorizing' : 'Review'}
        </button>
      </div>
    </motion.div>
  );
}
