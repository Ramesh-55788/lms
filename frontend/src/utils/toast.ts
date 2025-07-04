import { toast } from 'react-toastify';

export const notifySuccess = (msg: string) => toast.success(msg);
export const notifyError = (msg: string) => toast.error(msg);
export const notifyWarn = (msg: string) => toast.warn(msg);
export const notifyInfo = (msg: string) => toast.info(msg);
