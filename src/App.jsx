import React, { useState, useEffect, useMemo } from 'react';
import { Copy, AlertCircle, Calculator, Check } from 'lucide-react';

export default function NeonatalJaundiceCalculator() {
  // --- State Management ---
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  
  // Auto-populated values
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  
  const [gestationWeeks, setGestationWeeks] = useState('');
  const [gestationDays, setGestationDays] = useState('');
  const [bilirubin, setBilirubin] = useState(''); // mg/dL
  
  const [riskFactors, setRiskFactors] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    const now = new Date();
    // Manual formatting for Local Time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    setCurrentDate(`${year}-${month}-${day}`);
    setCurrentTime(`${hours}:${minutes}`);
  }, []);

  // --- Calculations ---

  // 1. Calculate Hours of Life (HOL)
  const hol = useMemo(() => {
    if (!dob || !tob || !currentDate || !currentTime) return null;
    
    const birth = new Date(`${dob}T${tob}`);
    const current = new Date(`${currentDate}T${currentTime}`);
    
    const diffMs = current - birth;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours >= 0 ? parseFloat(diffHours.toFixed(1)) : 0;
  }, [dob, tob, currentDate, currentTime]);

  // 2. Risk Category
  const riskCategory = useMemo(() => {
    if (gestationWeeks === '' && gestationDays === '') {
      return { label: "Pending Input", code: "NA", color: "text-slate-400 bg-slate-100" };
    }

    const weeks = parseInt(gestationWeeks) || 0;
    const days = parseInt(gestationDays) || 0;
    const totalWeeks = weeks + (days / 7);
    
    if (totalWeeks < 35 && totalWeeks > 0) return { label: "< 35 Weeks (Consult NICU)", code: "HIGH", color: "text-red-700 bg-red-50" };

    if (totalWeeks >= 38 && !riskFactors) return { label: "Low Risk Neonate", code: "LOW", color: "text-emerald-700 bg-emerald-50" };
    if ((totalWeeks >= 38 && riskFactors) || (totalWeeks >= 35 && totalWeeks < 38 && !riskFactors)) {
      return { label: "Medium Risk Neonate", code: "MED", color: "text-amber-700 bg-amber-50" };
    }
    return { label: "High Risk Neonate", code: "HIGH", color: "text-rose-700 bg-rose-50" };
  }, [gestationWeeks, gestationDays, riskFactors]);

  // 3. Interpolation
  const interpolate = (x, x0, y0, x1, y1) => y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);

  // 4. Thresholds
  const thresholds = useMemo(() => {
    if (hol === null || hol < 12 || riskCategory.code === 'NA') return { photo: null, dvet: null };

    const photoCurve = [
      { h: 24, low: 12, med: 10, high: 8 },
      { h: 48, low: 15, med: 13, high: 11 },
      { h: 72, low: 18, med: 15, high: 13 },
      { h: 96, low: 21, med: 18, high: 15 },
      { h: 120, low: 21, med: 18, high: 15 } 
    ];

    const dvetCurve = [
      { h: 24, low: 19, med: 17, high: 15 },
      { h: 48, low: 22, med: 20, high: 18 },
      { h: 72, low: 24, med: 22, high: 19 },
      { h: 96, low: 25, med: 24, high: 22 }, 
      { h: 120, low: 25, med: 24, high: 22 } 
    ];

    const getLimit = (curve, riskCode, currentHol) => {
      let p0 = curve[0];
      let p1 = curve[1];
      
      if (currentHol < 24) return null;
      if (currentHol >= 96) return riskCode === 'LOW' ? curve[3].low : riskCode === 'MED' ? curve[3].med : curve[3].high;

      for (let i = 0; i < curve.length - 1; i++) {
        if (currentHol >= curve[i].h && currentHol <= curve[i+1].h) {
          p0 = curve[i];
          p1 = curve[i+1];
          break;
        }
      }

      const y0 = riskCode === 'LOW' ? p0.low : riskCode === 'MED' ? p0.med : p0.high;
      const y1 = riskCode === 'LOW' ? p1.low : riskCode === 'MED' ? p1.med : p1.high;

      return interpolate(currentHol, p0.h, y0, p1.h, y1);
    };

    return {
      photo: getLimit(photoCurve, riskCategory.code, hol),
      dvet: getLimit(dvetCurve, riskCategory.code, hol)
    };
  }, [hol, riskCategory]);

  // 5. Bhutani Nomogram
  const bhutaniZone = useMemo(() => {
    if (hol === null || hol < 18) return "N/A (Too Early)"; 
    
    const points = [
      { h: 24, p40: 4.0, p75: 6.0, p95: 8.0 },
      { h: 36, p40: 5.5, p75: 8.5, p95: 11.5 },
      { h: 48, p40: 7.5, p75: 10.5, p95: 13.5 },
      { h: 60, p40: 9.5, p75: 12.5, p95: 15.5 },
      { h: 72, p40: 11.0, p75: 14.5, p95: 17.0 },
      { h: 96, p40: 13.5, p75: 17.0, p95: 19.5 }
    ];

    let p0 = points[0];
    let p1 = points[1];

    if (hol >= 96) { p0 = points[5]; p1 = points[5]; } 
    else {
        for (let i = 0; i < points.length - 1; i++) {
            if (hol >= points[i].h && hol <= points[i+1].h) {
                p0 = points[i]; p1 = points[i+1]; break;
            }
        }
    }

    const getVal = (key) => interpolate(hol, p0.h, p0[key], p1.h, p1[key]);
    const val40 = getVal('p40');
    const val75 = getVal('p75');
    const val95 = getVal('p95');

    const tcbVal = parseFloat(bilirubin);
    if (isNaN(tcbVal)) return "Pending Input";

    if (tcbVal < val40) return "Low Risk Zone";
    if (tcbVal >= val40 && tcbVal < val75) return "Low Intermediate Risk Zone";
    if (tcbVal >= val75 && tcbVal < val95) return "High Intermediate Risk Zone";
    return "High Risk Zone";
  }, [hol, bilirubin]);

  // Output
  const generateReport = () => {
    const weeks = parseInt(gestationWeeks);
    const days = parseInt(gestationDays);

    if (!dob || !tob || !currentDate || !currentTime || isNaN(weeks) || hol === null) return "Incomplete Data";

    const tcbVal = parseFloat(bilirubin);
    const hasTcb = !isNaN(tcbVal);
    const formatDate = (dStr) => dStr.replace(/-/g, '/');

    const photoStatus = thresholds.photo && hasTcb
      ? (tcbVal >= thresholds.photo ? "ABOVE" : "BELOW")
      : "N/A";
    const photoLimitStr = thresholds.photo ? `(${thresholds.photo.toFixed(1)})` : "";

    const dvetStatus = thresholds.dvet && hasTcb
      ? (tcbVal >= thresholds.dvet ? "ABOVE" : "BELOW")
      : "N/A";
    const dvetLimitStr = thresholds.dvet ? `(${thresholds.dvet.toFixed(1)})` : "";
    const daysDisplay = isNaN(days) ? 0 : days;

    return `DOB: ${formatDate(dob)}
TOB: ${tob}
AOG: ${weeks} weeks ${daysDisplay}/7 days
HOL: ${Math.floor(hol)}
${riskCategory.label}

TCB: ${hasTcb ? tcbVal + ' mg/dL' : 'N/A'}
PHOTOLEVEL: ${photoStatus} ${photoLimitStr}
DVET level: ${dvetStatus} ${dvetLimitStr}
Bhutani Risk Zone: ${bhutaniZone}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Neonatal Hyperbilirubinemia Calculator</h1>
          </div>
          <p className="text-sm text-slate-500">
            Based on <span className="font-semibold text-slate-700">AAP 2004 Guidelines</span> for infants &ge;35 weeks.
          </p>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Section 1: Demographics */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Patient Details
            </h3>
            
            {/* GRID LAYOUT RESTORED & iOS STYLING FIXED */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Birth Date</label>
                <input 
                  type="date" 
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)}
                  // 'appearance-none' removes iOS gray bubble
                  // 'bg-white' ensures white background
                  // 'min-w-0' prevents flexbox overflow
                  className="w-full appearance-none bg-white p-2 h-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-w-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Birth Time</label>
                <input 
                  type="time" 
                  value={tob} 
                  onChange={(e) => setTob(e.target.value)}
                  className="w-full appearance-none bg-white p-2 h-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-w-0"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Gestational Age (AOG)</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center border border-slate-300 rounded-lg px-2 bg-white">
                  <input 
                    type="number" 
                    min="35" 
                    max="42" 
                    value={gestationWeeks} 
                    onChange={(e) => setGestationWeeks(e.target.value)}
                    placeholder="39"
                    className="w-full appearance-none p-2 h-10 text-sm outline-none bg-transparent"
                  />
                  <span className="text-xs text-slate-400 mr-2">weeks</span>
                </div>
                <div className="flex-1 flex items-center border border-slate-300 rounded-lg px-2 bg-white">
                  <input 
                    type="number" 
                    min="0" 
                    max="6" 
                    value={gestationDays} 
                    onChange={(e) => setGestationDays(e.target.value)}
                    placeholder="0"
                    className="w-full appearance-none p-2 h-10 text-sm outline-none bg-transparent"
                  />
                  <span className="text-xs text-slate-400 mr-2">days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Data */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
             <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Assessment
            </h3>

             <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Current Date</label>
                <input 
                  type="date" 
                  value={currentDate} 
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="w-full appearance-none bg-white p-2 h-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none min-w-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Current Time</label>
                <input 
                  type="time" 
                  value={currentTime} 
                  onChange={(e) => setCurrentTime(e.target.value)}
                  className="w-full appearance-none bg-white p-2 h-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none min-w-0"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">TCB / TSB (mg/dL)</label>
              <input 
                type="number" 
                step="0.1" 
                placeholder="e.g. 7.5"
                value={bilirubin}
                onChange={(e) => setBilirubin(e.target.value)}
                className="w-full appearance-none bg-white p-2 h-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            
            {/* TOGGLE FIXED: Added gap-4 and flex-1 to text to prevent squishing */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 gap-4">
              <div className="text-xs flex-1">
                <p className="font-semibold text-slate-700">Neurotoxicity Risk Factors</p>
                <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">Isoimmune disease, G6PD, asphyxia, sepsis, acidosis, albumin &lt; 3.0</p>
              </div>
              <button 
                onClick={() => setRiskFactors(!riskFactors)}
                className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out flex-shrink-0 ${riskFactors ? 'bg-red-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${riskFactors ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Generated Report Section */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-slate-800 p-4 flex justify-between items-center">
             <h3 className="text-white font-medium flex items-center gap-2">
               <Check className="w-4 h-4 text-emerald-400" />
               Generated Output
             </h3>
             <button 
               onClick={copyToClipboard}
               className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${
                 copied 
                   ? 'bg-emerald-600 text-white' 
                   : 'bg-slate-700 hover:bg-slate-600 text-white'
               }`}
             >
               {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
               {copied ? 'Copied!' : 'Copy Text'}
             </button>
          </div>
          
          <div className="p-6 bg-slate-50">
            <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800 bg-white p-4 rounded-lg border border-slate-200 shadow-inner overflow-x-auto">
              {generateReport()}
            </pre>
          </div>

          {/* Visual Helpers */}
          <div className="p-4 bg-white border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1">
               <span className="text-slate-500">Risk Stratification</span>
               <span className={`font-bold px-2 py-1 rounded w-fit ${
                 riskCategory.color || 'bg-slate-100 text-slate-500'
               }`}>
                 {riskCategory.label}
               </span>
            </div>
            <div className="flex flex-col gap-1">
               <span className="text-slate-500">Calculated HOL</span>
               <span className="font-bold text-slate-700">{hol !== null ? hol.toFixed(1) + ' hours' : '--'}</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-100">
           <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
           <p>
             <strong>Disclaimer:</strong> This tool uses linear interpolation of <strong>AAP 2004</strong> guidelines. It is a clinical aid, not a medical device. Always verify with official charts/EMR.
           </p>
        </div>

      </div>
    </div>
  );
}
