import React from 'react';
import { Settings, Plus } from 'lucide-react';
import { Plan } from '../../types/admin';

interface PlansTabProps {
    plans: Plan[];
    setEditingPlan: (plan: Plan | null) => void;
    setPlanForm: (form: any) => void;
    setShowPlanModal: (show: boolean) => void;
}

const PlansTab: React.FC<PlansTabProps> = ({ plans, setEditingPlan, setPlanForm, setShowPlanModal }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Settings className="text-white/40" />
                    الباقات والأسعار
                </h2>
                <button onClick={() => { setEditingPlan(null); setPlanForm({ name: '', price: 0, description: '', services: [] }); setShowPlanModal(true); }} className="bg-white text-black font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2"><Plus size={16} /> إضافة باقة جديدة</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-[#121214] p-8 rounded-[40px] border border-white/5 relative overflow-hidden group hover:border-fuchsia-500/30 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="text-xl font-black">{plan.name}</h4>
                                <p className="text-xs text-white/40 mt-1">{plan.description}</p>
                            </div>
                            <button onClick={() => { setEditingPlan(plan); setPlanForm({ name: plan.name, price: plan.price, description: plan.description, services: plan.services?.map(s => s.id) || [] }); setShowPlanModal(true); }} className="text-white/20 hover:text-white transition-colors"><Settings size={20} /></button>
                        </div>
                        <p className="text-3xl font-black text-fuchsia-500 mb-6">{plan.price.toLocaleString()} <span className="text-sm text-white/20 font-normal">ج.م / شهرياً</span></p>
                        <div className="space-y-3">
                            {plan.services?.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                                    <div className="w-1 h-1 bg-fuchsia-500 rounded-full"></div>
                                    {s.name}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlansTab;
