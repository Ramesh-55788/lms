import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/addUser.css';
import { notifySuccess, notifyError, notifyWarn } from '../utils/toast';

interface FormData {
  name: string;
  email: string;
  password: string;
  role: string;
  reportingManagerId: string;
}

const AddUser: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: '',
    reportingManagerId: ''
  });

  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { name, email, password, role, reportingManagerId } = formData;

    if (!name || !email || !password || !role || !reportingManagerId) {
      setMessage('');
      notifyWarn('Please fill in all fields.');
      return;
    }

    try {
      const { status } = await api.post('/auth/register', formData);
      if (status === 201) {
        notifySuccess('User created successfully!');
        setError('');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err: any) {
      setMessage('');
      notifyError(err.response?.status === 400 ? 'User with this email already exists.' : 'Failed to create user.');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
    setMessage('');
    setError('');
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      notifyError('Please select a file.');
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const res = await api.post('/auth/upload-users', uploadFormData);
      if (res.status >= 200 && res.status < 300) {
        notifySuccess(res.data.message);
        setError('');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        notifyError(res.data.message);
        setMessage('');
      }
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to upload file.');
      setMessage('');
    }
  };

  return (
    <div className="add-user-form">
      <h3>Add New User</h3>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="">Select Role</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="hr">HR</option>
        </select>
        <input
          type="number"
          name="reportingManagerId"
          placeholder="Reporting Manager ID"
          value={formData.reportingManagerId}
          onChange={handleChange}
        />
        <button type="submit">Create User</button>
      </form>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <h3>Add Multiple Users</h3>
      <form onSubmit={handleUpload}>
        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default AddUser;
