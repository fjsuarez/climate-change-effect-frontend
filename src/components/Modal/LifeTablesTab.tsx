import React, { useState, useMemo } from 'react';

interface LifeTableData {
  age: number;
  baseline: {
    q: number; // Death probability
    l: number; // Number of lives
    e: number; // Life expectancy
  };
  adjusted: {
    q: number; // Death probability
    l: number; // Number of lives
    e: number; // Life expectancy
  };
}

// Dummy data generator for 2050
const generateDummyData = (): LifeTableData[] => {
  const data: LifeTableData[] = [];
  let l_base = 100000;
  let l_adj = 100000;
  
  for (let age = 0; age <= 100; age++) {
    // Simplified mortality model
    // Base q increases with age
    const q_base = Math.min(1, 0.0005 + Math.exp((age - 90) * 0.1) * 0.15);
    
    // Adjusted q (temperature effect) - slightly higher for dummy purposes
    // In reality this would come from the backend based on risk curves
    const q_adj = Math.min(1, q_base * (1 + (Math.random() * 0.05 - 0.01))); 

    // Calculate life expectancy (simplified, just sum of remaining years probability)
    // This is a very rough approximation for dummy data
    const e_base = Math.max(0, 85 - age * 0.8); 
    const e_adj = Math.max(0, 84.5 - age * 0.8);

    data.push({
      age,
      baseline: {
        q: q_base,
        l: Math.round(l_base),
        e: e_base
      },
      adjusted: {
        q: q_adj,
        l: Math.round(l_adj),
        e: e_adj
      }
    });

    l_base = l_base * (1 - q_base);
    l_adj = l_adj * (1 - q_adj);
  }
  return data;
};

const DUMMY_DATA = generateDummyData();

