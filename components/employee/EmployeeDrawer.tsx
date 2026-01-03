import React, { useState, useEffect } from 'react';
// [수정] Edit2 추가
import { X, Calendar as CalendarIcon, Briefcase, Mail, Phone, MapPin, Award, Globe, Plus, Save, Car, Clock, User, Edit2 } from 'lucide-react';
import { Employee, Assignment, Project, EmployeeType } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner'; // [추가]

// ... (나머지 동일)
interface EmployeeDrawerProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  assignments?: Assignment[];
  projects?: Project[];
  onEditAssignment?: (assignment: Assignment) => void;
  onUpdateEmployee?: (id: string, data: Partial<Employee>) => void;
}

export const EmployeeDrawer = ({ employee, isOpen, onClose, isAdmin, assignments = [], projects = [], onEditAssignment, onUpdateEmployee }: EmployeeDrawerProps) => {
  const [localInfo, setLocalInfo] = useState({
    email: '', phone: '', address: '', birth: '', employee_type: 'billable' as EmployeeType
  });
  const [isDirty, setIsDirty] = useState(false);
  
  const [certs, setCerts] = useState<string[]>(['정보처리기사']);
  const [langs, setLangs] = useState<string[]>(['English (Fluent)']);
  const [newCert, setNewCert] = useState('');
  const [newLang, setNewLang] = useState('');

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'billable': return 'bg-blue-100 text-blue-700';
      case 'internal': return 'bg-gray-200 text-gray-600';
      case 'other_unit': return 'bg-purple-100 text-purple-700';
      case 'outsourcing': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  useEffect(() => {
    if (employee) {
      setLocalInfo({
        email: `${employee.name}@company.com`,
        phone: '010-1234-5678',
        address: 'Seoul, Korea',
        birth: '1990.01.01',
        employee_type: employee.employee_type
      });
      setIsDirty(false);
    }
  }, [employee]);

  if (!employee) return null;
  
  const employeeAssignments = assignments.filter(a => a.employee_id === employee.id).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const handleInfoChange = (field: string, value: string) => {
    setLocalInfo(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (onUpdateEmployee) {
      onUpdateEmployee(employee.id, { ...localInfo });
    }
    // [수정] Toast 적용
    toast.success(`${employee.name}님의 정보가 저장되었습니다.`);
    setIsDirty(false);
  };

  const handleAddCert = () => { if(newCert.trim()) { setCerts([...certs, newCert.trim()]); setNewCert(''); } };
  const handleAddLang = () => { if(newLang.trim()) { setLangs([...langs, newLang.trim()]); setNewLang(''); } };

  return (
    <>
      <div className={`fixed inset-0 bg-black/5 backdrop-blur-[1px] transition-opacity z-[70] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[80] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getBadgeStyle(localInfo.employee_type)}`}>
              {localInfo.employee_type}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-24">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><Briefcase size={16} /> Information</h3>
            <div className="space-y-3 text-sm text-gray-600">
               <div className="flex items-center gap-3">
                 <User size={16} className="text-gray-400 flex-shrink-0" />
                 <div className="flex-1 border-b border-gray-100 py-0.5">
                   <select 
                      disabled={!isAdmin}
                      className="w-full bg-transparent outline-none text-gray-700 disabled:opacity-50 cursor-pointer text-sm"
                      value={localInfo.employee_type}
                      onChange={(e) => handleInfoChange('employee_type', e.target.value)}
                   >
                     <option value="billable">Billable</option>
                     <option value="internal">Internal</option>
                     <option value="other_unit">Other Unit</option>
                     <option value="outsourcing">Outsourcing</option>
                   </select>
                 </div>
               </div>
               <div className="flex items-center gap-3"><Mail size={16} className="text-gray-400" /><input className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5 transition-all disabled:bg-transparent" value={localInfo.email} onChange={e => handleInfoChange('email', e.target.value)} disabled={!isAdmin} /></div>
               <div className="flex items-center gap-3"><Phone size={16} className="text-gray-400" /><input className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5 transition-all disabled:bg-transparent" value={localInfo.phone} onChange={e => handleInfoChange('phone', e.target.value)} disabled={!isAdmin} /></div>
               <div className="flex items-center gap-3"><MapPin size={16} className="text-gray-400" /><input className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5 transition-all disabled:bg-transparent" value={localInfo.address} onChange={e => handleInfoChange('address', e.target.value)} disabled={!isAdmin} /></div>
               <div className="flex items-center gap-3"><CalendarIcon size={16} className="text-gray-400" /><input className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5 transition-all disabled:bg-transparent" value={localInfo.birth} onChange={e => handleInfoChange('birth', e.target.value)} disabled={!isAdmin} /></div>
            </div>
          </div>
          
          {localInfo.address && (
             <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                   <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Car size={14} /> Commute Info (9AM)</h3>
                   <span className="text-[10px] text-gray-400">To: 시청역 (City Hall)</span>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><MapPin size={18} /></div>
                      <div><div className="text-xs text-gray-400">Public Transit</div><div className="text-sm font-bold text-gray-800">8.2 km</div></div>
                   </div>
                   <div className="text-right">
                      <div className="text-xs text-gray-400 flex items-center justify-end gap-1"><Clock size={12} /> Est. Time</div>
                      <div className="text-sm font-bold text-blue-600">35 min</div>
                   </div>
                </div>
             </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><Award size={16} /> Certifications</h3>
            <div className="flex flex-wrap gap-2">
               {certs.map((c, i) => (<span key={i} className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100 flex items-center gap-1">{c} <button onClick={() => setCerts(certs.filter((_, idx) => idx !== i))}><X size={12} className="hover:text-red-500" /></button></span>))}
            </div>
            {isAdmin && (<div className="flex gap-2"><input className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-500" placeholder="Add License (Enter)" value={newCert} onChange={e => setNewCert(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCert()} /><button onClick={handleAddCert} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Plus size={14} /></button></div>)}
          </div>
          
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><Globe size={16} /> Languages</h3>
             <div className="flex flex-wrap gap-2">
                {langs.map((l, i) => (<span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-100 flex items-center gap-1">{l} <button onClick={() => setLangs(langs.filter((_, idx) => idx !== i))}><X size={12} className="hover:text-red-500" /></button></span>))}
             </div>
             {isAdmin && (<div className="flex gap-2"><input className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-500" placeholder="Add Language (Enter)" value={newLang} onChange={e => setNewLang(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLang()} /><button onClick={handleAddLang} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Plus size={14} /></button></div>)}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><CalendarIcon size={16} /> Project History</h3>
             {employeeAssignments.length === 0 ? <p className="text-sm text-gray-400 italic">참여한 프로젝트가 없습니다.</p> : (
               <div className="relative border-l-2 border-gray-100 ml-2 space-y-6 pb-2">
                 {employeeAssignments.map(assign => {
                   const project = projects.find(p => p.id === assign.project_id); const isPast = new Date(assign.end_date) < new Date();
                   return (
                     <div key={assign.id} className="relative pl-6 group">
                       <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isPast ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                       <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow">
                         <div className="flex justify-between items-start mb-1"><span className={`text-sm font-bold ${isPast ? 'text-gray-600' : 'text-blue-900'}`}>{project?.name || 'Unknown Project'}</span>{isAdmin && onEditAssignment && <button onClick={() => onEditAssignment(assign)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit Assignment"><Edit2 size={14} /></button>}</div>
                         <div className="text-xs text-gray-500 mb-2 font-mono">{format(assign.start_date, 'yyyy.MM.dd')} ~ {format(assign.end_date, 'yyyy.MM.dd')}</div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>
        
        {isAdmin && (
          <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 flex justify-end gap-2 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
            <button disabled={!isDirty} onClick={handleSave} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isDirty ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              <Save size={16} /> Save Changes
            </button>
          </div>
        )}
      </div>
    </>
  );
};