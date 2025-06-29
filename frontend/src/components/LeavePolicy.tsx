import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/leavepolicy.css';
import { notifySuccess, notifyError, notifyWarn } from '../utils/toast';

interface LeaveType {
  id: number;
  name: string;
  maxPerYear: number;
  multiApprover: number;
}

function LeavePolicy() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveType | null>(null);
  const [newLeave, setNewLeave] = useState<Omit<LeaveType, 'id'>>({
    name: '',
    maxPerYear: 0,
    multiApprover: 1
  });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const res = await api.get<LeaveType[]>('/leave/types');
      setLeaveTypes(res.data);
      if (res.data.length > 0) {
        setSelectedLeaveId(res.data[0].id);
        setSelectedLeave({ ...res.data[0] });
      }
    } catch {}
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedLeaveId(id);
    const selected = leaveTypes.find((lt) => lt.id === id);
    if (selected) setSelectedLeave({ ...selected });
  };

  const handleSelectedChange = (field: keyof LeaveType, value: string | number) => {
    if (!selectedLeave) return;
    setSelectedLeave({ ...selectedLeave, [field]: value });
  };

  const handleUpdate = async () => {
    if (!selectedLeave || selectedLeave.name.trim() === '' || selectedLeave.maxPerYear <= 0) {
      notifyWarn('All fields are required and Max Days Per Year must be greater than 0.');
      return;
    }
    try {
      await api.put(`/leave/types/${selectedLeave.id}`, selectedLeave);
      notifySuccess('Leave policy updated');
      fetchLeaveTypes();
    } catch {
      notifyError('Failed to update leave policy');
    }
  };

  const handleDelete = async () => {
    if (!selectedLeave) return;
    try {
      await api.delete(`/leave/types/${selectedLeave.id}`);
      setSelectedLeaveId(null);
      setSelectedLeave(null);
      fetchLeaveTypes();
    } catch {
      notifyError('Failed to delete leave type');
    }
  };

  const handleAdd = async () => {
    if (newLeave.name.trim() === '' || newLeave.maxPerYear <= 0) {
      notifyWarn('All fields are required and Max Days Per Year must be greater than 0.');
      return;
    }
    try {
      await api.post('/leave/types', newLeave);
      setNewLeave({ name: '', maxPerYear: 0, multiApprover: 1 });
      fetchLeaveTypes();
    } catch {
      notifyError('Failed to add leave type');
    }
  };

  return (
    <div className="leave-policy-container">
      <h3>Leave Policy</h3>

      {leaveTypes.length > 0 && (
        <div className="leave-select-wrapper">
          <label>Select Leave Type:</label>
          <select className="leave-select" value={selectedLeaveId ?? ''} onChange={handleSelectChange}>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="leave-cards-container">
        {selectedLeave && (
          <div className="leave-card">
            <div className="leave-card-body">
              <div className="leave-field">
                <label className="leave-label">Name</label>
                <input
                  className="leave-input"
                  value={selectedLeave.name}
                  onChange={(e) => handleSelectedChange('name', e.target.value)}
                />
              </div>
              <div className="leave-field">
                <label className="leave-label">Max Days Per Year</label>
                <input
                  type="number"
                  className="leave-input"
                  value={selectedLeave.maxPerYear}
                  onChange={(e) => handleSelectedChange('maxPerYear', Number(e.target.value))}
                />
              </div>
              <div className="leave-field">
                <label className="leave-label">Multi Approver</label>
                <select
                  className="leave-select"
                  value={selectedLeave.multiApprover}
                  onChange={(e) => handleSelectedChange('multiApprover', Number(e.target.value))}
                >
                  {[0, 1, 2, 3].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="leave-actions">
                <button className="delete-btn" onClick={handleDelete}>
                  Delete
                </button>
                <button className="save-btn" onClick={handleUpdate}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="leave-card add-leave-card">
          <div className="leave-card-body">
            <div className="leave-field">
              <label className="leave-label">Name</label>
              <input
                className="leave-input"
                value={newLeave.name}
                onChange={(e) => setNewLeave({ ...newLeave, name: e.target.value })}
              />
            </div>
            <div className="leave-field">
              <label className="leave-label">Max Days Per Year</label>
              <input
                type="number"
                className="leave-input"
                value={newLeave.maxPerYear}
                onChange={(e) => setNewLeave({ ...newLeave, maxPerYear: Number(e.target.value) })}
              />
            </div>
            <div className="leave-field">
              <label className="leave-label">Multi Approver</label>
              <select
                className="leave-select"
                value={newLeave.multiApprover}
                onChange={(e) => setNewLeave({ ...newLeave, multiApprover: Number(e.target.value) })}
              >
                {[0, 1, 2, 3].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="leave-actions">
              <button className="add-btn" onClick={handleAdd}>
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeavePolicy;
