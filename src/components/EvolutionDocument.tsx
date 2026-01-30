
import React from 'react';
import { DOCTOR_INFO } from '../constants';

interface EvolutionDocumentProps {
    patient: { name: string; cpf?: string; cns?: string };
    content: string;
    date: string;
    doctorName?: string;
    doctorCrm?: string;
    isPrintCopy?: boolean;
}

export const EvolutionDocument: React.FC<EvolutionDocumentProps> = ({
    patient,
    content,
    date,
    doctorName,
    doctorCrm,
    isPrintCopy = false
}) => {
    const finalDoctorName = doctorName || DOCTOR_INFO.name;
    const finalDoctorCrm = doctorCrm || DOCTOR_INFO.crm;

    const getFormattedDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        return dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className={`w-full max-w-[700px] bg-white aspect-[1/1.414] p-16 flex flex-col paper-shadow rounded-sm text-slate-800 relative overflow-hidden ${isPrintCopy ? 'print:shadow-none print:w-full print:h-full print:m-0 print:border-none' : 'print:m-0 print:p-16 print:shadow-none print:w-full'}`}>

            {/* Header with Logo */}
            <div className="flex items-center gap-4 mb-6">
                <img src="/logo.jpg" alt="Logo Clínica" className="h-24 object-contain" />
            </div>

            {/* Document Title */}
            <div className="mb-10 text-left">
                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Ficha de Evolução Clínica</h1>
                <div className="w-20 h-1 bg-primary mt-2"></div>
            </div>

            {/* Patient Info */}
            <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-lg text-slate-900">
                    <span className="font-bold">Paciente:</span> {patient.name || '---'}
                </p>
                {(patient.cpf || patient.cns) && (
                    <p className="text-xs text-slate-500 mt-1">
                        {patient.cpf && <span className="mr-4">CPF: {patient.cpf}</span>}
                        {patient.cns && <span>CNS: {patient.cns}</span>}
                    </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                    <span className="font-bold">Data:</span> {getFormattedDate(date)}
                </p>
            </div>

            {/* Evolution Content */}
            <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-700 italic mb-8">
                {content || 'Nenhuma evolução registrada...'}
            </div>

            {/* Signature Section - Now immediate instead of at bottom */}
            <div className="pt-4 border-t border-slate-100 mb-12">
                <div className="flex flex-col items-start">
                    <div className="w-48 border-t border-slate-300 mb-1"></div>
                    <h3 className="font-bold text-slate-900 text-sm">{finalDoctorName}</h3>
                    <p className="text-slate-500 text-[10px]">{finalDoctorCrm}</p>
                </div>
            </div>

            {/* Professional space optimization footer */}
            <div className="mt-auto pt-8 border-t border-dashed border-slate-200">
                {/* Footer Contact */}
                <div className="text-[8px] text-gray-400 text-center leading-relaxed bg-slate-50/50 p-3 rounded-lg">
                    <p>Telefones: {DOCTOR_INFO.phones} | {DOCTOR_INFO.address}</p>
                    <p>CNPJ: {DOCTOR_INFO.cnpj} - E-mail: {DOCTOR_INFO.email}</p>
                </div>
            </div>
        </div>
    );
};
