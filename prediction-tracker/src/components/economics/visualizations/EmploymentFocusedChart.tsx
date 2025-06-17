'use client';

import { useMemo } from 'react';
import { EconomicParams } from '@/types/economics/economic';
import { AICapabilityModel } from '@/types/economics/ai';
import { projectTimeSeriesOutcome } from '@/utils/economics/economics';
import { formatNumberForDisplay } from '@/utils/economics/visualization';

interface EmploymentFocusedChartProps {
  parameters: EconomicParams;
  aiCapabilities: AICapabilityModel;
}

export default function EmploymentFocusedChart({ parameters, aiCapabilities }: EmploymentFocusedChartProps) {
  const analysis = useMemo(() => {
    const years = [2025, 2026, 2027, 2028, 2029, 2030];
    const outcomes = projectTimeSeriesOutcome(parameters, aiCapabilities, years);
    
    const projections = years.map((year, i) => ({
      year,
      employment: outcomes[i].employment,
      demandByRole: outcomes[i].demandByRole,
    }));

    // Focus on key timeframes
    const current = projections[0]; // 2025
    const midTerm = projections[4];  // 2029 (4 years)
    const longTerm = projections[5]; // 2030 (5 years)
    
    // Calculate changes
    const change4yr = ((midTerm.employment - current.employment) / current.employment) * 100;
    const change5yr = ((longTerm.employment - current.employment) / current.employment) * 100;
    
    // Role-level analysis
    const roleAnalysis = Object.keys(current.demandByRole).map(role => {
      const currentDemand = current.demandByRole[role];
      const futureDemand = midTerm.demandByRole[role];
      const change = ((futureDemand - currentDemand) / currentDemand) * 100;
      
      return {
        role,
        current: currentDemand,
        future: futureDemand,
        change,
        category: role.includes('ai') || role.includes('prompt') || role.includes('Training') ? 'AI-Related' : 'Traditional'
      };
    }).sort((a, b) => b.change - a.change); // Sort by biggest winners first

    // Get traditional vs AI roles totals
    const traditionalRoles = roleAnalysis.filter(r => r.category === 'Traditional');
    const aiRoles = roleAnalysis.filter(r => r.category === 'AI-Related');
    
    const traditionalCurrent = traditionalRoles.reduce((sum, role) => sum + role.current, 0);
    const traditionalFuture = traditionalRoles.reduce((sum, role) => sum + role.future, 0);
    const traditionalChange = ((traditionalFuture - traditionalCurrent) / traditionalCurrent) * 100;
    
    const aiCurrent = aiRoles.reduce((sum, role) => sum + role.current, 0);
    const aiFuture = aiRoles.reduce((sum, role) => sum + role.future, 0);
    const aiChange = aiCurrent > 0 ? ((aiFuture - aiCurrent) / aiCurrent) * 100 : 0;

    return {
      projections,
      current,
      midTerm,
      longTerm,
      change4yr,
      change5yr,
      roleAnalysis,
      traditionalChange,
      aiChange,
      traditionalCurrent,
      traditionalFuture,
      aiCurrent,
      aiFuture
    };
  }, [parameters, aiCapabilities]);

  const getChangeColor = (change: number) => {
    if (change > 15) return 'text-green-700 bg-green-100 border-green-300';
    if (change > 5) return 'text-green-600 bg-green-50 border-green-200';
    if (change > -5) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (change > -15) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-700 bg-red-100 border-red-300';
  };

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      'juniorDev': 'Junior Developers',
      'midDev': 'Mid-level Developers', 
      'seniorDev': 'Senior Developers',
      'architect': 'Software Architects',
      'devOps': 'DevOps Engineers',
      'frontend': 'Frontend Developers',
      'backend': 'Backend Developers',
      'fullStack': 'Full-stack Developers',
      'mobile': 'Mobile Developers',
      'dataScience': 'Data Scientists',
      'promptEngineering': 'Prompt Engineers',
      'aiSystemsIntegration': 'AI Systems Integration',
      'aiEthicsCompliance': 'AI Ethics & Compliance',
      'humanAiInterface': 'Human-AI Interface',
      'aiTraining': 'AI Training & Tuning'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Overall Impact Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Software Engineering Employment Impact (2025-2029)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {formatNumberForDisplay(analysis.current.employment, 'compact')}
            </div>
            <div className="text-sm text-gray-600 mb-1">Current (2025)</div>
            <div className="text-xs text-gray-500">Total Software Engineers</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {formatNumberForDisplay(analysis.midTerm.employment, 'compact')}
            </div>
            <div className="text-sm text-gray-600 mb-1">Projected (2029)</div>
            <div className={`text-lg font-semibold ${analysis.change4yr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analysis.change4yr >= 0 ? '+' : ''}{analysis.change4yr.toFixed(1)}% change
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {Math.abs(analysis.midTerm.employment - analysis.current.employment) > 1000 
                ? formatNumberForDisplay(Math.abs(analysis.midTerm.employment - analysis.current.employment), 'compact')
                : Math.abs(analysis.midTerm.employment - analysis.current.employment).toFixed(0)
              }
            </div>
            <div className="text-sm text-gray-600 mb-1">
              {analysis.change4yr >= 0 ? 'Jobs Added' : 'Jobs Lost'}
            </div>
            <div className="text-xs text-gray-500">Net Change (4 years)</div>
          </div>
        </div>
      </div>

      {/* Traditional vs AI Roles */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Traditional vs AI-Related Roles
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-4 rounded-lg border-2 ${getChangeColor(analysis.traditionalChange)}`}>
            <h5 className="font-semibold mb-3">Traditional Software Engineering</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">2025:</span>
                <span className="font-medium">{formatNumberForDisplay(analysis.traditionalCurrent, 'compact')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">2029:</span>
                <span className="font-medium">{formatNumberForDisplay(analysis.traditionalFuture, 'compact')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Change:</span>
                <span className="text-lg font-bold">
                  {analysis.traditionalChange >= 0 ? '+' : ''}{analysis.traditionalChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${getChangeColor(analysis.aiChange)}`}>
            <h5 className="font-semibold mb-3">AI-Related Roles</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">2025:</span>
                <span className="font-medium">{formatNumberForDisplay(analysis.aiCurrent, 'compact')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">2029:</span>
                <span className="font-medium">{formatNumberForDisplay(analysis.aiFuture, 'compact')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Change:</span>
                <span className="text-lg font-bold">
                  {analysis.aiChange >= 0 ? '+' : ''}{analysis.aiChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-by-Role Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Impact by Role (2025 → 2029)
        </h4>
        
        <div className="space-y-3">
          {analysis.roleAnalysis.map((role) => (
            <div key={role.role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{getRoleName(role.role)}</div>
                <div className="text-sm text-gray-600">
                  {formatNumberForDisplay(role.current, 'compact')} → {formatNumberForDisplay(role.future, 'compact')}
                </div>
              </div>
              
              {/* Visual bar */}
              <div className="flex-1 mx-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      role.change > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, Math.abs(role.change) * 2)}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium min-w-20 text-center ${getChangeColor(role.change)}`}>
                {role.change >= 0 ? '+' : ''}{role.change.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <h4 className="text-lg font-semibold text-yellow-800 mb-3">Key Insights</h4>
        <div className="space-y-2 text-sm text-yellow-700">
          {analysis.change4yr > 10 && (
            <p>• <strong>Strong Growth:</strong> Software engineering employment expected to grow significantly, driven by AI productivity gains and new role creation.</p>
          )}
          {analysis.change4yr < -5 && (
            <p>• <strong>Contraction:</strong> AI substitution effects outweigh productivity gains and new role creation in this scenario.</p>
          )}
          {analysis.traditionalChange < -10 && (
            <p>• <strong>Traditional Role Decline:</strong> Established software engineering roles face significant displacement from AI automation.</p>
          )}
          {analysis.aiChange > 50 && (
            <p>• <strong>AI Role Boom:</strong> New AI-related positions growing rapidly as companies invest in AI capabilities and integration.</p>
          )}
          {Math.abs(analysis.change4yr) < 5 && (
            <p>• <strong>Balanced Scenario:</strong> AI displacement roughly balanced by productivity gains and new role creation.</p>
          )}
        </div>
      </div>
    </div>
  );
}