import React, { useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  cliente?: string;
  profissional?: string;
  status?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  view?: 'month' | 'week' | 'day';
}

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  onDateClick,
  onEventClick,
  view = 'month'
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const totalDays = 42; // 6 weeks * 7 days

    for (let i = 0; i < totalDays; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event =>
      event.start.split('T')[0] === dateStr
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  if (view === 'month') {
    const days = getDaysInMonth(currentDate);

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="material-icons-round text-gray-600">chevron_left</span>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="material-icons-round text-gray-600">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Week Headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth(day) ? 'bg-gray-50 text-gray-400' : ''
                }`}
                onClick={() => onDateClick?.(day)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-sm font-medium ${
                      isToday(day)
                        ? 'w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center'
                        : isCurrentMonth(day)
                          ? 'text-gray-900'
                          : 'text-gray-400'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="px-2 py-1 rounded text-xs font-medium text-white cursor-pointer truncate"
                      style={{ backgroundColor: event.color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Para views de semana e dia (implementação futura)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-icons-round text-blue-600 text-2xl">calendar_view_week</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Visualização {view === 'week' ? 'Semanal' : 'Diária'}
        </h3>
        <p className="text-gray-600">Em desenvolvimento</p>
      </div>
    </div>
  );
};

export default Calendar;