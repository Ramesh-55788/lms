import React, { useState, useEffect } from 'react';
import '../styles/teamcalendar.css';
import type { JSX } from 'react';

interface TeamMember {
  id: number;
  name: string;
}

interface LeaveData {
  lr_user_id: number;
  lr_start_date: string;
  lr_end_date: string;
  leaveTypeName: string;
  is_deleted: boolean;
}

interface Props {
  teamMembers?: TeamMember[];
  fetchTeamLeaveData?: (ids: number[], month: number, year: number) => Promise<LeaveData[]>;
}

const Calendar: React.FC<Props> = ({ teamMembers = [], fetchTeamLeaveData }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [teamLeaveData, setTeamLeaveData] = useState<LeaveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const leaveTypeColors: { [key: string]: string } = {
    'Casual Leave': '#4CAF50',
    'Sick Leave': '#060270',
    'Paid Leave': '#2196F3',
    'Maternity Leave': '#9C27B0',
    'Paternity Leave': '#00BCD4',
    'Emergency Leave': '#F44336',
    'Loss of Pay': '#FF9800',
  };

  const legendItems = Object.entries(leaveTypeColors).map(([type, color]) => ({ type, color }));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  useEffect(() => {
    const loadTeamLeaveData = async () => {
      if (!teamMembers.length) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (fetchTeamLeaveData) {
          const prevMonth = selectedMonth === 0 ? 12 : selectedMonth;
          const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
          const nextMonth = selectedMonth === 11 ? 1 : selectedMonth + 2;
          const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;

          const memberIds = teamMembers.map(member => member.id);
          const [prevMonthData, currentMonthData, nextMonthData] = await Promise.all([
            fetchTeamLeaveData(memberIds, prevMonth, prevYear).catch(() => []),
            fetchTeamLeaveData(memberIds, selectedMonth + 1, selectedYear).catch(() => []),
            fetchTeamLeaveData(memberIds, nextMonth, nextYear).catch(() => [])
          ]);

          const allLeaveData = [...prevMonthData, ...currentMonthData, ...nextMonthData];
          const currentMonthStart = new Date(selectedYear, selectedMonth, 1);
          const currentMonthEnd = new Date(selectedYear, selectedMonth + 1, 0);
          const filteredLeavesMap = new Map<string, LeaveData>();

          allLeaveData.forEach(leave => {
            if (!leave.is_deleted) {
              const leaveStart = new Date(leave.lr_start_date);
              const leaveEnd = new Date(leave.lr_end_date);
              if (leaveStart <= currentMonthEnd && leaveEnd >= currentMonthStart) {
                const key = `${leave.lr_user_id}_${leave.lr_start_date}_${leave.lr_end_date}_${leave.leaveTypeName}`;
                if (!filteredLeavesMap.has(key)) {
                  filteredLeavesMap.set(key, leave);
                }
              }
            }
          });

          setTeamLeaveData(Array.from(filteredLeavesMap.values()));
        } else {
          setTeamLeaveData([]);
        }
      } catch (error) {
        console.error('Error loading team leave data:', error);
        setTeamLeaveData([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeamLeaveData();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [selectedMonth, selectedYear, teamMembers, fetchTeamLeaveData]);

  const formatLiveTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    const day = new Intl.DateTimeFormat('en-US', options).format(date);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${day} ${hours}:${minutes} ${ampm}`;
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const renderWeekHeaders = (): JSX.Element[] => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const headers: JSX.Element[] = [];
  
    for (let week = 0; week < Math.ceil((daysInMonth + firstDay) / 7); week++) {
      dayNames.forEach(day => {
        headers.push(<th key={`${week}-${day}`} className="day-header">{day}</th>);
      });
    }
  
    return headers;
  };  

  const renderDateHeaders = (): JSX.Element[] => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const headers: JSX.Element[] = [];
  
    for (let i = 0; i < firstDay; i++) {
      headers.push(<th key={`empty-${i}`} className="date-header empty-date"></th>);
    }
  
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(selectedYear, selectedMonth, i);
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      headers.push(
        <th key={i} className={`date-header ${isWeekend ? 'weekend' : ''}`}>{i}</th>
      );
    }
  
    const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;
    const remainingCells = totalCells - (daysInMonth + firstDay);
    for (let i = 0; i < remainingCells; i++) {
      headers.push(<th key={`empty-end-${i}`} className="date-header empty-date"></th>);
    }
  
    return headers;
  };  

  const renderCalendarBody = () => {
    if (!teamMembers.length) {
      return (
        <tr>
          <td colSpan={100} className="no-members">No team members found</td>
        </tr>
      );
    }

    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);

    return teamMembers.map(member => {
      const memberLeaves = teamLeaveData.filter(leave => leave.lr_user_id === member.id);
      const dayCells = [];

      for (let i = 0; i < firstDay; i++) {
        dayCells.push(<td key={`empty-${i}`} className="calendar-cell empty-cell"></td>);
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(selectedYear, selectedMonth, i);
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        const leave = memberLeaves.find(leave => {
          const start = new Date(leave.lr_start_date);
          const end = new Date(leave.lr_end_date);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          currentDate.setHours(12, 0, 0, 0);
          return currentDate >= start && currentDate <= end;
        });

        dayCells.push(
          <td key={`${member.id}-${i}`} className={`calendar-cell ${isWeekend ? 'weekend' : ''}`}>
            {leave && (
              <div
                className="leave-indicator"
                style={{ backgroundColor: leaveTypeColors[leave.leaveTypeName] || '#9CA3AF' }}
                title={`${leave.leaveTypeName} (${new Date(leave.lr_start_date).toLocaleDateString()} - ${new Date(leave.lr_end_date).toLocaleDateString()})`}
              />
            )}
          </td>
        );
      }

      const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;
      const remainingCells = totalCells - (daysInMonth + firstDay);
      for (let i = 0; i < remainingCells; i++) {
        dayCells.push(<td key={`empty-end-${i}`} className="calendar-cell empty-cell"></td>);
      }

      return (
        <tr key={member.id} className="member-row">
          <td className="member-name">
            <div className="member-info">
              <div className="member-avatar">{member.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
              <span className="member-name-text">{member.name}</span>
            </div>
          </td>
          {dayCells}
        </tr>
      );
    });
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const renderLegend = () => (
    <div className="calendar-legend">
      {legendItems.map((item, index) => (
        <div className="legend-item" key={index}>
          <div className="legend-color" style={{ backgroundColor: item.color }}></div>
          <span className="legend-text">{item.type}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="team-calendar-container">
      <div className="calendar-header">
        <h2 className="calendar-title">
          Team calendar <span className="live-time">{formatLiveTime(currentTime)}</span>
        </h2>
        <div className="month-selector">
          <button onClick={handlePrevMonth} className="nav-button">◀</button>
          <span className="month-year">{monthNames[selectedMonth]} {selectedYear}</span>
          <button onClick={handleNextMonth} className="nav-button">▶</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-message">Loading calendar data...</div>
        </div>
      ) : (
        <>
          <div className="calendar-table-container">
            <table className="calendar-table">
              <thead className="calendar-header-section">
                <tr className="week-header-row">
                  <th className="member-header">Team Members</th>
                  {renderWeekHeaders()}
                </tr>
                <tr className="date-header-row">
                  <th className="member-header-empty"></th>
                  {renderDateHeaders()}
                </tr>
              </thead>
              <tbody className="calendar-body">
                {renderCalendarBody()}
              </tbody>
            </table>
          </div>
          {renderLegend()}
        </>
      )}
    </div>
  );
};

export default Calendar;
