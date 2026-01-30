
import React from 'react';
import { DOCTOR_INFO } from '../constants';
import { PrescriptionItem, Patient } from '../types';

interface PrescriptionDocumentProps {
    patient: { name: string; cpf?: string; cns?: string; };
    items: Array<{ name: string; dosage: string; quantity: string }>;
    usageType: string;
    location: string;
    date: string;
    doctorName?: string;
    doctorCrm?: string;
    isPrintCopy?: boolean;
}

export const PrescriptionDocument: React.FC<PrescriptionDocumentProps> = ({
    patient,
    items,
    usageType,
    location,
    date,
    doctorName,
    doctorCrm,
    isPrintCopy = false
}) => {
    const finalDoctorName = doctorName || DOCTOR_INFO.name;
    const finalDoctorCrm = doctorCrm || DOCTOR_INFO.crm;
    // Helper to format date
    const getFormattedDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        return dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className={`w-full bg-white aspect-[1/1.414] p-8 flex flex-col text-slate-800 relative overflow-hidden ${isPrintCopy ? 'print:shadow-none print:w-full print:h-full print:m-0 print:border-none' : 'max-w-[500px] paper-shadow rounded-sm p-12 print:m-0 print:p-12 print:shadow-none print:w-full'}`}>

            {/* Header */}
            <div className="flex justify-start mb-8">
                <img src="/logo.jpg" alt="Logo Clínica" className="h-20 object-contain" />
            </div>

            {/* Patient Info */}
            <div className="mb-8 space-y-1">
                <p className="text-base text-slate-900">
                    <span className="font-bold">Nome:</span> {patient.name || 'Nome do paciente'}
                </p>
                {patient.cns && (
                    <p className="text-sm text-slate-900">
                        <span className="font-bold">CNS</span> {patient.cns}
                    </p>
                )}
                {patient.cpf && (
                    <p className="text-sm text-slate-900">
                        <span className="font-bold">CPF:</span> {patient.cpf}
                    </p>
                )}
            </div>

            {/* Medications List */}
            <div className="flex-1">
                <div className="mb-4">
                    <p className="text-slate-900 text-sm">
                        Uso {usageType}
                    </p>
                </div>
                <div className="space-y-4">
                    {items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-800 flex justify-between items-start gap-4">
                            <div className="flex gap-2">
                                <span>{idx + 1}.</span>
                                <div>
                                    <span>{item.name || 'Medicamento ' + (idx + 1)}</span>
                                    {item.dosage && <span> ({item.dosage})</span>}
                                </div>
                            </div>
                            {item.quantity && <span className="whitespace-nowrap">{item.quantity}</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Date and Location */}
            <div className="mt-8 text-center text-sm text-slate-800 mb-20">
                {location}, {getFormattedDate(date)}
            </div>

            {/* Signature */}
            <div className="mt-auto flex flex-col items-center text-center">
                <div className="w-48 border-t border-slate-400 mb-2"></div>
                <h3 className="font-medium text-slate-900 text-[12px]">{finalDoctorName}</h3>
                <p className="text-slate-600 text-[12px]">{finalDoctorCrm}</p>

                {/* Footer Contact */}
                <div className="w-full border-t border-gold/30 mt-6 pt-4 text-[9px] text-gray-500 flex flex-col items-center leading-tight">
                    <p>Telefones: {DOCTOR_INFO.phones}</p>
                    <p>{DOCTOR_INFO.address}</p>
                    <p>CNPJ: {DOCTOR_INFO.cnpj} - E-mail: {DOCTOR_INFO.email}</p>
                </div>
            </div>

        </div>
    );
};
