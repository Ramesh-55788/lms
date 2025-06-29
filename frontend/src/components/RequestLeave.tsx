import React, { useState, useEffect, FormEvent } from 'react';
import api from '../utils/api';
import { useUser } from '../userContext';
import { useNavigate } from 'react-router-dom';
import '../styles/requestleave.css';
import { notifySuccess, notifyError, notifyWarn } from '../utils/toast';

interface LeaveType {
  id: number;
  name: string;
}

interface LeaveRequestProps {
  onRequestSuccess?: () => void;
}

const LeaveRequest: React.FC<LeaveRequestProps> = ({ onRequestSuccess }) => {
  const { user } = useUser();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDayType, setHalfDayType] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [totalDays, setTotalDays] = useState<number | string>('');

  useEffect(() => {
    api.get('/leave/types')
      .then((res) => setLeaveTypes(res.data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    const calculateLeaveDays = () => {
      if (!startDate || !endDate) {
        setTotalDays(0);
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        setTotalDays(0);
        return;
      }

      let dayCount = 0;
      let current = new Date(start);

      while (current <= end) {
        const day = current.getDay();
        const isWeekend = day === 0 || day === 6;
        const isSandwiched = current > start && current < end && isWeekend;
        dayCount += isWeekend ? (isSandwiched ? 1 : 0) : 1;
        current.setDate(current.getDate() + 1);
      }

      setTotalDays(isHalfDay ? 0.5 : dayCount);
    };

    calculateLeaveDays();
  }, [startDate, endDate, isHalfDay]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!leaveTypeId || !startDate || !endDate || !reason || (isHalfDay && !halfDayType)) {
      notifyWarn('Please fill all required fields.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      notifyWarn('End date cannot be before start date.');
      return;
    }

    if (!isHalfDay && totalDays === 0) {
      notifyWarn('Selected date range includes no working days.');
      return;
    }

    if (isHalfDay && totalDays !== 0.5) {
      notifyWarn('Half-day leave can only be applied for a single day.');
      return;
    }

    const rangeDays: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      rangeDays.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const weekendsOnly = rangeDays.every((d) => d.getDay() === 0 || d.getDay() === 6);

    if (weekendsOnly) {
      notifyWarn('Leave cannot be applied for Saturday/Sunday.');
      return;
    }

    if (!user) return;
    try {
      const res = await api.post('/leave/request', {
        userId: user.id,
        leaveTypeId,
        startDate,
        endDate,
        isHalfDay,
        halfDayType: isHalfDay ? halfDayType : null,
        reason,
        totalDays,
      });

      const requestId = res.data.insertId;

      if (parseInt(leaveTypeId) === 6 && requestId) {
        await api.put(`/leave/approve/${requestId}`);
      }

      notifySuccess('Leave requested successfully');
      onRequestSuccess?.();

      setLeaveTypeId('');
      setStartDate(today);
      setEndDate(today);
      setIsHalfDay(false);
      setHalfDayType('');
      setReason('');

      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.error) {
        alert(err.response.data.error);
        return;
      } else {
        notifyError('Error submitting leave request');
        return;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="leave-request-form">
      <h3 className="leave-request-title">Request Leave</h3>

      <label className="leave-request-label">Leave Type:</label>
      <select
        className="leave-request-input"
        value={leaveTypeId}
        onChange={(e) => setLeaveTypeId(e.target.value)}
        required
      >
        <option value="">Select</option>
        {leaveTypes.map((type) => (
          <option key={type.id} value={type.id.toString()}>
            {type.name}
          </option>
        ))}
      </select>

      <label className="leave-request-label">Start Date:</label>
      <input
        className="leave-request-input"
        type="date"
        value={startDate}
        min={today}
        onChange={(e) => setStartDate(e.target.value)}
        required
      />

      <label className="leave-request-label">End Date:</label>
      <input
        className="leave-request-input"
        type="date"
        value={endDate}
        min={startDate || today}
        onChange={(e) => setEndDate(e.target.value)}
        required
      />

      <label className="leave-request-checkbox-label">
        <input
          className="leave-request-checkbox"
          type="checkbox"
          checked={isHalfDay}
          onChange={(e) => setIsHalfDay(e.target.checked)}
        />
        Half Day
      </label>

      {isHalfDay && (
        <>
          <label className="leave-request-label">Half Day Type:</label>
          <select
            className="leave-request-input"
            value={halfDayType}
            onChange={(e) => setHalfDayType(e.target.value)}
            required
          >
            <option value="">Select</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </>
      )}

      <label className="leave-request-label">Reason:</label>
      <textarea
        className="leave-request-textarea"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
      />

      <p className="leave-request-days">Total Leave Days: {totalDays}</p>

      <div className="leave-request-button-container">
        <button className="leave-request-submit-btn" type="submit">
          Submit Request
        </button>
      </div>
    </form>
  );
};

export default LeaveRequest;
