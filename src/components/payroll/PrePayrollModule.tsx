'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { PrePayrollSummaryItem } from '@/types';
import { exportPrePayrollToExcel, exportPrePayrollToPDF } from '@/lib/payroll/export-payroll';

interface PrePayrollModuleProps {
  payrollItems: PrePayrollSummaryItem[];
}

export const PrePayrollModule: React.FC<PrePayrollModuleProps> = ({ payrollItems }) => {
  const [periodType, setPeriodType] = useState<'semanal' | 'catorcenal' | 'quincenal'>('semanal');
  const [periodName, setPeriodName] = useState('Semana 41 (40 Horas)');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = payrollItems.filter(item => {
    if (departmentFilter !== 'all' && item.department !== departmentFilter) return false;
    if (
      searchQuery &&
      !item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.employee_number.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalNet = filteredItems.reduce((acc, i) => acc + i.net_payable_mxn, 0);
  const totalDoubleOvertimeHours = filteredItems.reduce((acc, i) => acc + i.overtime_double_hours, 0);
  const totalTripleOvertimeHours = filteredItems.reduce((acc, i) => acc + i.overtime_triple_hours, 0);
  const totalDeductions = filteredItems.reduce((acc, i) => acc + i.total_deductions_mxn, 0);

  const departments = Array.from(new Set(payrollItems.map(i => i.department)));

  const handleDownloadExcel = () => {
    exportPrePayrollToExcel(filteredItems, periodName);
  };

  const handleDownloadPDF = () => {
    exportPrePayrollToPDF(filteredItems, periodName);
  };

  return (
    <div className="w-full space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium mb-1 flex items-center justify-between">
            <span>Neto a Pagar</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            ${totalNet.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium mb-1 flex items-center justify-between">
            <span>H.E. Dobles (200%)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-600 font-mono">
            {totalDoubleOvertimeHours} hrs
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium mb-1 flex items-center justify-between">
            <span>H.E. Triples (300%)</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-600 font-mono">
            {totalTripleOvertimeHours} hrs
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium mb-1 flex items-center justify-between">
            <span>Deducciones</span>
            <span className="text-xs text-rose-500 font-bold">LFT</span>
          </div>
          <div className="text-xl font-bold text-rose-600 font-mono">
            -${totalDeductions.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Control Bar & Export Buttons */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            Cálculo de Pre-Nómina
          </h3>
          <p className="text-xs text-slate-500">Layouts compatibles con CONTPAQi Nóminas y Aspel NOI.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF Oficial
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar colaborador..."
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-500 w-full sm:w-52"
        />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Periodo:</span>
            <select
              value={periodType}
              onChange={e => {
                const val = e.target.value as 'semanal' | 'catorcenal' | 'quincenal';
                setPeriodType(val);
                if (val === 'semanal') setPeriodName('Semana 41 (40 Horas)');
                if (val === 'catorcenal') setPeriodName('Catorcena 21');
                if (val === 'quincenal') setPeriodName('Quincena 19');
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="semanal">Semanal (40h)</option>
              <option value="catorcenal">Catorcenal</option>
              <option value="quincenal">Quincenal</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">Depto:</span>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pre-Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">Clave</th>
                <th className="py-2.5 px-4">Colaborador</th>
                <th className="py-2.5 px-4 text-right">Sal. Diario</th>
                <th className="py-2.5 px-4 text-center">Días</th>
                <th className="py-2.5 px-4 text-center">F / R</th>
                <th className="py-2.5 px-4 text-right">H.E. Dobles</th>
                <th className="py-2.5 px-4 text-right">H.E. Triples</th>
                <th className="py-2.5 px-4 text-right">Percepciones</th>
                <th className="py-2.5 px-4 text-right">Deducciones</th>
                <th className="py-2.5 px-4 text-right">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => (
                <tr key={item.user_id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{item.employee_number}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{item.full_name}</td>
                  <td className="py-2.5 px-4 text-right font-mono">${item.daily_salary_mxn.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-center font-bold">{item.regular_days_worked}d</td>
                  <td className="py-2.5 px-4 text-center text-slate-500">
                    {item.justified_absences + item.unjustified_absences} F / {item.tardiness_count} R
                  </td>
                  <td className="py-2.5 px-4 text-right text-blue-600 font-mono font-medium">
                    {item.overtime_double_hours}h (${item.overtime_double_total_mxn.toFixed(2)})
                  </td>
                  <td className="py-2.5 px-4 text-right text-purple-600 font-mono font-medium">
                    {item.overtime_triple_hours}h (${item.overtime_triple_total_mxn.toFixed(2)})
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                    ${item.gross_earnings_mxn.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-medium">
                    -${item.total_deductions_mxn.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                    ${item.net_payable_mxn.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