export const LifeTablesTab = ({ nutsId }: { nutsId: string }) => {
  const [annuityShare, setAnnuityShare] = useState<number>(50);
  const [lifeInsuranceShare, setLifeInsuranceShare] = useState<number>(50);
  const [portfolioSize, setPortfolioSize] = useState<number>(10000000); // 10M default
  const [isExpanded, setIsExpanded] = useState(false);

  // Ensure shares sum to 100 (or handle it in UI)
  const handleAnnuityChange = (val: number) => {
    setAnnuityShare(val);
    setLifeInsuranceShare(100 - val);
  };

  const handleLifeInsuranceChange = (val: number) => {
    setLifeInsuranceShare(val);
    setAnnuityShare(100 - val);
  };

  const displayedData = useMemo(() => {
    if (isExpanded) return DUMMY_DATA;
    // Show every 10th year when collapsed
    return DUMMY_DATA.filter(d => d.age % 10 === 0);
  }, [isExpanded]);

  // Helper for cell styling
  const getColorClass = (val1: number, val2: number, type: 'q' | 'l' | 'e') => {
    // val1 = adjusted, val2 = baseline
    
    // Fix precision issues for comparison to match display
    let v1 = val1;
    let v2 = val2;
    
    if (type === 'q') {
      v1 = Number(val1.toFixed(5));
      v2 = Number(val2.toFixed(5));
    } else if (type === 'e') {
      v1 = Number(val1.toFixed(2));
      v2 = Number(val2.toFixed(2));
    }
    
    if (v1 === v2) return '';
    
    // For q: higher is bad (red)
    // For l, e: lower is bad (red)
    const isWorse = type === 'q' ? v1 > v2 : v1 < v2;
    
    return isWorse ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  // Calculate financial impact
  // Logic: 
  // Longer life (e_adj > e_base) -> Loss in Annuities, Profit in Life Insurance
  // Shorter life (e_adj < e_base) -> Profit in Annuities, Loss in Life Insurance
  
  const financialImpact = useMemo(() => {
    // Aggregate difference in life expectancy at birth (age 0)
    const e0_base = DUMMY_DATA[0].baseline.e;
    const e0_adj = DUMMY_DATA[0].adjusted.e;
    const diff_percent = (e0_adj - e0_base) / e0_base;

    // Impact on Annuities: 
    // If people live 1% longer, annuity costs increase by roughly 1% (simplified)
    // Loss = negative impact
    const annuityImpact = -1 * diff_percent * (portfolioSize * (annuityShare / 100));

    // Impact on Life Insurance:
    // If people live 1% longer, claims are delayed, profit increases
    // Profit = positive impact
    const lifeInsuranceImpact = diff_percent * (portfolioSize * (lifeInsuranceShare / 100));

    return {
      annuity: annuityImpact,
      lifeInsurance: lifeInsuranceImpact,
      total: annuityImpact + lifeInsuranceImpact,
      e0_diff: e0_adj - e0_base
    };
  }, [annuityShare, lifeInsuranceShare, portfolioSize]);

  return (
    <div className="space-y-6">
      {/* Financial Impact Calculator */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Financial Impact Calculator</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portfolio Size (€)
              </label>
              <input
                type="text"
                value={portfolioSize.toLocaleString()}
                onChange={(e) => {
                  // Remove non-numeric chars and parse
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPortfolioSize(val ? parseInt(val, 10) : 0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annuities (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={annuityShare}
                  onChange={(e) => handleAnnuityChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Life Insurance (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={lifeInsuranceShare}
                  onChange={(e) => handleLifeInsuranceChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Life Expectancy Change (at birth)</span>
              <span className={`font-semibold ${financialImpact.e0_diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {financialImpact.e0_diff > 0 ? '+' : ''}{financialImpact.e0_diff.toFixed(2)} years
              </span>
            </div>
            
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Annuities Impact</span>
                <span className={`font-medium ${financialImpact.annuity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialImpact.annuity >= 0 ? '+' : ''}{Math.round(financialImpact.annuity).toLocaleString()} €
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Life Insurance Impact</span>
                <span className={`font-medium ${financialImpact.lifeInsurance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialImpact.lifeInsurance >= 0 ? '+' : ''}{Math.round(financialImpact.lifeInsurance).toLocaleString()} €
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold">
                <span>Total Impact</span>
                <span className={`${financialImpact.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialImpact.total >= 0 ? '+' : ''}{Math.round(financialImpact.total).toLocaleString()} €
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Life Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Period Life Table (2050 Projection)</h3>
          <p className="text-sm text-gray-500">Comparison of baseline vs temperature-adjusted mortality</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th rowSpan={2} className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider border-r">Age</th>
                <th colSpan={3} className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider border-r bg-blue-50/50">Baseline</th>
                <th colSpan={3} className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider bg-red-50/50">Temperature Adjusted</th>
              </tr>
              <tr>
                {/* Baseline Columns */}
                <th className="px-4 py-2 text-right font-medium text-gray-500 border-r bg-blue-50/50" title="Death Probability">q(x)</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500 border-r bg-blue-50/50" title="Number of Lives">l(x)</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500 border-r bg-blue-50/50" title="Life Expectancy">e(x)</th>
                
                {/* Adjusted Columns */}
                <th className="px-4 py-2 text-right font-medium text-gray-500 border-r bg-red-50/50" title="Death Probability">q(x)</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500 border-r bg-red-50/50" title="Number of Lives">l(x)</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500 bg-red-50/50" title="Life Expectancy">e(x)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedData.map((row) => (
                <tr key={row.age} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 border-r">{row.age}</td>
                  
                  {/* Baseline Data */}
                  <td className="px-4 py-2 whitespace-nowrap text-right text-gray-600 border-r">{row.baseline.q.toFixed(5)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-gray-600 border-r">{row.baseline.l.toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-gray-600 border-r">{row.baseline.e.toFixed(2)}</td>
                  
                  {/* Adjusted Data */}
                  <td className={`px-4 py-2 whitespace-nowrap text-right border-r ${getColorClass(row.adjusted.q, row.baseline.q, 'q')}`}>
                    {row.adjusted.q.toFixed(5)}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-right border-r ${getColorClass(row.adjusted.l, row.baseline.l, 'l')}`}>
                    {row.adjusted.l.toLocaleString()}
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-right ${getColorClass(row.adjusted.e, row.baseline.e, 'e')}`}>
                    {row.adjusted.e.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {isExpanded ? 'Collapse Table' : 'Show Full Table (100 rows)'}
          </button>
        </div>
      </div>
    </div>
  );
};
