'use client';

import { EconomicParams } from '@/types/economics/economic';

interface ParameterSlidersProps {
  parameters: EconomicParams;
  onChange: (params: EconomicParams) => void;
}

export default function ParameterSliders({ parameters, onChange }: ParameterSlidersProps) {
  const updateParameter = (path: string, value: number | string) => {
    const keys = path.split('.');
    const newParams = { ...parameters };
    
    let current: any = newParams;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    onChange(newParams);
  };

  const SliderGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="parameter-panel">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const Slider = ({ 
    label, 
    path, 
    min, 
    max, 
    step = 1, 
    suffix = '',
    value 
  }: { 
    label: string; 
    path: string; 
    min: number; 
    max: number; 
    step?: number; 
    suffix?: string;
    value: number;
  }) => (
    <div className="slider-container">
      <div className="slider-label">
        <span>{label}</span>
        <span className="font-mono text-sm">
          {value.toFixed(step < 1 ? 2 : 0)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => updateParameter(path, parseFloat(e.target.value))}
        className="slider-input"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <SliderGroup title="AI Impact">
        <Slider
          label="AI Productivity Gain"
          path="aiProductivityGain"
          min={0}
          max={200}
          suffix="%"
          value={parameters.aiProductivityGain}
        />
      </SliderGroup>

      <SliderGroup title="AI Substitution by Role">
        <Slider
          label="Junior Developers"
          path="aiSubstitutionByRole.juniorDev"
          min={0}
          max={80}
          suffix="%"
          value={parameters.aiSubstitutionByRole.juniorDev}
        />
        <Slider
          label="Mid-level Developers"
          path="aiSubstitutionByRole.midDev"
          min={0}
          max={60}
          suffix="%"
          value={parameters.aiSubstitutionByRole.midDev}
        />
        <Slider
          label="Senior Developers"
          path="aiSubstitutionByRole.seniorDev"
          min={0}
          max={40}
          suffix="%"
          value={parameters.aiSubstitutionByRole.seniorDev}
        />
        <Slider
          label="Architects"
          path="aiSubstitutionByRole.architect"
          min={0}
          max={20}
          suffix="%"
          value={parameters.aiSubstitutionByRole.architect}
        />
        <Slider
          label="DevOps Engineers"
          path="aiSubstitutionByRole.devOps"
          min={0}
          max={50}
          suffix="%"
          value={parameters.aiSubstitutionByRole.devOps}
        />
        <Slider
          label="Frontend Developers"
          path="aiSubstitutionByRole.frontend"
          min={0}
          max={70}
          suffix="%"
          value={parameters.aiSubstitutionByRole.frontend}
        />
        <Slider
          label="Backend Developers"
          path="aiSubstitutionByRole.backend"
          min={0}
          max={40}
          suffix="%"
          value={parameters.aiSubstitutionByRole.backend}
        />
        <Slider
          label="Full-stack Developers"
          path="aiSubstitutionByRole.fullStack"
          min={0}
          max={50}
          suffix="%"
          value={parameters.aiSubstitutionByRole.fullStack}
        />
        <Slider
          label="Mobile Developers"
          path="aiSubstitutionByRole.mobile"
          min={0}
          max={60}
          suffix="%"
          value={parameters.aiSubstitutionByRole.mobile}
        />
        <Slider
          label="Data Scientists"
          path="aiSubstitutionByRole.dataScience"
          min={-20}
          max={30}
          suffix="%"
          value={parameters.aiSubstitutionByRole.dataScience}
        />
      </SliderGroup>

      <SliderGroup title="New AI-Complementary Roles">
        <Slider
          label="Prompt Engineering"
          path="aiComplementaryRoles.promptEngineering"
          min={0}
          max={20000}
          step={1000}
          value={parameters.aiComplementaryRoles.promptEngineering}
        />
        <Slider
          label="AI Systems Integration"
          path="aiComplementaryRoles.aiSystemsIntegration"
          min={0}
          max={25000}
          step={1000}
          value={parameters.aiComplementaryRoles.aiSystemsIntegration}
        />
        <Slider
          label="AI Ethics & Compliance"
          path="aiComplementaryRoles.aiEthicsCompliance"
          min={0}
          max={15000}
          step={1000}
          value={parameters.aiComplementaryRoles.aiEthicsCompliance}
        />
        <Slider
          label="Human-AI Interface"
          path="aiComplementaryRoles.humanAiInterface"
          min={0}
          max={15000}
          step={1000}
          value={parameters.aiComplementaryRoles.humanAiInterface}
        />
        <Slider
          label="AI Training & Tuning"
          path="aiComplementaryRoles.aiTraining"
          min={0}
          max={20000}
          step={1000}
          value={parameters.aiComplementaryRoles.aiTraining}
        />
      </SliderGroup>

      <SliderGroup title="Economic Environment">
        <Slider
          label="GDP Growth Rate"
          path="gdpGrowth"
          min={-2}
          max={6}
          step={0.1}
          suffix="%"
          value={parameters.gdpGrowth}
        />
        <Slider
          label="Interest Rates"
          path="interestRates"
          min={0}
          max={10}
          step={0.1}
          suffix="%"
          value={parameters.interestRates}
        />
        <Slider
          label="VC Availability"
          path="ventureCapitalAvailability"
          min={0.2}
          max={2.0}
          step={0.1}
          suffix="x"
          value={parameters.ventureCapitalAvailability}
        />
        <Slider
          label="Wage Elasticity"
          path="wageElasticity"
          min={-0.8}
          max={-0.2}
          step={0.05}
          value={parameters.wageElasticity}
        />
        <Slider
          label="Geographic Arbitrage"
          path="geographicArbitrage"
          min={0}
          max={0.5}
          step={0.05}
          suffix="%"
          value={parameters.geographicArbitrage}
        />
      </SliderGroup>

      <SliderGroup title="Education Pipeline">
        <Slider
          label="Graduation Rate Growth"
          path="educationPipeline.graduationRate"
          min={-0.05}
          max={0.15}
          step={0.01}
          suffix=""
          value={parameters.educationPipeline.graduationRate}
        />
        <Slider
          label="Bootcamp Growth"
          path="educationPipeline.bootcampGrowth"
          min={0}
          max={0.3}
          step={0.01}
          suffix=""
          value={parameters.educationPipeline.bootcampGrowth}
        />
        <Slider
          label="University Capacity"
          path="educationPipeline.universityCapacity"
          min={0.5}
          max={2.0}
          step={0.1}
          suffix="x"
          value={parameters.educationPipeline.universityCapacity}
        />
        <Slider
          label="Skills Training Adoption"
          path="educationPipeline.skillsTrainingAdoption"
          min={0}
          max={1}
          step={0.05}
          suffix=""
          value={parameters.educationPipeline.skillsTrainingAdoption}
        />
      </SliderGroup>
    </div>
  );
}