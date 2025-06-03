import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Star, BookOpen } from 'lucide-react';
import clsx from 'clsx';

export default function CalendarView({ planId, getCalendarData }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const calendarData = getCalendarData(planId, month, year);
  const today = new Date();
  
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(month + direction);
    setCurrentDate(newDate);
  };
  
  const getDayStatus = (day) => {
    const dayData = calendarData[day];
    if (!dayData || dayData.length === 0) return 'empty';
    
    const hafazanTasks = dayData.filter(item => item.type === 'hafazan');
    const murajaahTasks = dayData.filter(item => item.type === 'murajaah');
    
    const hafazanCompleted = hafazanTasks.every(item => item.completed);
    const murajaahCompleted = murajaahTasks.every(item => item.completed);
    const allCompleted = dayData.every(item => item.completed);
    
    if (allCompleted && dayData.length > 0) return 'completed';
    if (hafazanTasks.length > 0 && hafazanCompleted) return 'hafazan-complete';
    if (murajaahTasks.length > 0 && murajaahCompleted) return 'murajaah-complete';
    if (dayData.some(item => item.completed)) return 'partial';
    return 'scheduled';
  };
  
  const isToday = (day) => {
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  const formatTaskName = (task) => {
    // Handle range-based tasks (murajaah ranges)
    if (task.startAyah && task.endAyah && task.startAyah !== task.endAyah) {
      return `${task.surahNumber}:${task.startAyah}-${task.endAyah}`;
    }
    // Handle single ayah tasks (hafazan and legacy murajaah)
    return `${task.surahNumber}:${task.ayahNumber || task.startAyah}`;
  };
  
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-1"></div>
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const status = getDayStatus(day);
      const dayData = calendarData[day] || [];
      const isTodayDate = isToday(day);
      
      days.push(
        <motion.div 
          key={day}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: day * 0.01 }}
          className={clsx(
            "aspect-square p-1 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer group relative overflow-hidden",
            isTodayDate && "ring-2 ring-primary-500 ring-offset-1",
            status === 'completed' && "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
            status === 'hafazan-complete' && "bg-blue-50 border-blue-200 hover:bg-blue-100",
            status === 'murajaah-complete' && "bg-amber-50 border-amber-200 hover:bg-amber-100",
            status === 'partial' && "bg-purple-50 border-purple-200 hover:bg-purple-100",
            status === 'scheduled' && "bg-slate-50 border-slate-200 hover:bg-slate-100",
            status === 'empty' && "bg-white border-slate-100"
          )}
        >
          {/* Day Number */}
          <div className={clsx(
            "text-xs font-bold mb-1 leading-none",
            isTodayDate ? "text-primary-700" : "text-slate-800"
          )}>
            {day}
          </div>
          
          {/* Task Names - Google Calendar Style */}
          {dayData.length > 0 && (
            <div className="space-y-0.5 text-xs">
              {dayData.slice(0, 4).map((task, index) => {
                const isHafazan = task.type === 'hafazan';
                return (
                  <div
                    key={index}
                    className={clsx(
                      "px-1 py-0.5 rounded text-white font-medium leading-none truncate",
                      task.completed 
                        ? (isHafazan ? "bg-blue-600" : "bg-amber-600")
                        : (isHafazan ? "bg-blue-400" : "bg-amber-400")
                    )}
                    title={`${isHafazan ? 'Hafazan' : 'Murajaah'}: ${formatTaskName(task)} ${task.completed ? '(Complete)' : '(Pending)'}`}
                  >
                    {formatTaskName(task)}
                  </div>
                );
              })}
              {dayData.length > 4 && (
                <div className="px-1 py-0.5 bg-slate-400 text-white rounded text-xs font-medium leading-none">
                  +{dayData.length - 4} more
                </div>
              )}
            </div>
          )}
          
          {/* Status Icon - Only on hover */}
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-bl-md">
            {status === 'completed' && (
              <CheckCircle className="w-3 h-3 text-emerald-500 m-0.5" />
            )}
            {status === 'hafazan-complete' && (
              <BookOpen className="w-3 h-3 text-blue-500 m-0.5" />
            )}
            {status === 'murajaah-complete' && (
              <Star className="w-3 h-3 text-amber-500 m-0.5" />
            )}
            {(status === 'scheduled' || status === 'partial') && (
              <Circle className="w-3 h-3 text-slate-400 m-0.5" />
            )}
          </div>
        </motion.div>
      );
    }
    
    return days;
  };
  
  return (
    <div className="glass-card rounded-xl p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigateMonth(-1)}
          className="p-2 btn-secondary rounded-lg hover:bg-slate-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <motion.h2 
          key={`${month}-${year}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-slate-800"
        >
          {monthNames[month]} {year}
        </motion.h2>
        
        <button 
          onClick={() => navigateMonth(1)}
          className="p-2 btn-secondary rounded-lg hover:bg-slate-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-slate-600">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {renderCalendarDays()}
      </div>
      
      {/* Legend */}
      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-blue-400 rounded text-white flex items-center justify-center font-bold text-xs">H</div>
            <span className="text-slate-600">Hafazan Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-blue-600 rounded text-white flex items-center justify-center font-bold text-xs">H</div>
            <span className="text-slate-600">Hafazan Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-amber-400 rounded text-white flex items-center justify-center font-bold text-xs">M</div>
            <span className="text-slate-600">Murajaah Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-amber-600 rounded text-white flex items-center justify-center font-bold text-xs">M</div>
            <span className="text-slate-600">Murajaah Complete</span>
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-500 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>All Tasks Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Format: Surah:Ayah (e.g., 2:255)</span>
          </div>
        </div>
      </div>
    </div>
  );
}