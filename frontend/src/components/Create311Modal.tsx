import React, { useState } from 'react';
import { create311Request } from '../services/api';
import { X, Send, AlertTriangle } from 'lucide-react';

interface Create311ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const Create311Modal: React.FC<Create311ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Pothole Repair');
  const [districtId, setDistrictId] = useState(1);
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await create311Request({
        title,
        category,
        district_id: districtId,
        lat: 30.2672 + (districtId * 0.01),
        lng: -97.7431 - (districtId * 0.01),
        priority,
        description
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit 311 request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md bg-slate-900 border border-slate-800 p-6 space-y-5 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Submit 311 Citizen Request</h3>
              <p className="text-[11px] text-slate-400">Intake new citizen report into dispatch system</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Request Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep pothole on 5th Ave near Downtown Station"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Pothole Repair">Pothole Repair</option>
                <option value="Streetlight Outage">Streetlight Outage</option>
                <option value="Water Leak">Water Leak</option>
                <option value="Illegal Waste Dumping">Illegal Waste Dumping</option>
                <option value="Noise Complaint">Noise Complaint</option>
                <option value="Traffic Signal Malfunction">Traffic Signal Malfunction</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">District Zone</label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>District 1 — Downtown Central</option>
                <option value={2}>District 2 — Northside Tech Corridor</option>
                <option value={3}>District 3 — East Riverfront</option>
                <option value={4}>District 4 — West Heights</option>
                <option value={5}>District 5 — South Suburbs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Dispatch Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent SLA Dispatch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Detailed Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact street location notes or citizen comments..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Dispatch Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
